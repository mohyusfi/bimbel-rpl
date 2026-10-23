import { supabase } from '~/lib/supabase/client'
import { ensureAdminSession } from './master-data.service'
import { formatLocalDate } from '~/lib/attendance-helpers'

export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; conflict?: ConflictValidationResult }

export const DAY_INDEX_MAP: Record<string, number> = {
  Minggu: 0,
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
}

export interface ScheduleCandidate {
  id?: string
  classId?: string
  className?: string
  subjectName?: string
  roomId: string
  roomName?: string
  tutorId: string
  tutorName?: string
  dayOfWeek: string
  startTime: string
  endTime: string
}

export interface ScheduleItem {
  id: string
  classId: string
  className?: string
  subjectName: string
  tutorId: string
  tutorName?: string
  roomId: string
  roomName?: string
  dayOfWeek: string
  startTime: string
  endTime: string
  createdAt?: string | Date
}

export interface ConflictValidationResult {
  hasConflict: boolean
  errorMessage?: string
  timeError?: string
  roomConflict?: {
    id: string
    roomName: string
    className?: string
    startTime: string
    endTime: string
  }
  tutorConflict?: {
    id: string
    tutorName: string
    className?: string
    startTime: string
    endTime: string
  }
  suggestedRooms?: Array<{ id: string; name: string }>
}

/**
 * Validasi aturan anti-bentrok SCHED-02 murni (keduanya diuji terhadap jadwal yang ada):
 * Bentrok jika: (Target_A == Target_B) && (Hari_A == Hari_B) && (Mulai_A < Selesai_B) && (Selesai_A > Mulai_B)
 */
export function validateScheduleConflict(
  candidate: ScheduleCandidate,
  existingSchedules: ScheduleItem[],
  allRooms: Array<{ id: string; name: string }>
): ConflictValidationResult {
  if (!candidate.startTime || !candidate.endTime) {
    return { hasConflict: false }
  }

  // 1. Validasi urutan waktu
  if (candidate.endTime <= candidate.startTime) {
    const timeError = 'Jam selesai bimbingan harus lebih besar daripada jam mulai.'
    return {
      hasConflict: true,
      timeError,
      errorMessage: timeError,
    }
  }

  const otherSchedules = existingSchedules.filter((s) => s.id !== candidate.id)

  // 2. Evaluasi bentrok ruangan
  const roomConflictSchedule = otherSchedules.find((s) => {
    const isSameRoom = s.roomId === candidate.roomId
    const isSameDay = s.dayOfWeek.toLowerCase() === candidate.dayOfWeek.toLowerCase()
    const isOverlapping =
      candidate.startTime < s.endTime && candidate.endTime > s.startTime
    return isSameRoom && isSameDay && isOverlapping
  })

  // 3. Evaluasi bentrok tutor
  const tutorConflictSchedule = otherSchedules.find((s) => {
    const isSameTutor = s.tutorId === candidate.tutorId
    const isSameDay = s.dayOfWeek.toLowerCase() === candidate.dayOfWeek.toLowerCase()
    const isOverlapping =
      candidate.startTime < s.endTime && candidate.endTime > s.startTime
    return isSameTutor && isSameDay && isOverlapping
  })

  if (!roomConflictSchedule && !tutorConflictSchedule) {
    return { hasConflict: false }
  }

  // Cari rekomendasi ruangan alternatif jika ada bentrok ruangan
  let suggestedRooms: Array<{ id: string; name: string }> | undefined
  if (roomConflictSchedule) {
    const occupiedRoomIds = new Set(
      otherSchedules
        .filter((s) => {
          const isSameDay = s.dayOfWeek.toLowerCase() === candidate.dayOfWeek.toLowerCase()
          const isOverlapping =
            candidate.startTime < s.endTime && candidate.endTime > s.startTime
          return isSameDay && isOverlapping
        })
        .map((s) => s.roomId)
    )

    suggestedRooms = allRooms.filter(
      (r) => r.id !== candidate.roomId && !occupiedRoomIds.has(r.id)
    )
  }

  let errorMessage = ''
  if (roomConflictSchedule && tutorConflictSchedule) {
    errorMessage = `Bentrok Ruangan & Tutor: ${roomConflictSchedule.roomName || 'Ruangan'} dan ${tutorConflictSchedule.tutorName || 'Tutor'} sudah terisi jadwal lain pada waktu tersebut.`
  } else if (roomConflictSchedule) {
    errorMessage = `Bentrok Ruangan: ${roomConflictSchedule.roomName || 'Ruangan'} sudah digunakan oleh ${roomConflictSchedule.className || 'kelas lain'} (${roomConflictSchedule.startTime}–${roomConflictSchedule.endTime})`
  } else if (tutorConflictSchedule) {
    errorMessage = `Bentrok Tutor: ${tutorConflictSchedule.tutorName || 'Tutor'} sudah mengajar ${tutorConflictSchedule.className || 'kelas lain'} (${tutorConflictSchedule.startTime}–${tutorConflictSchedule.endTime})`
  }

  return {
    hasConflict: true,
    errorMessage,
    roomConflict: roomConflictSchedule
      ? {
          id: roomConflictSchedule.id,
          roomName: roomConflictSchedule.roomName || 'Ruangan Terisi',
          className: roomConflictSchedule.className,
          startTime: roomConflictSchedule.startTime,
          endTime: roomConflictSchedule.endTime,
        }
      : undefined,
    tutorConflict: tutorConflictSchedule
      ? {
          id: tutorConflictSchedule.id,
          tutorName: tutorConflictSchedule.tutorName || 'Tutor Bertugas',
          className: tutorConflictSchedule.className,
          startTime: tutorConflictSchedule.startTime,
          endTime: tutorConflictSchedule.endTime,
        }
      : undefined,
    suggestedRooms,
  }
}

/**
 * Menghitung tanggal kalender (YYYY-MM-DD) untuk pertemuan terdekat berikutnya
 * sesuai hari bimbingan mingguan (dayOfWeek).
 */
export function calculateNextSessionDate(
  dayOfWeek: string,
  fromDate: Date = new Date()
): string {
  const targetDay = DAY_INDEX_MAP[dayOfWeek] ?? 1 // default ke Senin
  const currentDay = fromDate.getDay() // 0 = Minggu, 1 = Senin, ...
  let diff = targetDay - currentDay
  if (diff <= 0) {
    diff += 7
  }
  const nextDate = new Date(fromDate.getTime())
  nextDate.setDate(fromDate.getDate() + diff)

  const yyyy = nextDate.getFullYear()
  const mm = String(nextDate.getMonth() + 1).padStart(2, '0')
  const dd = String(nextDate.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export interface CreateScheduleInput {
  classId: string
  subjectName: string
  tutorId: string
  roomId: string
  dayOfWeek: string
  startTime: string
  endTime: string
}

export interface UpdateScheduleInput {
  classId?: string
  subjectName?: string
  tutorId?: string
  roomId?: string
  dayOfWeek?: string
  startTime?: string
  endTime?: string
}

export interface SessionItem {
  id: string
  scheduleId?: string
  classId: string
  className?: string
  subjectName?: string
  tutorId?: string
  tutorName?: string
  roomId?: string
  roomName?: string
  sessionDate: string
  topic?: string
  isCompleted: boolean
  dayOfWeek?: string
  startTime?: string
  endTime?: string
  entries?: Array<{
    studentId: string
    studentName: string
    nis: string
    status: 'hadir' | 'sakit' | 'izin' | 'alpa'
    note?: string
  }>
  createdAt?: string | Date
}

export interface ScheduleJoinedRow {
  id: string
  class_id: string
  subject_name: string | null
  tutor_id: string | null
  room_id: string | null
  day_of_week: string
  start_time: string
  end_time: string
  created_at: string
  classes: { id: string; class_name: string } | null
  rooms: { id: string; room_name: string } | null
  tutors: { id: string; profiles: { full_name: string } | null } | null
}

export interface SessionJoinedRow {
  id: string
  schedule_id: string | null
  class_id: string
  tutor_id: string | null
  room_id: string | null
  session_date: string
  topic: string | null
  is_completed: boolean
  created_at: string
  classes: { id: string; class_name: string } | null
  rooms: { id: string; room_name: string } | null
  tutors: { id: string; profiles: { full_name: string } | null } | null
  schedules: {
    id: string
    day_of_week: string
    start_time: string
    end_time: string
    subject_name: string | null
  } | null
}

export const scheduleService = {
  /**
   * Mengambil semua jadwal bimbingan aktif dari database Supabase
   */
  async getSchedules(): Promise<ScheduleItem[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        class_id,
        subject_name,
        tutor_id,
        room_id,
        day_of_week,
        start_time,
        end_time,
        created_at,
        classes ( id, class_name ),
        rooms ( id, room_name ),
        tutors ( id, profiles ( full_name ) )
      `)
      .order('day_of_week', { ascending: true })

    if (error || !data) {
      console.warn('[WARN] Gagal mengambil schedules dari Supabase:', error?.message)
      return []
    }

    const rows = data as unknown as ScheduleJoinedRow[]
    return rows.map((s) => ({
      id: s.id,
      classId: s.class_id,
      className: s.classes?.class_name || 'Rombel Kelas',
      subjectName: s.subject_name || 'Sesi Bimbingan',
      tutorId: s.tutor_id || '',
      tutorName: s.tutors?.profiles?.full_name || 'Tutor Bimbel',
      roomId: s.room_id || '',
      roomName: s.rooms?.room_name || 'Ruang Belajar',
      dayOfWeek: s.day_of_week,
      startTime: s.start_time,
      endTime: s.end_time,
      createdAt: s.created_at,
    }))
  },

  /**
   * Membuat jadwal baru dengan validasi anti-bentrok SCHED-02 dan otomatis
   * meng-generate 1 entri sesi belajar perdana di tabel sessions.
   */
  async createSchedule(
    input: CreateScheduleInput
  ): Promise<ServerResult<{ schedule: ScheduleItem; session: SessionItem }>> {
    await ensureAdminSession()

    // 1. Ambil jadwal dan ruangan saat ini untuk validasi anti-bentrok SCHED-02
    const currentSchedules = await this.getSchedules()
    const { data: roomsData } = await supabase.from('rooms').select('id, room_name')
    const allRooms = (roomsData || []).map((r: any) => ({ id: r.id, name: r.room_name }))

    const conflict = validateScheduleConflict(
      {
        classId: input.classId,
        subjectName: input.subjectName,
        tutorId: input.tutorId,
        roomId: input.roomId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
      },
      currentSchedules,
      allRooms
    )

    if (conflict.hasConflict) {
      return {
        success: false,
        error: conflict.errorMessage || 'Jadwal bertabrakan dengan jadwal bimbingan lain.',
        code: 'SCHEDULE_CONFLICT',
        conflict,
      }
    }

    // 2. Simpan jadwal ke tabel schedules
    const { data: insertedSchedule, error: schedError } = await supabase
      .from('schedules')
      .insert({
        class_id: input.classId,
        subject_name: input.subjectName.trim(),
        tutor_id: input.tutorId,
        room_id: input.roomId,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
      })
      .select(`
        id,
        class_id,
        subject_name,
        tutor_id,
        room_id,
        day_of_week,
        start_time,
        end_time,
        created_at,
        classes ( id, class_name ),
        rooms ( id, room_name ),
        tutors ( id, profiles ( full_name ) )
      `)
      .single()

    if (schedError || !insertedSchedule) {
      return {
        success: false,
        error: schedError?.message || 'Gagal menyimpan jadwal bimbingan ke database.',
      }
    }

    // 3. Otomatis buat 1 sesi bimbingan pertama di tabel sessions untuk pertemuan terdekat berikutnya
    const sessionDate = calculateNextSessionDate(input.dayOfWeek)
    const topic = `${input.subjectName.trim()} — Pertemuan 1`

    const { data: insertedSession, error: sesError } = await supabase
      .from('sessions')
      .insert({
        schedule_id: insertedSchedule.id,
        class_id: input.classId,
        tutor_id: input.tutorId,
        room_id: input.roomId,
        session_date: sessionDate,
        topic,
        is_completed: false,
      })
      .select(`
        id,
        schedule_id,
        class_id,
        tutor_id,
        room_id,
        session_date,
        topic,
        is_completed,
        created_at,
        classes ( id, class_name ),
        rooms ( id, room_name ),
        tutors ( id, profiles ( full_name ) )
      `)
      .single()

    if (sesError || !insertedSession) {
      // Rollback schedule jika sesi gagal dibuat
      await supabase.from('schedules').delete().eq('id', insertedSchedule.id)
      return {
        success: false,
        error: sesError?.message || 'Gagal membuat sesi belajar perdana di database.',
      }
    }

    const scheduleRow = insertedSchedule as unknown as ScheduleJoinedRow
    const sessionRow = insertedSession as unknown as SessionJoinedRow

    const scheduleItem: ScheduleItem = {
      id: scheduleRow.id,
      classId: scheduleRow.class_id,
      className: scheduleRow.classes?.class_name || 'Rombel Kelas',
      subjectName: scheduleRow.subject_name || 'Sesi Bimbingan',
      tutorId: scheduleRow.tutor_id || '',
      tutorName: scheduleRow.tutors?.profiles?.full_name || 'Tutor Bimbel',
      roomId: scheduleRow.room_id || '',
      roomName: scheduleRow.rooms?.room_name || 'Ruang Belajar',
      dayOfWeek: scheduleRow.day_of_week,
      startTime: scheduleRow.start_time,
      endTime: scheduleRow.end_time,
      createdAt: scheduleRow.created_at,
    }

    const sessionItem: SessionItem = {
      id: sessionRow.id,
      scheduleId: sessionRow.schedule_id || undefined,
      classId: sessionRow.class_id,
      className: sessionRow.classes?.class_name || 'Rombel Kelas',
      tutorId: sessionRow.tutor_id || undefined,
      tutorName: sessionRow.tutors?.profiles?.full_name || 'Tutor Bimbel',
      roomId: sessionRow.room_id || undefined,
      roomName: sessionRow.rooms?.room_name || 'Ruang Belajar',
      sessionDate: sessionRow.session_date,
      topic: sessionRow.topic || undefined,
      isCompleted: sessionRow.is_completed,
      createdAt: sessionRow.created_at,
    }

    return {
      success: true,
      data: {
        schedule: scheduleItem,
        session: sessionItem,
      },
    }
  },

  /**
   * Memperbarui jadwal bimbingan dan menyinkronkan sesi yang belum selesai (is_completed = false)
   */
  async updateSchedule(
    id: string,
    updates: UpdateScheduleInput
  ): Promise<ServerResult<ScheduleItem>> {
    await ensureAdminSession()

    // 1. Ambil jadwal eksisting
    const currentSchedules = await this.getSchedules()
    const existing = currentSchedules.find((s) => s.id === id)
    if (!existing) {
      return { success: false, error: `Jadwal dengan ID "${id}" tidak ditemukan.` }
    }

    const merged = {
      id,
      classId: updates.classId ?? existing.classId,
      subjectName: updates.subjectName ?? existing.subjectName,
      tutorId: updates.tutorId ?? existing.tutorId,
      roomId: updates.roomId ?? existing.roomId,
      dayOfWeek: updates.dayOfWeek ?? existing.dayOfWeek,
      startTime: updates.startTime ?? existing.startTime,
      endTime: updates.endTime ?? existing.endTime,
    }

    const { data: roomsData } = await supabase.from('rooms').select('id, room_name')
    const allRooms = (roomsData || []).map((r: any) => ({ id: r.id, name: r.room_name }))

    // 2. Validasi anti-bentrok SCHED-02
    const conflict = validateScheduleConflict(merged, currentSchedules, allRooms)
    if (conflict.hasConflict) {
      return {
        success: false,
        error: conflict.errorMessage || 'Perubahan jadwal memicu bentrok.',
        code: 'SCHEDULE_CONFLICT',
        conflict,
      }
    }

    // 3. Simpan perubahan ke tabel schedules
    const updatePayload: Record<string, any> = {}
    if (updates.classId !== undefined) updatePayload.class_id = updates.classId
    if (updates.subjectName !== undefined) updatePayload.subject_name = updates.subjectName.trim()
    if (updates.tutorId !== undefined) updatePayload.tutor_id = updates.tutorId
    if (updates.roomId !== undefined) updatePayload.room_id = updates.roomId
    if (updates.dayOfWeek !== undefined) updatePayload.day_of_week = updates.dayOfWeek
    if (updates.startTime !== undefined) updatePayload.start_time = updates.startTime
    if (updates.endTime !== undefined) updatePayload.end_time = updates.endTime

    const { data: updatedSchedule, error: schedError } = await supabase
      .from('schedules')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        id,
        class_id,
        subject_name,
        tutor_id,
        room_id,
        day_of_week,
        start_time,
        end_time,
        created_at,
        classes ( id, class_name ),
        rooms ( id, room_name ),
        tutors ( id, profiles ( full_name ) )
      `)
      .single()

    if (schedError || !updatedSchedule) {
      return {
        success: false,
        error: schedError?.message || 'Gagal memperbarui jadwal di database.',
      }
    }

    // 4. Sinkronkan sesi yang belum selesai (is_completed = false)
    // Proteksi sesi lampau (overdue): Jika hari jadwal berubah, hanya perbarui sesi masa depan (session_date >= today)
    const todayStr = formatLocalDate()
    const sessionUpdatePayload: Record<string, any> = {}
    if (updates.classId !== undefined) sessionUpdatePayload.class_id = updates.classId
    if (updates.tutorId !== undefined) sessionUpdatePayload.tutor_id = updates.tutorId
    if (updates.roomId !== undefined) sessionUpdatePayload.room_id = updates.roomId
    if (updates.subjectName !== undefined) {
      sessionUpdatePayload.topic = `${updates.subjectName.trim()} — Pertemuan 1`
    }
    if (updates.dayOfWeek !== undefined && updates.dayOfWeek !== existing.dayOfWeek) {
      sessionUpdatePayload.session_date = calculateNextSessionDate(updates.dayOfWeek)
    }

    if (Object.keys(sessionUpdatePayload).length > 0) {
      let sessionQuery = supabase
        .from('sessions')
        .update(sessionUpdatePayload)
        .eq('schedule_id', id)
        .eq('is_completed', false)

      // Jika hari bimbingan mingguan berubah, proteksi sesi lampau agar tidak ikut tergeser
      if (updates.dayOfWeek !== undefined && updates.dayOfWeek !== existing.dayOfWeek) {
        sessionQuery = sessionQuery.gte('session_date', todayStr)
      }

      await sessionQuery
    }

    const updatedRow = updatedSchedule as unknown as ScheduleJoinedRow

    const scheduleItem: ScheduleItem = {
      id: updatedRow.id,
      classId: updatedRow.class_id,
      className: updatedRow.classes?.class_name || 'Rombel Kelas',
      subjectName: updatedRow.subject_name || 'Sesi Bimbingan',
      tutorId: updatedRow.tutor_id || '',
      tutorName: updatedRow.tutors?.profiles?.full_name || 'Tutor Bimbel',
      roomId: updatedRow.room_id || '',
      roomName: updatedRow.rooms?.room_name || 'Ruang Belajar',
      dayOfWeek: updatedRow.day_of_week,
      startTime: updatedRow.start_time,
      endTime: updatedRow.end_time,
      createdAt: updatedRow.created_at,
    }

    return {
      success: true,
      data: scheduleItem,
    }
  },

  /**
   * Menghapus jadwal dan sesi yang belum berlangsung dari database.
   * Riwayat sesi yang sudah selesai (is_completed = true) dilepaskan schedule_id-nya
   * (SET NULL) agar tetap tersimpan utuh untuk kebutuhan audit presensi.
   */
  async deleteSchedule(id: string): Promise<ServerResult<boolean>> {
    await ensureAdminSession()

    // 1. Lepaskan relasi sesi yang sudah selesai agar tidak ikut terhapus oleh ON DELETE CASCADE
    await supabase
      .from('sessions')
      .update({ schedule_id: null })
      .eq('schedule_id', id)
      .eq('is_completed', true)

    // 2. Hapus sesi yang belum berlangsung (is_completed = false)
    await supabase.from('sessions').delete().eq('schedule_id', id).eq('is_completed', false)

    // 3. Hapus entri jadwal
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, data: true }
  },

  /**
   * Mengambil sesi bimbingan dari database (Read query tidak memerlukan sesi admin)
   */
  async getSessions(tutorId?: string, classId?: string): Promise<SessionItem[]> {
    let query = supabase
      .from('sessions')
      .select(`
        id,
        schedule_id,
        class_id,
        tutor_id,
        room_id,
        session_date,
        topic,
        is_completed,
        created_at,
        classes ( id, class_name ),
        rooms ( id, room_name ),
        tutors ( id, profiles ( full_name ) ),
        schedules ( id, day_of_week, start_time, end_time, subject_name )
      `)
      .order('session_date', { ascending: true })

    if (tutorId) {
      query = query.eq('tutor_id', tutorId)
    }
    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data, error } = await query
    if (error || !data) {
      console.warn('[WARN] Gagal mengambil sessions dari Supabase:', error?.message)
      return []
    }

    const rows = data as unknown as SessionJoinedRow[]
    return rows.map((s) => ({
      id: s.id,
      scheduleId: s.schedule_id || undefined,
      classId: s.class_id,
      className: s.classes?.class_name || 'Rombel Kelas',
      tutorId: s.tutor_id || undefined,
      tutorName: s.tutors?.profiles?.full_name || 'Tutor Bimbel',
      roomId: s.room_id || undefined,
      roomName: s.rooms?.room_name || 'Ruang Belajar',
      sessionDate: s.session_date,
      topic: s.topic || 'Sesi Bimbingan',
      isCompleted: s.is_completed,
      dayOfWeek: s.schedules?.day_of_week,
      startTime: s.schedules?.start_time,
      endTime: s.schedules?.end_time,
      createdAt: s.created_at,
    }))
  },
}
