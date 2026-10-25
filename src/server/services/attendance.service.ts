import { supabase } from '~/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isSessionLockedForTutor, calculateAttendancePercentage } from '~/lib/attendance-helpers'
import { buildAttendanceNotifications } from '~/lib/attendance-notifications'
import type { AttendanceEntry, AttendanceStatus } from '~/lib/admin-store'

export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export interface SaveSessionAttendanceInput {
  sessionId: string
  topic: string
  entries: AttendanceEntry[]
}

export interface StudentAttendanceSummary {
  studentId: string
  hadirCount: number
  sakitCount: number
  izinCount: number
  alpaCount: number
  totalCompleted: number
  attendanceRate: number
}

interface SessionWithScheduleRow {
  id: string
  topic: string | null
  schedules: {
    subject_name: string | null
    day_of_week: string | null
    start_time: string | null
  } | null
}

interface StudentParentRow {
  id: string
  profile_id: string | null
  parents: { id: string; profile_id: string | null } | null
}

/**
 * Klien DB dengan hak istimewa untuk operasi tulis notifikasi (insert & delete)
 * yang melewati RLS. Fallback ke klien anon bila resolusi admin gagal.
 */
async function getAttendanceDbClient(): Promise<SupabaseClient> {
  try {
    const { getIsolatedAdminClient } = await import('./billing.service')
    return await getIsolatedAdminClient()
  } catch {
    return supabase
  }
}

export const attendanceService = {
  /**
   * Menyimpan entri presensi siswa per sesi ke tabel attendances dan menandai sesi selesai di Supabase.
   * Menegakkan aturan Audit Lock & 2h Grace Period.
   */
  async saveSessionAttendance(
    input: SaveSessionAttendanceInput
  ): Promise<ServerResult<boolean>> {
    const { sessionId, topic, entries } = input

    if (!sessionId) {
      return { success: false, error: 'ID sesi tidak valid.' }
    }

    // 1. Pencegahan duplikasi siswa dalam satu payload
    const seenStudentIds = new Set<string>()
    for (const entry of entries) {
      if (seenStudentIds.has(entry.studentId)) {
        return {
          success: false,
          error: `Pencegahan duplikasi presensi: Siswa "${entry.studentName || entry.studentId}" memiliki lebih dari satu entri presensi.`,
          code: 'DUPLICATE_STUDENT_ENTRY',
        }
      }
      seenStudentIds.add(entry.studentId)
    }

    const isUUID = (val: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

    // Jika ID sesi bukan UUID (data sesi lokal mock), validasi telah lolos
    if (!isUUID(sessionId)) {
      return { success: true, data: true }
    }

    // 2. Ambil data sesi untuk verifikasi status
    const { data: sessionData, error: sessionErr } = await supabase
      .from('sessions')
      .select('id, session_date, is_completed, completed_at, created_at')
      .eq('id', sessionId)
      .single()

    if (sessionErr || !sessionData) {
      return { success: false, error: `Sesi dengan ID "${sessionId}" tidak ditemukan di database.` }
    }

    const wasCompleted = Boolean(sessionData.is_completed)

    // 3. Verifikasi Audit Lock & 2h Grace Period (dihitung sejak sesi diselesaikan)
    const isLocked = isSessionLockedForTutor({
      isCompleted: sessionData.is_completed,
      sessionDate: sessionData.session_date,
      completedAt: sessionData.completed_at,
    })

    if (isLocked) {
      return {
        success: false,
        error: 'Pencegahan manipulasi presensi: Sesi telah selesai lebih dari 2 jam dan telah dikunci untuk menjaga integritas data presensi.',
        code: 'SESSION_AUDIT_LOCKED',
      }
    }

    // 4. Update status sesi bimbingan di tabel sessions
    const sessionUpdate: Record<string, unknown> = {
      topic: topic.trim(),
      is_completed: true,
    }
    if (!wasCompleted) {
      sessionUpdate.completed_at = new Date().toISOString()
    }

    const { error: updateSesErr } = await supabase
      .from('sessions')
      .update(sessionUpdate)
      .eq('id', sessionId)

    if (updateSesErr) {
      return { success: false, error: updateSesErr.message }
    }

    // 5. Upsert / simpan entri presensi ke tabel attendances
    const validEntries = entries.filter((e) => isUUID(e.studentId))
    if (validEntries.length > 0) {
      const attendancePayloads = validEntries.map((entry) => ({
        session_id: sessionId,
        student_id: entry.studentId,
        status: entry.status,
        notes: entry.note || (entry as any).notes || null,
      }))

      const { error: upsertErr } = await supabase
        .from('attendances')
        .upsert(attendancePayloads, { onConflict: 'session_id,student_id' })

      if (upsertErr) {
        return { success: false, error: upsertErr.message }
      }

      // 6. Notifikasi otomatis ke orang tua/wali pada penyimpanan PERTAMA sesi ini
      //    untuk SEMUA status (hadir/sakit/izin/alpa), anti-spam & anti-duplikat.
      if (!wasCompleted) {
        await this.createAttendanceNotifications(sessionId, validEntries)
      }
    }

    return { success: true, data: true }
  },

  /**
   * Membuat notifikasi presensi ke orang tua/wali untuk seluruh entri sesi.
   * Mengganti notifikasi presensi lama milik sesi yang sama agar tidak menumpuk.
   */
  async createAttendanceNotifications(
    sessionId: string,
    validEntries: AttendanceEntry[]
  ): Promise<void> {
    try {
      const { data: sessionRowRaw } = await supabase
        .from('sessions')
        .select('id, topic, schedules ( subject_name, day_of_week, start_time )')
        .eq('id', sessionId)
        .single()
      const sessionRow = sessionRowRaw as unknown as SessionWithScheduleRow | null

      const studentIds = validEntries.map((e) => e.studentId)
      const { data: studentRowsRaw } = await supabase
        .from('students')
        .select('id, profile_id, parents ( id, profile_id )')
        .in('id', studentIds)
      const studentRows = (studentRowsRaw || []) as unknown as StudentParentRow[]

      const parentByStudent = new Map<string, string>()
      for (const s of studentRows) {
        const parentProfileId = s.parents?.profile_id
        if (s.id && parentProfileId) parentByStudent.set(s.id, parentProfileId)
      }

      const drafts = buildAttendanceNotifications({
        session: {
          id: sessionId,
          subjectName: sessionRow?.schedules?.subject_name || sessionRow?.topic || undefined,
          dayOfWeek: sessionRow?.schedules?.day_of_week || undefined,
          startTime: sessionRow?.schedules?.start_time || undefined,
        },
        entries: validEntries.map((e) => ({
          studentId: e.studentId,
          studentName: e.studentName,
          status: e.status,
        })),
        recipients: Array.from(parentByStudent.entries()).map(([studentId, parentProfileId]) => ({
          studentId,
          parentProfileId,
        })),
      })

      if (drafts.length === 0) return

      const dbClient = await getAttendanceDbClient()

      // Ganti notifikasi presensi lama untuk sesi ini (idempoten, anti-duplikat).
      await dbClient
        .from('notifications')
        .delete()
        .eq('type', 'attendance')
        .eq('metadata->>sessionId', sessionId)

      await dbClient.from('notifications').insert(
        drafts.map((d) => ({
          user_id: d.userId,
          title: d.title,
          message: d.message,
          type: d.type,
          link_url: d.linkUrl,
          metadata: d.metadata,
        }))
      )
    } catch (notifErr) {
      console.warn('[WARN] Gagal mencatat notifikasi presensi ke orang tua:', notifErr)
    }
  },

  /**
   * Mengambil rekapitulasi kehadiran seorang siswa
   */
  async getStudentAttendanceSummary(
    studentId: string
  ): Promise<ServerResult<StudentAttendanceSummary>> {
    if (!studentId) {
      return { success: false, error: 'ID siswa tidak valid.' }
    }

    const { data, error } = await supabase
      .from('attendances')
      .select('id, status, session_id, sessions ( is_completed )')
      .eq('student_id', studentId)

    if (error) {
      return { success: false, error: error.message }
    }

    let hadirCount = 0
    let sakitCount = 0
    let izinCount = 0
    let alpaCount = 0

    const rows = (data || []) as any[]
    for (const row of rows) {
      const st = (row.status || '').toLowerCase()
      if (st === 'hadir') hadirCount++
      else if (st === 'sakit') sakitCount++
      else if (st === 'izin') izinCount++
      else if (st === 'alpa') alpaCount++
    }

    const totalCompleted = hadirCount + sakitCount + izinCount + alpaCount
    const attendanceRate = calculateAttendancePercentage(hadirCount, totalCompleted)

    return {
      success: true,
      data: {
        studentId,
        hadirCount,
        sakitCount,
        izinCount,
        alpaCount,
        totalCompleted,
        attendanceRate,
      },
    }
  },
}
