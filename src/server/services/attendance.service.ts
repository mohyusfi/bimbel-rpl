import { supabase } from '~/lib/supabase/client'
import { isSessionLockedForTutor, calculateAttendancePercentage } from '~/lib/attendance-helpers'
import { ensureAdminSession } from './master-data.service'
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

export const attendanceService = {
  /**
   * Menyimpan entri presensi siswa per sesi ke tabel attendances dan menandai sesi selesai di Supabase.
   * Menegakkan aturan Audit Lock & 24h Grace Period.
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

    await ensureAdminSession()

    // 2. Ambil data sesi untuk verifikasi status
    const { data: sessionData, error: sessionErr } = await supabase
      .from('sessions')
      .select('id, session_date, is_completed, created_at')
      .eq('id', sessionId)
      .single()

    if (sessionErr || !sessionData) {
      return { success: false, error: `Sesi dengan ID "${sessionId}" tidak ditemukan di database.` }
    }

    // 3. Verifikasi Audit Lock & 24h Grace Period
    const isLocked = isSessionLockedForTutor({
      isCompleted: sessionData.is_completed,
      sessionDate: sessionData.session_date,
      completedAt: sessionData.created_at,
    })

    if (isLocked) {
      return {
        success: false,
        error: 'Pencegahan manipulasi presensi: Sesi telah selesai lebih dari 24 jam dan telah dikunci untuk menjaga integritas data presensi.',
        code: 'SESSION_AUDIT_LOCKED',
      }
    }

    // 4. Update status sesi bimbingan di tabel sessions
    const { error: updateSesErr } = await supabase
      .from('sessions')
      .update({
        topic: topic.trim(),
        is_completed: true,
      })
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

      // 6. Notifikasi otomatis untuk siswa yang berstatus Alpa (in-app & Web Push)
      const alpaEntries = validEntries.filter(
        (e) => e.status === 'alpa' || (e.status as string).toLowerCase() === 'alpa'
      )

      if (alpaEntries.length > 0) {
        try {
          const alpaStudentIds = alpaEntries.map((e) => e.studentId)
          const { data: studentRows } = await supabase
            .from('students')
            .select('id, profile_id, parent_id, parents ( id, profile_id )')
            .in('id', alpaStudentIds)

          const notifRows: any[] = []
          const targetParentProfileIds: string[] = []

          if (studentRows && studentRows.length > 0) {
            for (const s of studentRows) {
              const parentPid = (s as any).parents?.profile_id || s.parent_id
              if (parentPid) {
                targetParentProfileIds.push(parentPid)
                notifRows.push({
                  user_id: parentPid,
                  title: 'Peringatan Ketidakhadiran Siswa (Alpa)',
                  message: `Putra/Putri Anda tercatat tidak hadir (Alpa) pada sesi ${topic || 'bimbingan belajar'}.`,
                  type: 'attendance',
                  link_url: '/parent/kehadiran',
                  metadata: { sessionId, studentId: s.id },
                })
              }
              if (s.profile_id || s.id) {
                notifRows.push({
                  user_id: s.profile_id || s.id,
                  title: 'Peringatan Ketidakhadiran Siswa (Alpa)',
                  message: `Anda tercatat tidak hadir (Alpa) pada sesi ${topic || 'bimbingan belajar'}.`,
                  type: 'attendance',
                  link_url: '/student/kehadiran',
                  metadata: { sessionId, studentId: s.id },
                })
              }
            }
          }

          if (notifRows.length > 0) {
            await supabase.from('notifications').insert(notifRows)
          }
        } catch (alpaNotifErr) {
          console.warn('[WARN] Gagal mencatat notifikasi presensi Alpa:', alpaNotifErr)
        }
      }
    }

    return { success: true, data: true }
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
