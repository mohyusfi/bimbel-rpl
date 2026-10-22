import { describe, it, expect, beforeEach } from 'vitest'
import {
  adminStore,
  detectScheduleConflicts,
  type Schedule,
  type Room,
  type ScheduleCandidate,
} from '../admin-store'
import {
  schedules as drizzleSchedules,
  schedulesRelations,
  type Schedule as DrizzleSchedule,
  type NewSchedule as DrizzleNewSchedule,
} from '../../db/schema'

describe('SCHED-02: Mesin Deteksi Bentrok Jadwal & Skema Drizzle Schedules', () => {
  beforeEach(() => {
    adminStore.resetToDefault()
  })

  const dummyRooms: Room[] = [
    { id: 'rm-1', name: 'Ruang Palu-1', capacity: 12, facilities: 'AC, Whiteboard', isActive: true },
    { id: 'rm-2', name: 'Ruang Palu-2', capacity: 12, facilities: 'AC, Proyektor', isActive: true },
    { id: 'rm-3', name: 'Ruang Palu-3', capacity: 10, facilities: 'AC', isActive: true },
  ]

  const existingSchedules: Schedule[] = [
    {
      id: 'sch-101',
      classId: 'cls-1',
      className: 'UTBK Intensif A',
      subjectName: 'Matematika UTBK',
      tutorId: 'tut-1',
      tutorName: 'Pak Hendra Wijaya, M.Pd',
      roomId: 'rm-1',
      roomName: 'Ruang Palu-1',
      dayOfWeek: 'Senin',
      startTime: '16:00',
      endTime: '17:30',
    },
    {
      id: 'sch-102',
      classId: 'cls-2',
      className: 'SMA IPA 1',
      subjectName: 'Fisika Dasar',
      tutorId: 'tut-2',
      tutorName: 'Kak Dian Pratiwi, S.Si',
      roomId: 'rm-2',
      roomName: 'Ruang Palu-2',
      dayOfWeek: 'Senin',
      startTime: '16:00',
      endTime: '17:30',
    },
  ]

  // =========================================================================
  // 1. VERIFIKASI SKEMA DRIZZLE ORM
  // =========================================================================
  describe('Drizzle ORM Schema Integrity', () => {
    it('memastikan tabel schedules dan relasi diekspor dengan benar', () => {
      expect(drizzleSchedules).toBeDefined()
      expect(schedulesRelations).toBeDefined()
    })

    it('memvalidasi tipe DrizzleSchedule dan DrizzleNewSchedule', () => {
      const mockSchedule: DrizzleSchedule = {
        id: 'sch-sample-1',
        classId: 'cls-1',
        subjectName: 'Penalaran Matematika',
        tutorId: 'tut-1',
        roomId: 'rm-1',
        dayOfWeek: 'Senin',
        startTime: '16:00',
        endTime: '17:30',
        createdAt: new Date(),
      }
      expect(mockSchedule.id).toBe('sch-sample-1')
      expect(mockSchedule.subjectName).toBe('Penalaran Matematika')

      const mockNewSchedule: DrizzleNewSchedule = {
        id: 'sch-sample-2',
        classId: 'cls-2',
        subjectName: 'Bahasa Indonesia',
        tutorId: 'tut-2',
        roomId: 'rm-2',
        dayOfWeek: 'Selasa',
        startTime: '14:00',
        endTime: '15:30',
      }
      expect(mockNewSchedule.id).toBe('sch-sample-2')
    })
  })

  // =========================================================================
  // 2. VALIDASI URUTAN WAKTU (endTime > startTime)
  // =========================================================================
  describe('Validasi Urutan Waktu Sesi', () => {
    it('menolak jadwal jika endTime sama dengan startTime', () => {
      const candidate: ScheduleCandidate = {
        roomId: 'rm-3',
        tutorId: 'tut-3',
        dayOfWeek: 'Selasa',
        startTime: '16:00',
        endTime: '16:00',
      }
      const result = detectScheduleConflicts(candidate, existingSchedules, dummyRooms)
      expect(result.hasConflict).toBe(true)
      expect(result.timeError).toContain('Jam selesai bimbingan harus lebih besar')
      expect(result.errorMessage).toContain('Jam selesai bimbingan harus lebih besar')
    })

    it('menolak jadwal jika endTime lebih awal daripada startTime', () => {
      const candidate: ScheduleCandidate = {
        roomId: 'rm-3',
        tutorId: 'tut-3',
        dayOfWeek: 'Selasa',
        startTime: '17:00',
        endTime: '15:30',
      }
      const result = detectScheduleConflicts(candidate, existingSchedules, dummyRooms)
      expect(result.hasConflict).toBe(true)
      expect(result.timeError).toBeDefined()
      expect(result.errorMessage).toBeDefined()
    })

    it('menerima jadwal jika startTime dan endTime belum diisi lengkap', () => {
      const candidate: ScheduleCandidate = {
        roomId: 'rm-3',
        tutorId: 'tut-3',
        dayOfWeek: 'Selasa',
        startTime: '',
        endTime: '',
      }
      const result = detectScheduleConflicts(candidate, existingSchedules, dummyRooms)
      expect(result.hasConflict).toBe(false)
    })
  })

  // =========================================================================
  // 3. DETEKSI BENTROK RUANGAN (SCHED-02)
  // =========================================================================
  describe('Deteksi Bentrok Ruangan', () => {
    it('mendeteksi bentrok saat ruangan sama, hari sama, dan jam bertabrakan sebagian', () => {
      // existing: rm-1, Senin, 16:00 - 17:30
      // candidate: rm-1, Senin, 16:30 - 18:00 (irisan: 16:30 < 17:30 && 18:00 > 16:00)
      const candidate: ScheduleCandidate = {
        roomId: 'rm-1',
        tutorId: 'tut-3',
        dayOfWeek: 'Senin',
        startTime: '16:30',
        endTime: '18:00',
      }
      const result = detectScheduleConflicts(candidate, existingSchedules, dummyRooms)
      expect(result.hasConflict).toBe(true)
      expect(result.roomConflict).toBeDefined()
      expect(result.roomConflict?.id).toBe('sch-101')
      expect(result.tutorConflict).toBeUndefined()
      expect(result.errorMessage).toContain('Bentrok Ruangan')
      expect(result.errorMessage).toContain('Ruang Palu-1')
      expect(result.errorMessage).toContain('UTBK Intensif A')
      expect(result.errorMessage).toContain('16:00–17:30')
    })

    it('memberikan rekomendasi ruangan alternatif yang kosong saat terjadi bentrok ruangan', () => {
      const candidate: ScheduleCandidate = {
        roomId: 'rm-1',
        tutorId: 'tut-3',
        dayOfWeek: 'Senin',
        startTime: '16:00',
        endTime: '17:30',
      }
      const result = detectScheduleConflicts(candidate, existingSchedules, dummyRooms)
      expect(result.hasConflict).toBe(true)
      expect(result.suggestedRooms).toBeDefined()
      // rm-1 dan rm-2 terpakai di jam 16:00-17:30, rm-3 kosong
      const suggestedIds = result.suggestedRooms?.map((r) => r.id)
      expect(suggestedIds).toContain('rm-3')
      expect(suggestedIds).not.toContain('rm-1')
      expect(suggestedIds).not.toContain('rm-2')
    })
  })

  // =========================================================================
  // 4. DETEKSI BENTROK TUTOR (SCHED-02)
  // =========================================================================
  describe('Deteksi Bentrok Tutor', () => {
    it('mendeteksi bentrok saat tutor sama, hari sama, dan jam bertabrakan meski ruangan beda', () => {
      // existing: tut-1 mengajar di rm-1 pada Senin 16:00 - 17:30
      // candidate: tut-1 di rm-3 pada Senin 15:30 - 17:00
      const candidate: ScheduleCandidate = {
        roomId: 'rm-3',
        tutorId: 'tut-1',
        dayOfWeek: 'Senin',
        startTime: '15:30',
        endTime: '17:00',
      }
      const result = detectScheduleConflicts(candidate, existingSchedules, dummyRooms)
      expect(result.hasConflict).toBe(true)
      expect(result.tutorConflict).toBeDefined()
      expect(result.tutorConflict?.id).toBe('sch-101')
      expect(result.roomConflict).toBeUndefined()
      expect(result.errorMessage).toContain('Bentrok Tutor')
      expect(result.errorMessage).toContain('Pak Hendra Wijaya, M.Pd')
      expect(result.errorMessage).toContain('UTBK Intensif A')
      expect(result.errorMessage).toContain('16:00–17:30')
    })
  })

  // =========================================================================
  // 5. DETEKSI BENTROK GANDA (RUANGAN & TUTOR SEKALIGUS)
  // =========================================================================
  describe('Deteksi Bentrok Ganda (Ruangan & Tutor)', () => {
    it('mendeteksi bentrok 2-lapis dengan pesan gabungan yang deskriptif', () => {
      // candidate menabrak ruangan rm-1 (sch-101) dan tutor tut-2 (sch-102)
      const candidate: ScheduleCandidate = {
        roomId: 'rm-1',
        tutorId: 'tut-2',
        dayOfWeek: 'Senin',
        startTime: '16:15',
        endTime: '17:15',
      }
      const result = detectScheduleConflicts(candidate, existingSchedules, dummyRooms)
      expect(result.hasConflict).toBe(true)
      expect(result.roomConflict?.id).toBe('sch-101')
      expect(result.tutorConflict?.id).toBe('sch-102')
      expect(result.errorMessage).toContain('Bentrok Ruangan & Tutor')
      expect(result.errorMessage).toContain('Ruang Palu-1')
      expect(result.errorMessage).toContain('Kak Dian Pratiwi, S.Si')
    })
  })

  // =========================================================================
  // 6. KASUS BATAS & NON-BENTROK
  // =========================================================================
  describe('Kasus Bebas Bentrok & Kasus Batas Jam', () => {
    it('mengizinkan sesi pada hari yang berbeda meski jam, ruangan, dan tutor sama', () => {
      const candidate: ScheduleCandidate = {
        roomId: 'rm-1',
        tutorId: 'tut-1',
        dayOfWeek: 'Selasa', // Beda hari dari Senin
        startTime: '16:00',
        endTime: '17:30',
      }
      const result = detectScheduleConflicts(candidate, existingSchedules, dummyRooms)
      expect(result.hasConflict).toBe(false)
      expect(result.errorMessage).toBeUndefined()
    })

    it('mengizinkan sesi yang berbatasan langsung pada tepi waktu (Mulai_A == Selesai_B)', () => {
      // Selesai_B = 17:30, Mulai_A = 17:30
      const candidateAfter: ScheduleCandidate = {
        roomId: 'rm-1',
        tutorId: 'tut-1',
        dayOfWeek: 'Senin',
        startTime: '17:30',
        endTime: '19:00',
      }
      const resultAfter = detectScheduleConflicts(candidateAfter, existingSchedules, dummyRooms)
      expect(resultAfter.hasConflict).toBe(false)

      // Mulai_B = 16:00, Selesai_A = 16:00
      const candidateBefore: ScheduleCandidate = {
        roomId: 'rm-1',
        tutorId: 'tut-1',
        dayOfWeek: 'Senin',
        startTime: '14:30',
        endTime: '16:00',
      }
      const resultBefore = detectScheduleConflicts(candidateBefore, existingSchedules, dummyRooms)
      expect(resultBefore.hasConflict).toBe(false)
    })

    it('mengabaikan perbandingan dengan sesi itu sendiri saat proses edit (candidate.id === existing.id)', () => {
      const candidateSelf: ScheduleCandidate = {
        id: 'sch-101',
        roomId: 'rm-1',
        tutorId: 'tut-1',
        dayOfWeek: 'Senin',
        startTime: '16:00',
        endTime: '17:30',
      }
      const result = detectScheduleConflicts(candidateSelf, existingSchedules, dummyRooms)
      expect(result.hasConflict).toBe(false)
    })
  })

  // =========================================================================
  // 7. INTEGRASI STORE: addSchedule & updateSchedule VALIDATION
  // =========================================================================
  describe('Integrasi adminStore addSchedule & updateSchedule', () => {
    it('addSchedule melempar error deskriptif jika terjadi bentrok', () => {
      // Ambil jadwal pertama di store
      const allSchedules = adminStore.getState().schedules
      const existing = allSchedules[0]
      expect(existing).toBeDefined()

      expect(() => {
        adminStore.addSchedule({
          classId: 'cls-test-1',
          className: 'Kelas Uji Coba',
          subjectName: 'Biologi',
          tutorId: existing.tutorId,
          tutorName: existing.tutorName,
          roomId: existing.roomId,
          roomName: existing.roomName,
          dayOfWeek: existing.dayOfWeek,
          startTime: existing.startTime,
          endTime: existing.endTime,
        })
      }).toThrow(/Bentrok/)
    })

    it('updateSchedule melempar error deskriptif jika hasil edit memicu bentrok dengan jadwal lain', () => {
      const allSchedules = adminStore.getState().schedules
      if (allSchedules.length >= 2) {
        const sch1 = allSchedules[0]
        const sch2 = allSchedules[1]

        // Coba ubah sch2 agar bentrok dengan ruangan sch1 di hari & jam yang sama
        expect(() => {
          adminStore.updateSchedule(sch2.id, {
            dayOfWeek: sch1.dayOfWeek,
            roomId: sch1.roomId,
            startTime: sch1.startTime,
            endTime: sch1.endTime,
          })
        }).toThrow(/Bentrok Ruangan/)
      }
    })

    it('updateSchedule berhasil memperbarui jadwal tanpa bentrok', () => {
      const allSchedules = adminStore.getState().schedules
      const target = allSchedules[0]
      expect(target).toBeDefined()

      // Ubah nama mata pelajaran dan waktu ke slot yang aman
      const updated = adminStore.updateSchedule(target.id, {
        subjectName: 'Mata Pelajaran Diperbarui',
        dayOfWeek: 'Sabtu',
        startTime: '13:00',
        endTime: '14:30',
      })

      expect(updated.subjectName).toBe('Mata Pelajaran Diperbarui')
      expect(updated.dayOfWeek).toBe('Sabtu')
      expect(updated.startTime).toBe('13:00')
      expect(updated.endTime).toBe('14:30')
    })
  })
})
