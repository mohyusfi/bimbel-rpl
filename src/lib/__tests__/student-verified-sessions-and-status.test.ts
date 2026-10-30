import { describe, it, expect } from 'vitest'
import {
  parseJoinDateToComparableDate,
  isSessionPast,
  resolveStudentSessionStatus,
  filterStudentSessionsByJoinDate,
} from '~/lib/attendance-helpers'
import type { AttendanceSession } from '~/lib/admin-store'

describe('Presensi Sesi & Filter Pasca Verifikasi Siswa (ATTEND & SCHED)', () => {
  describe('1. parseJoinDateToComparableDate', () => {
    it('mengurai format ISO date YYYY-MM-DD dengan benar', () => {
      expect(parseJoinDateToComparableDate('2026-10-30')).toBe('2026-10-30')
      expect(parseJoinDateToComparableDate('2026-10-30T07:15:00.000Z')).toBe('2026-10-30')
    })

    it('mengurai format tanggal Indonesia teks (misal "30 Oktober 2026")', () => {
      expect(parseJoinDateToComparableDate('30 Oktober 2026')).toBe('2026-10-30')
      expect(parseJoinDateToComparableDate('5 Mei 2026')).toBe('2026-05-05')
      expect(parseJoinDateToComparableDate('1 Januari 2026')).toBe('2026-01-01')
    })

    it('menangani input null, undefined, atau string kosong secara aman', () => {
      expect(parseJoinDateToComparableDate(undefined)).toBeNull()
      expect(parseJoinDateToComparableDate('')).toBeNull()
      expect(parseJoinDateToComparableDate('invalid-date')).toBeNull()
    })
  })

  describe('2. isSessionPast', () => {
    it('mengembalikan true jika tanggal sesi lebih awal dari hari ini', () => {
      const today = new Date('2026-10-30T10:00:00')
      expect(isSessionPast('2026-10-29', '17:30', today)).toBe(true)
    })

    it('mengembalikan false jika tanggal sesi di masa depan', () => {
      const today = new Date('2026-10-30T10:00:00')
      expect(isSessionPast('2026-10-31', '09:00', today)).toBe(false)
    })

    it('mengecek jam selesai jika sesi diadakan pada hari yang sama', () => {
      const nowAt18 = new Date('2026-10-30T18:00:00')
      // Sesi berakhir jam 17:30 -> sudah lewat
      expect(isSessionPast('2026-10-30', '17:30', nowAt18)).toBe(true)

      const nowAt15 = new Date('2026-10-30T15:00:00')
      // Sesi berakhir jam 17:30 -> belum lewat
      expect(isSessionPast('2026-10-30', '17:30', nowAt15)).toBe(false)
    })
  })

  describe('3. resolveStudentSessionStatus', () => {
    it('mengembalikan "terjadwal" jika sesi masa depan dan belum selesai', () => {
      const now = new Date('2026-10-30T10:00:00')
      const status = resolveStudentSessionStatus({
        isCompleted: false,
        sessionDate: '2026-11-01',
        endTime: '12:00',
        hasEntry: false,
        now,
      })
      expect(status).toBe('terjadwal')
    })

    it('mengembalikan "menunggu_tutor" jika waktu sesi sudah terlewat namun belum disubmit tutor', () => {
      const now = new Date('2026-10-30T18:00:00')
      const status = resolveStudentSessionStatus({
        isCompleted: false,
        sessionDate: '2026-10-30',
        endTime: '17:30',
        hasEntry: false,
        now,
      })
      expect(status).toBe('menunggu_tutor')
    })

    it('mengembalikan status kehadiran siswa jika sesi sudah disubmit tutor dan data ada', () => {
      const status = resolveStudentSessionStatus({
        isCompleted: true,
        sessionDate: '2026-10-30',
        hasEntry: true,
        entryStatus: 'hadir',
      })
      expect(status).toBe('hadir')
    })

    it('mengembalikan "belum_dicatat" jika sesi sudah disubmit tutor namun nama siswa tidak ada di daftar', () => {
      const status = resolveStudentSessionStatus({
        isCompleted: true,
        sessionDate: '2026-10-30',
        hasEntry: false,
      })
      expect(status).toBe('belum_dicatat')
    })
  })

  describe('4. filterStudentSessionsByJoinDate', () => {
    const mockSessions: AttendanceSession[] = [
      {
        id: 'sess-old-1',
        scheduleId: 'sch-1',
        classId: 'class-utbk-a',
        className: 'UTBK Intensif A',
        subjectName: 'Matematika Dasar',
        tutorId: 'tut-1',
        tutorName: 'Kak Budi',
        roomId: 'room-1',
        roomName: 'Ruang A',
        sessionDate: '2026-10-15',
        dayOfWeek: 'Kamis',
        startTime: '16:00',
        endTime: '17:30',
        topic: 'Aljabar',
        isCompleted: true,
        entries: [],
      },
      {
        id: 'sess-old-trial',
        scheduleId: 'sch-1',
        classId: 'class-utbk-a',
        className: 'UTBK Intensif A',
        subjectName: 'Fisika UTBK',
        tutorId: 'tut-2',
        tutorName: 'Kak Dian',
        roomId: 'room-1',
        roomName: 'Ruang A',
        sessionDate: '2026-10-20',
        dayOfWeek: 'Selasa',
        startTime: '16:00',
        endTime: '17:30',
        topic: 'Kinematika Trial',
        isCompleted: true,
        entries: [
          {
            studentId: 'student-new',
            studentName: 'Siswa Baru',
            nis: 'TC-001',
            status: 'hadir',
          },
        ],
      },
      {
        id: 'sess-current',
        scheduleId: 'sch-1',
        classId: 'class-utbk-a',
        className: 'UTBK Intensif A',
        subjectName: 'Kimia UTBK',
        tutorId: 'tut-3',
        tutorName: 'Kak Siti',
        roomId: 'room-1',
        roomName: 'Ruang A',
        sessionDate: '2026-10-30',
        dayOfWeek: 'Jumat',
        startTime: '16:00',
        endTime: '17:30',
        topic: 'Stoikiometri',
        isCompleted: false,
        entries: [],
      },
      {
        id: 'sess-future',
        scheduleId: 'sch-1',
        classId: 'class-utbk-a',
        className: 'UTBK Intensif A',
        subjectName: 'Biologi UTBK',
        tutorId: 'tut-4',
        tutorName: 'Kak Ahmad',
        roomId: 'room-1',
        roomName: 'Ruang A',
        sessionDate: '2026-11-05',
        dayOfWeek: 'Kamis',
        startTime: '16:00',
        endTime: '17:30',
        topic: 'Genetika',
        isCompleted: false,
        entries: [],
      },
      {
        id: 'sess-other-class',
        scheduleId: 'sch-2',
        classId: 'class-smp-b',
        className: 'SMP Reguler B',
        subjectName: 'IPA Terpadu',
        tutorId: 'tut-1',
        tutorName: 'Kak Budi',
        roomId: 'room-2',
        roomName: 'Ruang B',
        sessionDate: '2026-10-30',
        dayOfWeek: 'Jumat',
        startTime: '14:00',
        endTime: '15:30',
        topic: 'Ekosistem',
        isCompleted: false,
        entries: [],
      },
    ]

    it('hanya menyertakan sesi yang tanggalnya >= tanggal verifikasi siswa, kecuali jika ada entri presensi eksplisit', () => {
      const studentId = 'student-new'
      const classId = 'class-utbk-a'
      const joinDate = '2026-10-30'

      const result = filterStudentSessionsByJoinDate(mockSessions, {
        studentId,
        classId,
        joinDate,
      })

      // Sesi sebelum 2026-10-30 tanpa entri (sess-old-1) harus disaring keluar
      expect(result.some((s) => s.id === 'sess-old-1')).toBe(false)

      // Sesi sebelum 2026-10-30 dengan entri eksplisit siswa (sess-old-trial) harus tetap dipertahankan
      expect(result.some((s) => s.id === 'sess-old-trial')).toBe(true)

      // Sesi hari ini (sess-current) dan masa depan (sess-future) harus disertakan
      expect(result.some((s) => s.id === 'sess-current')).toBe(true)
      expect(result.some((s) => s.id === 'sess-future')).toBe(true)

      // Sesi rombel kelas lain tidak boleh disertakan
      expect(result.some((s) => s.id === 'sess-other-class')).toBe(false)

      expect(result.length).toBe(3)
    })
  })
})
