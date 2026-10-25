import { describe, it, expect } from 'vitest'
import {
  calculateNextSessionDate,
  validateScheduleConflict,
  mapSessionJoinedRow,
  type ScheduleItem,
} from '../schedule.service'

describe('ScheduleService — Pemuatan Entri Presensi (mapSessionJoinedRow)', () => {
  it('memuat status presensi tersimpan dari join attendances ke dalam entries sesi', () => {
    const row = {
      id: 'sess-1',
      schedule_id: 'sched-1',
      class_id: 'cls-1',
      tutor_id: 'tut-1',
      room_id: 'rm-1',
      session_date: '2026-10-26',
      topic: 'Fisika',
      is_completed: true,
      completed_at: '2026-10-26T10:00:00Z',
      created_at: '2026-10-25T10:00:00Z',
      classes: { id: 'cls-1', class_name: 'UTBK A' },
      rooms: { id: 'rm-1', room_name: 'Palu-1' },
      tutors: { id: 'tut-1', profiles: { full_name: 'Kak Dian' } },
      schedules: {
        id: 'sched-1',
        day_of_week: 'Senin',
        start_time: '16:00',
        end_time: '17:30',
        subject_name: 'Fisika UTBK',
      },
      attendances: [
        {
          status: 'alpa',
          notes: 'Tanpa keterangan',
          student_id: 'stu-1',
          students: { id: 'stu-1', nis: 'TC-001', profiles: { full_name: 'Fahri' } },
        },
        {
          status: 'hadir',
          notes: null,
          student_id: 'stu-2',
          students: { id: 'stu-2', nis: 'TC-002', profiles: { full_name: 'Alya' } },
        },
      ],
    }

    const item = mapSessionJoinedRow(row as never)
    expect(item.entries).toHaveLength(2)
    expect(item.entries?.[0]).toMatchObject({
      studentId: 'stu-1',
      status: 'alpa',
      studentName: 'Fahri',
      nis: 'TC-001',
      note: 'Tanpa keterangan',
    })
    expect(item.entries?.[1].status).toBe('hadir')
    expect(item.completedAt).toBe('2026-10-26T10:00:00Z')
  })

  it('menghasilkan entries kosong bila sesi belum memiliki presensi', () => {
    const row = {
      id: 'sess-2',
      schedule_id: null,
      class_id: 'cls-1',
      tutor_id: null,
      room_id: null,
      session_date: '2026-10-27',
      topic: null,
      is_completed: false,
      completed_at: null,
      created_at: '2026-10-25T10:00:00Z',
      classes: null,
      rooms: null,
      tutors: null,
      schedules: null,
      attendances: null,
    }
    const item = mapSessionJoinedRow(row as never)
    expect(item.entries).toEqual([])
    expect(item.completedAt).toBeUndefined()
  })
})

describe('ScheduleService — Siklus TDD', () => {
  describe('Slice 1: Kalkulasi Tanggal Sesi Terdekat (calculateNextSessionDate)', () => {
    it('menghitung tanggal kalender YYYY-MM-DD pertemuan terdekat berikutnya secara tepat', () => {
      // Titik acuan: Jumat, 23 Oktober 2026
      const baseDate = new Date('2026-10-23T10:00:00+08:00')

      // 1. Jadwal hari Senin -> jatuh pada Senin berikutnya (26 Oktober 2026)
      expect(calculateNextSessionDate('Senin', baseDate)).toBe('2026-10-26')

      // 2. Jadwal hari Sabtu -> jatuh pada esok hari (24 Oktober 2026)
      expect(calculateNextSessionDate('Sabtu', baseDate)).toBe('2026-10-24')

      // 3. Jadwal hari Minggu -> jatuh pada 25 Oktober 2026
      expect(calculateNextSessionDate('Minggu', baseDate)).toBe('2026-10-25')

      // 4. Jadwal hari yang sama (Jumat) -> jatuh pada Jumat pekan depan (30 Oktober 2026)
      expect(calculateNextSessionDate('Jumat', baseDate)).toBe('2026-10-30')

      // 5. Jadwal hari Selasa -> jatuh pada 27 Oktober 2026
      expect(calculateNextSessionDate('Selasa', baseDate)).toBe('2026-10-27')
    })
  })

  describe('Slice 2: Validasi Anti-Bentrok Server-Side SCHED-02 (validateScheduleConflict)', () => {
    const dummyRooms = [
      { id: 'rm-1', name: 'Ruang Palu-1' },
      { id: 'rm-2', name: 'Ruang Palu-2' },
      { id: 'rm-3', name: 'Ruang Palu-3' },
    ]

    const existingSchedules: ScheduleItem[] = [
      {
        id: 'sch-1',
        classId: 'cls-1',
        className: 'UTBK Intensif A',
        subjectName: 'Matematika UTBK',
        tutorId: 'tut-1',
        tutorName: 'Pak Hendra Wijaya',
        roomId: 'rm-1',
        roomName: 'Ruang Palu-1',
        dayOfWeek: 'Senin',
        startTime: '16:00',
        endTime: '17:30',
      },
      {
        id: 'sch-2',
        classId: 'cls-2',
        className: 'SMA IPA 1',
        subjectName: 'Fisika Dasar',
        tutorId: 'tut-2',
        tutorName: 'Kak Dian Pratiwi',
        roomId: 'rm-2',
        roomName: 'Ruang Palu-2',
        dayOfWeek: 'Senin',
        startTime: '16:00',
        endTime: '17:30',
      },
    ]

    it('menolak jadwal jika endTime <= startTime', () => {
      const res = validateScheduleConflict(
        {
          roomId: 'rm-1',
          tutorId: 'tut-3',
          dayOfWeek: 'Senin',
          startTime: '17:00',
          endTime: '16:00',
        },
        existingSchedules,
        dummyRooms
      )
      expect(res.hasConflict).toBe(true)
      expect(res.errorMessage).toContain('Jam selesai bimbingan harus lebih besar')
    })

    it('mendeteksi bentrok ruangan pada hari sama dan rentang jam beririsan serta menyarankan ruangan kosong', () => {
      const res = validateScheduleConflict(
        {
          roomId: 'rm-1',
          tutorId: 'tut-3',
          dayOfWeek: 'Senin',
          startTime: '16:30',
          endTime: '18:00',
        },
        existingSchedules,
        dummyRooms
      )
      expect(res.hasConflict).toBe(true)
      expect(res.roomConflict).toBeDefined()
      expect(res.roomConflict?.roomName).toBe('Ruang Palu-1')
      expect(res.suggestedRooms).toBeDefined()
      expect(res.suggestedRooms?.map((r) => r.id)).toContain('rm-3')
      expect(res.suggestedRooms?.map((r) => r.id)).not.toContain('rm-1')
      expect(res.suggestedRooms?.map((r) => r.id)).not.toContain('rm-2')
    })

    it('mendeteksi bentrok tutor pada hari sama dan rentang jam beririsan meski di ruangan berbeda', () => {
      const res = validateScheduleConflict(
        {
          roomId: 'rm-3',
          tutorId: 'tut-1',
          dayOfWeek: 'Senin',
          startTime: '15:30',
          endTime: '17:00',
        },
        existingSchedules,
        dummyRooms
      )
      expect(res.hasConflict).toBe(true)
      expect(res.tutorConflict).toBeDefined()
      expect(res.tutorConflict?.tutorName).toBe('Pak Hendra Wijaya')
    })

    it('mengizinkan jadwal berurutan tanpa jeda (16:00-17:30 dan 17:30-19:00)', () => {
      const res = validateScheduleConflict(
        {
          roomId: 'rm-1',
          tutorId: 'tut-1',
          dayOfWeek: 'Senin',
          startTime: '17:30',
          endTime: '19:00',
        },
        existingSchedules,
        dummyRooms
      )
      expect(res.hasConflict).toBe(false)
      expect(res.errorMessage).toBeUndefined()
    })

    it('mengabaikan ID sendiri saat memeriksa konflik pada proses update', () => {
      const res = validateScheduleConflict(
        {
          id: 'sch-1',
          roomId: 'rm-1',
          tutorId: 'tut-1',
          dayOfWeek: 'Senin',
          startTime: '16:00',
          endTime: '17:30',
        },
        existingSchedules,
        dummyRooms
      )
      expect(res.hasConflict).toBe(false)
    })
  })

  describe('Slice 3: Database Integration — createSchedule & Auto-Session Generation', () => {
    it('berhasil menyimpan jadwal baru ke tabel schedules Supabase dan otomatis membuat 1 entri sesi di tabel sessions', async () => {
      const { scheduleService } = await import('../schedule.service')

      const testPayload = {
        classId: 'c1000000-0000-0000-0000-000000000001',
        subjectName: 'Matematika Dasar TDD',
        tutorId: '9383fc09-99fc-423c-ac09-e3f94c26f5e9',
        roomId: '8b2ccb58-95f8-4011-9012-5dd48e5ac2e3',
        dayOfWeek: 'Senin',
        startTime: '14:00',
        endTime: '15:30',
      }

      // 1. Create schedule
      const createRes = await scheduleService.createSchedule(testPayload)
      expect(createRes.success).toBe(true)
      if (!createRes.success) return

      const createdSchedule = createRes.data.schedule
      const createdSession = createRes.data.session

      expect(createdSchedule.id).toBeDefined()
      expect(createdSchedule.subjectName).toBe('Matematika Dasar TDD')
      expect(createdSchedule.startTime).toBe('14:00')
      expect(createdSchedule.endTime).toBe('15:30')

      // Verifikasi sesi bimbingan perdana otomatis
      expect(createdSession.id).toBeDefined()
      expect(createdSession.scheduleId).toBe(createdSchedule.id)
      expect(createdSession.isCompleted).toBe(false)
      expect(createdSession.topic).toContain('Matematika Dasar TDD')

      const expectedDate = calculateNextSessionDate('Senin')
      expect(createdSession.sessionDate).toBe(expectedDate)

      // 2. Coba buat jadwal yang bentrok (ruangan sama pada hari & jam sama) -> harus ditolak
      const conflictRes = await scheduleService.createSchedule({
        ...testPayload,
        subjectName: 'Jadwal Bentrok Uji',
        tutorId: '23557988-2a00-46e6-8c21-f43bf8233710', // tutor beda, tapi ruangan & jam sama
      })
      expect(conflictRes.success).toBe(false)
      if (!conflictRes.success) {
        expect(conflictRes.error).toContain('Bentrok Ruangan')
      }

      // 3. Cleanup test records
      await scheduleService.deleteSchedule(createdSchedule.id)
    }, 15000)
  })

  describe('Slice 4: Database Integration — updateSchedule & deleteSchedule with Session Sync', () => {
    it('berhasil memperbarui jadwal dan menyinkronkan sesi yang belum selesai, serta menolak perubahan bentrok', async () => {
      const { scheduleService } = await import('../schedule.service')

      let schedId = ''
      try {
        // 1. Buat jadwal awal
        const initial = await scheduleService.createSchedule({
          classId: 'c1000000-0000-0000-0000-000000000001',
          subjectName: 'Fisika Eksperimen TDD',
          tutorId: '9383fc09-99fc-423c-ac09-e3f94c26f5e9',
          roomId: '8b2ccb58-95f8-4011-9012-5dd48e5ac2e3',
          dayOfWeek: 'Selasa',
          startTime: '10:00',
          endTime: '11:30',
        })
        expect(initial.success).toBe(true)
        if (!initial.success) return
        schedId = initial.data.schedule.id

        // 2. Update jadwal ke hari Rabu dan jam 13:00-14:30
        const updateRes = await scheduleService.updateSchedule(schedId, {
          dayOfWeek: 'Rabu',
          startTime: '13:00',
          endTime: '14:30',
          subjectName: 'Fisika Modern Terapan',
        })
        expect(updateRes.success).toBe(true)
        if (updateRes.success) {
          expect(updateRes.data.dayOfWeek).toBe('Rabu')
          expect(updateRes.data.startTime).toBe('13:00')
          expect(updateRes.data.endTime).toBe('14:30')
          expect(updateRes.data.subjectName).toBe('Fisika Modern Terapan')
        }

        // Verifikasi bahwa sesi belum selesai di tabel sessions ikut terupdate tanggalnya
        const sessions = await scheduleService.getSessions(undefined, 'c1000000-0000-0000-0000-000000000001')
        const targetSession = sessions.find((s) => s.scheduleId === schedId)
        expect(targetSession).toBeDefined()
        expect(targetSession?.sessionDate).toBe(calculateNextSessionDate('Rabu'))
        expect(targetSession?.topic).toContain('Fisika Modern Terapan')
      } finally {
        if (schedId) {
          // 3. Hapus jadwal
          const deleteRes = await scheduleService.deleteSchedule(schedId)
          expect(deleteRes.success).toBe(true)

          // Verifikasi bahwa jadwal sudah bersih
          const remainingSchedules = await scheduleService.getSchedules()
          expect(remainingSchedules.find((s) => s.id === schedId)).toBeUndefined()
        }
      }
    }, 15000)
  })
})
