import { describe, it, expect, beforeEach } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
  classes as drizzleClasses,
  tutors as drizzleTutors,
  rooms as drizzleRooms,
  type Schedule as DrizzleSchedule,
  type NewSchedule as DrizzleNewSchedule,
} from '../../db/schema'
import {
  useTutorDashboardData,
  useStudentDashboardData,
  ADMIN_KEYS,
} from '../../hooks/use-admin-data'

// Helper untuk mengeksekusi TanStack Query hook dalam lingkungan server test harness
function renderHookWithClient<T>(hookFn: () => T): T {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  const state = adminStore.getState()
  queryClient.setQueryData(ADMIN_KEYS.session, {
    activeStudentId: state.activeStudentId,
    activeTutorId: state.activeTutorId,
    activeParentId: state.activeParentId,
    selectedChildId: state.selectedChildId,
    student: state.students.find((s) => s.id === state.activeStudentId) || state.students[0],
    tutor: state.tutors.find((t) => t.id === state.activeTutorId) || state.tutors[0],
    parent: state.parents.find((p) => p.id === state.activeParentId) || state.parents[0],
    selectedChild: state.students.find((s) => s.id === state.selectedChildId) || state.students[0],
  })
  queryClient.setQueryData(ADMIN_KEYS.tutors, state.tutors)
  queryClient.setQueryData(ADMIN_KEYS.students, state.students)
  queryClient.setQueryData(ADMIN_KEYS.schedules, state.schedules)
  queryClient.setQueryData(ADMIN_KEYS.classes, state.classes)
  queryClient.setQueryData(ADMIN_KEYS.attendance, state.attendanceSessions)
  queryClient.setQueryData(ADMIN_KEYS.materials, state.learningMaterials)
  queryClient.setQueryData(ADMIN_KEYS.grades, state.gradeRecords)
  queryClient.setQueryData(ADMIN_KEYS.invoices, state.invoices)

  let result!: T
  function TestHarness() {
    result = hookFn()
    return React.createElement('div', null, 'rendered')
  }

  renderToString(
    React.createElement(QueryClientProvider, { client: queryClient }, React.createElement(TestHarness))
  )
  return result
}

describe('Tiket 02: Persistensi Jadwal, Conflict Detection Engine (SCHED-02), dan Dashboard Hooks', () => {
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
  // 1. UJI SKEMA DRIZZLE 'schedules' & RELASI RELASIONAL
  // =========================================================================
  describe('1. Skema Drizzle ORM: schedules & Relasi', () => {
    it('memvalidasi definisi tabel schedules dan seluruh kolom wajibnya', () => {
      expect(drizzleSchedules).toBeDefined()
      expect(drizzleSchedules.id).toBeDefined()
      expect(drizzleSchedules.classId).toBeDefined()
      expect(drizzleSchedules.subjectName).toBeDefined()
      expect(drizzleSchedules.tutorId).toBeDefined()
      expect(drizzleSchedules.roomId).toBeDefined()
      expect(drizzleSchedules.dayOfWeek).toBeDefined()
      expect(drizzleSchedules.startTime).toBeDefined()
      expect(drizzleSchedules.endTime).toBeDefined()
      expect(drizzleSchedules.createdAt).toBeDefined()
    })

    it('memvalidasi relasi schedulesRelations ke classes, tutors, dan rooms', () => {
      expect(schedulesRelations).toBeDefined()
      expect(drizzleClasses).toBeDefined()
      expect(drizzleTutors).toBeDefined()
      expect(drizzleRooms).toBeDefined()
    })

    it('memvalidasi integritas tipe TypeScript DrizzleSchedule dan DrizzleNewSchedule', () => {
      const mockSchedule: DrizzleSchedule = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        classId: '660e8400-e29b-41d4-a716-446655440000',
        subjectName: 'Penalaran Matematika',
        tutorId: '770e8400-e29b-41d4-a716-446655440000',
        roomId: '880e8400-e29b-41d4-a716-446655440000',
        dayOfWeek: 'Senin',
        startTime: '16:00',
        endTime: '17:30',
        createdAt: new Date(),
      }
      expect(mockSchedule.id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(mockSchedule.subjectName).toBe('Penalaran Matematika')

      const mockNewSchedule: DrizzleNewSchedule = {
        classId: '660e8400-e29b-41d4-a716-446655440000',
        subjectName: 'Bahasa Indonesia UTBK',
        tutorId: '770e8400-e29b-41d4-a716-446655440000',
        roomId: '880e8400-e29b-41d4-a716-446655440000',
        dayOfWeek: 'Rabu',
        startTime: '14:00',
        endTime: '15:30',
      }
      expect(mockNewSchedule.dayOfWeek).toBe('Rabu')
      expect(mockNewSchedule.startTime).toBe('14:00')
      expect(mockNewSchedule.endTime).toBe('15:30')
    })
  })

  // =========================================================================
  // 2. UJI CONFLICT DETECTION ENGINE (SCHED-02)
  // =========================================================================
  describe('2. Conflict Detection Engine (SCHED-02)', () => {
    describe('Validasi Format & Urutan Waktu', () => {
      it('menolak jadwal tidak valid jika jam selesai sama dengan jam mulai (endTime <= startTime)', () => {
        const candidateSame: ScheduleCandidate = {
          roomId: 'rm-3',
          tutorId: 'tut-3',
          dayOfWeek: 'Selasa',
          startTime: '16:00',
          endTime: '16:00',
        }
        const resultSame = detectScheduleConflicts(candidateSame, existingSchedules, dummyRooms)
        expect(resultSame.hasConflict).toBe(true)
        expect(resultSame.timeError).toContain('Jam selesai bimbingan harus lebih besar')
        expect(resultSame.errorMessage).toContain('Jam selesai bimbingan harus lebih besar')
      })

      it('menolak jadwal tidak valid jika jam selesai lebih awal dari jam mulai (endTime < startTime)', () => {
        const candidateBackward: ScheduleCandidate = {
          roomId: 'rm-3',
          tutorId: 'tut-3',
          dayOfWeek: 'Selasa',
          startTime: '17:30',
          endTime: '16:00',
        }
        const resultBackward = detectScheduleConflicts(candidateBackward, existingSchedules, dummyRooms)
        expect(resultBackward.hasConflict).toBe(true)
        expect(resultBackward.timeError).toBeDefined()
        expect(resultBackward.errorMessage).toContain('Jam selesai bimbingan harus lebih besar')
      })

      it('mengizinkan candidate saat jam mulai atau selesai belum diisi lengkap (kondisi input draft)', () => {
        const candidateIncomplete: ScheduleCandidate = {
          roomId: 'rm-3',
          tutorId: 'tut-3',
          dayOfWeek: 'Selasa',
          startTime: '',
          endTime: '',
        }
        const result = detectScheduleConflicts(candidateIncomplete, existingSchedules, dummyRooms)
        expect(result.hasConflict).toBe(false)
        expect(result.errorMessage).toBeUndefined()
      })
    })

    describe('Pencegahan Bentrok Ruangan & Tutor Beririsan', () => {
      it('mencegah bentrok ruangan pada hari sama dan jam beririsan ((Mulai_A < Selesai_B) && (Selesai_A > Mulai_B))', () => {
        // existing sch-101: rm-1, Senin, 16:00–17:30
        // candidate: rm-1, Senin, 16:30–18:00 (irisan: 16:30 < 17:30 && 18:00 > 16:00)
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

      it('mencegah bentrok tutor pada hari sama dan jam beririsan meski di ruangan berbeda', () => {
        // existing sch-101: tut-1 di rm-1, Senin, 16:00–17:30
        // candidate: tut-1 di rm-3, Senin, 15:30–17:00 (irisan: 15:30 < 17:30 && 17:00 > 16:00)
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
      })

      it('mencegah bentrok ganda (ruangan & tutor sekaligus) dengan pesan terpadu yang jelas', () => {
        // candidate memakai rm-1 (sch-101) dan tut-2 (sch-102) pada Senin 16:15–17:15
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

      it('memberikan rekomendasi ruangan alternatif yang tidak terpakai saat terjadi bentrok ruangan', () => {
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

        const suggestedIds = result.suggestedRooms?.map((r) => r.id)
        expect(suggestedIds).toContain('rm-3')
        expect(suggestedIds).not.toContain('rm-1')
        expect(suggestedIds).not.toContain('rm-2')
      })
    })

    describe('Kasus Bebas Bentrok & Kasus Batas Waktu', () => {
      it('mengizinkan jadwal pada hari berbeda walaupun jam, ruangan, dan tutor sama', () => {
        const candidateDifferentDay: ScheduleCandidate = {
          roomId: 'rm-1',
          tutorId: 'tut-1',
          dayOfWeek: 'Selasa', // Berbeda dari Senin
          startTime: '16:00',
          endTime: '17:30',
        }
        const result = detectScheduleConflicts(candidateDifferentDay, existingSchedules, dummyRooms)
        expect(result.hasConflict).toBe(false)
        expect(result.errorMessage).toBeUndefined()
      })

      it('mengizinkan jadwal berurutan (misal 16:00-17:30 dan 17:30-19:00) tanpa bentrok', () => {
        // Sesi sesudahnya: Mulai_A == Selesai_B (17:30 == 17:30)
        const candidateAfter: ScheduleCandidate = {
          roomId: 'rm-1',
          tutorId: 'tut-1',
          dayOfWeek: 'Senin',
          startTime: '17:30',
          endTime: '19:00',
        }
        const resultAfter = detectScheduleConflicts(candidateAfter, existingSchedules, dummyRooms)
        expect(resultAfter.hasConflict).toBe(false)

        // Sesi sebelumnya: Selesai_A == Mulai_B (16:00 == 16:00)
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

      it('validasi pembaruan jadwal (updateSchedule) tidak bentrok dengan ID dirinya sendiri', () => {
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

    describe('Integrasi Operasi Store adminStore addSchedule & updateSchedule', () => {
      it('addSchedule melempar error deskriptif jika terdapat bentrok jadwal', () => {
        const base = adminStore.getState().schedules[0]
        expect(base).toBeDefined()

        expect(() => {
          adminStore.addSchedule({
            classId: 'cls-dummy',
            className: 'Kelas Uji Tambahan',
            subjectName: 'Fisika Lanjutan',
            tutorId: base.tutorId,
            tutorName: base.tutorName,
            roomId: base.roomId,
            roomName: base.roomName,
            dayOfWeek: base.dayOfWeek,
            startTime: base.startTime,
            endTime: base.endTime,
          })
        }).toThrow(/Bentrok/)
      })

      it('updateSchedule melempar error deskriptif jika perubahan memicu bentrok dengan jadwal lain', () => {
        const schedules = adminStore.getState().schedules
        if (schedules.length >= 2) {
          const sch1 = schedules[0]
          const sch2 = schedules[1]

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

      it('updateSchedule berhasil memperbarui jadwal saat dialokasikan ke slot waktu aman', () => {
        const schedules = adminStore.getState().schedules
        const target = schedules[0]
        expect(target).toBeDefined()

        const updated = adminStore.updateSchedule(target.id, {
          subjectName: 'Matematika Terapan',
          dayOfWeek: 'Sabtu',
          startTime: '13:00',
          endTime: '14:30',
        })

        expect(updated.subjectName).toBe('Matematika Terapan')
        expect(updated.dayOfWeek).toBe('Sabtu')
        expect(updated.startTime).toBe('13:00')
        expect(updated.endTime).toBe('14:30')
      })
    })
  })

  // =========================================================================
  // 3. UJI KONSUMSI DATA DASHBOARD (TUTOR & SISWA HOOKS)
  // =========================================================================
  describe('3. Konsumsi Data Dashboard: Hook Filtering Jadwal', () => {
    describe('useTutorDashboardData: Filter Jadwal Tutor Aktif', () => {
      it('useTutorDashboardData menyaring jadwal sesuai tutor aktif dengan argumen eksplisit', () => {
        const targetTutorId = 'tut-1'
        const result = renderHookWithClient(() => useTutorDashboardData(targetTutorId))

        expect(result).toBeDefined()
        expect(result.tutor).toBeDefined()
        expect(result.tutor.id).toBe(targetTutorId)

        // Verifikasi bahwa seluruh jadwal yang dikembalikan milik tutor aktif
        expect(result.schedules.length).toBeGreaterThan(0)
        for (const schedule of result.schedules) {
          expect(schedule.tutorId).toBe(targetTutorId)
        }

        // Pastikan jadwal tutor lain (misal tut-2) tidak bocor ke dashboard tut-1
        const otherTutorSchedules = result.schedules.filter((s) => s.tutorId !== targetTutorId)
        expect(otherTutorSchedules.length).toBe(0)
      })

      it('useTutorDashboardData menggunakan tutor dari active session saat targetTutorId tidak disediakan', () => {
        const result = renderHookWithClient(() => useTutorDashboardData())

        expect(result).toBeDefined()
        expect(result.tutor).toBeDefined()
        expect(result.tutor.id).toBe(adminStore.getState().activeTutorId)

        for (const schedule of result.schedules) {
          expect(schedule.tutorId).toBe(adminStore.getState().activeTutorId)
        }
      })

      it('useTutorDashboardData tetap mengembalikan array jadwal kosong jika tutor belum memiliki jadwal mengajar', () => {
        // Buat tutor baru tanpa jadwal
        const newTutor = adminStore.addTutor({
          name: 'Tutor Percobaan Tanpa Jadwal, S.Kom',
          phone: '081299998888',
          education: 'S1 Teknik Informatika',
          subjects: ['Informatika'],
        })

        const result = renderHookWithClient(() => useTutorDashboardData(newTutor.id))
        expect(result.tutor.id).toBe(newTutor.id)
        expect(result.schedules).toEqual([])
      })
    })

    describe('useStudentDashboardData: Filter Jadwal Rombel Kelas Siswa', () => {
      it('useStudentDashboardData menyaring jadwal sesuai rombel kelas siswa dengan argumen eksplisit', () => {
        const targetStudentId = 'stu-1'
        const expectedStudent = adminStore.getState().students.find((s) => s.id === targetStudentId)
        expect(expectedStudent).toBeDefined()
        expect(expectedStudent?.classId).toBeDefined()

        const result = renderHookWithClient(() => useStudentDashboardData(targetStudentId))

        expect(result).toBeDefined()
        expect(result.student).toBeDefined()
        expect(result.student.id).toBe(targetStudentId)

        // Verifikasi bahwa seluruh jadwal yang dikembalikan milik rombel kelas siswa bersangkutan
        expect(result.classSchedules.length).toBeGreaterThan(0)
        for (const schedule of result.classSchedules) {
          expect(schedule.classId).toBe(expectedStudent?.classId)
        }

        // Pastikan jadwal rombel kelas lain tidak tercampur ke dashboard siswa
        const otherClassSchedules = result.classSchedules.filter(
          (s) => s.classId !== expectedStudent?.classId
        )
        expect(otherClassSchedules.length).toBe(0)
      })

      it('useStudentDashboardData menggunakan student dari active session saat targetStudentId tidak disediakan', () => {
        const result = renderHookWithClient(() => useStudentDashboardData())

        expect(result).toBeDefined()
        expect(result.student).toBeDefined()
        expect(result.student.id).toBe(adminStore.getState().activeStudentId)

        for (const schedule of result.classSchedules) {
          expect(schedule.classId).toBe(result.student.classId)
        }
      })

      it('useStudentDashboardData mengembalikan array jadwal kosong jika rombel kelas siswa belum memiliki sesi bimbingan', () => {
        // Buat kelas baru tanpa jadwal
        const newClass = adminStore.addClass({
          name: 'Kelas Khusus UTBK Sore',
          courseCode: 'UTBK',
          courseName: 'Program Intensif UTBK-SNBT',
          capacity: 12,
          tutorName: 'Pak Hendra Wijaya, M.Pd',
        })

        // Buat siswa baru yang ditempatkan pada kelas tersebut
        const newStudent = adminStore.addStudent({
          name: 'Siswa Percobaan Baru',
          email: 'siswa.dummy@tadulakocendekia.sch.id',
          phone: '081233334444',
          school: 'SMA Negeri 1 Palu',
          packageCode: 'UTBK',
          classId: newClass.id,
          className: newClass.name,
          parentName: 'Bapak Siswa Dummy',
          parentPhone: '081255556666',
        })

        const result = renderHookWithClient(() => useStudentDashboardData(newStudent.id))
        expect(result.student.id).toBe(newStudent.id)
        expect(result.student.classId).toBe(newClass.id)
        expect(result.classSchedules).toEqual([])
      })
    })
  })
})
