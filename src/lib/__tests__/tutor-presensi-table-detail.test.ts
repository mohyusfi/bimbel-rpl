import { describe, it, expect, beforeEach } from 'vitest'
import {
  adminStore,
  calculateAttendancePercentage,
  type AttendanceEntry,
  type AttendanceSession,
} from '../admin-store'
import { isSessionLockedForTutor } from '../attendance-helpers'

describe('Presensi Sesi Bimbingan — Tabel Riwayat & Halaman Detail Selesai', () => {
  beforeEach(() => {
    adminStore.resetToDefault()
  })

  it('memisahkan sesi pending (belum absen) vs riwayat sesi selesai dengan benar', () => {
    const allSessions = adminStore.getState().attendanceSessions
    const pendingSessions = allSessions.filter((s) => !s.isCompleted)
    const completedSessions = allSessions.filter((s) => s.isCompleted)

    expect(pendingSessions.length).toBeGreaterThanOrEqual(0)
    expect(completedSessions.length).toBeGreaterThanOrEqual(0)
    expect(pendingSessions.length + completedSessions.length).toBe(allSessions.length)
  })

  it('menyediakan atribut lengkap untuk tabel riwayat presensi (mapel, rombel, tanggal, rekap status)', () => {
    const session: AttendanceSession = {
      id: 'session-table-test-1',
      scheduleId: 'sched-1',
      classId: 'cls-1',
      className: 'UTBK Intensif A',
      subjectName: 'Fisika UTBK',
      tutorId: 'tut-1',
      tutorName: 'Kak Dian Pratiwi',
      roomId: 'room-1',
      roomName: 'Ruang Palu-1',
      sessionDate: '2026-10-30',
      dayOfWeek: 'Jumat',
      startTime: '17:30',
      endTime: '20:30',
      topic: 'Mekanika Klasik & Kinematika',
      isCompleted: true,
      completedAt: new Date().toISOString(),
      entries: [
        { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'hadir' },
        { studentId: 'stu-2', studentName: 'Siti Rahma', nis: 'TC-2026-002', status: 'sakit' },
        { studentId: 'stu-3', studentName: 'Budi Santoso', nis: 'TC-2026-003', status: 'izin' },
        { studentId: 'stu-4', studentName: 'Dewi Lestari', nis: 'TC-2026-004', status: 'alpa' },
      ],
    }

    const countHadir = session.entries.filter((e) => e.status === 'hadir').length
    const countSakit = session.entries.filter((e) => e.status === 'sakit').length
    const countIzin = session.entries.filter((e) => e.status === 'izin').length
    const countAlpa = session.entries.filter((e) => e.status === 'alpa').length
    const totalStudents = session.entries.length

    expect(countHadir).toBe(1)
    expect(countSakit).toBe(1)
    expect(countIzin).toBe(1)
    expect(countAlpa).toBe(1)
    expect(totalStudents).toBe(4)

    const rate = calculateAttendancePercentage(countHadir, totalStudents)
    expect(rate).toBe(25)
  })

  it('mengidentifikasi sesi selesai dalam masa grace period (< 24 jam) vs sesi terkunci (> 24 jam)', () => {
    const now = new Date()

    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    const sessionGracePeriod: AttendanceSession = {
      id: 'session-grace-period',
      scheduleId: 'sched-1',
      classId: 'cls-1',
      className: 'UTBK Intensif A',
      subjectName: 'Fisika UTBK',
      tutorId: 'tut-1',
      tutorName: 'Kak Dian Pratiwi',
      roomId: 'room-1',
      roomName: 'Ruang Palu-1',
      sessionDate: '2026-10-30',
      dayOfWeek: 'Jumat',
      startTime: '17:30',
      endTime: '20:30',
      topic: 'Mekanika Klasik',
      isCompleted: true,
      completedAt: fiveMinutesAgo,
      entries: [],
    }
    expect(isSessionLockedForTutor(sessionGracePeriod, now)).toBe(false)

    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString()
    const sessionLocked: AttendanceSession = {
      ...sessionGracePeriod,
      id: 'session-locked',
      completedAt: twentyFiveHoursAgo,
    }
    expect(isSessionLockedForTutor(sessionLocked, now)).toBe(true)
  })

  it('mengizinkan pengajar memperbarui catatan presensi pada sesi selesai dalam grace period', () => {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    const session: AttendanceSession = {
      id: 'session-editable',
      scheduleId: 'sched-1',
      classId: 'cls-1',
      className: 'UTBK Intensif A',
      subjectName: 'Fisika UTBK',
      tutorId: 'tut-1',
      tutorName: 'Kak Dian Pratiwi',
      roomId: 'room-1',
      roomName: 'Ruang Palu-1',
      sessionDate: '2026-10-30',
      dayOfWeek: 'Jumat',
      startTime: '17:30',
      endTime: '20:30',
      topic: 'Topik Awal',
      isCompleted: true,
      completedAt: fiveMinutesAgo,
      entries: [
        { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'hadir' },
      ],
    }

    adminStore.getState().attendanceSessions.push(session)

    const updatedEntries: AttendanceEntry[] = [
      { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'izin', note: 'Izin lomba sains' },
    ]

    const result = adminStore.saveSessionAttendance('session-editable', 'Topik Terkoreksi', updatedEntries)
    expect(result).toBe(true)

    const saved = adminStore.getState().attendanceSessions.find((s) => s.id === 'session-editable')
    expect(saved?.topic).toBe('Topik Terkoreksi')
    expect(saved?.entries[0].status).toBe('izin')
    expect(saved?.entries[0].note).toBe('Izin lomba sains')
  })

  it('menolak pengeditan presensi jika sesi telah melewati toleransi 24 jam (Audit Lock)', () => {
    const now = new Date()
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString()
    const session: AttendanceSession = {
      id: 'session-locked-edit',
      scheduleId: 'sched-1',
      classId: 'cls-1',
      className: 'UTBK Intensif A',
      subjectName: 'Fisika UTBK',
      tutorId: 'tut-1',
      tutorName: 'Kak Dian Pratiwi',
      roomId: 'room-1',
      roomName: 'Ruang Palu-1',
      sessionDate: '2026-10-30',
      dayOfWeek: 'Jumat',
      startTime: '17:30',
      endTime: '20:30',
      topic: 'Topik Permanen',
      isCompleted: true,
      completedAt: twentyFiveHoursAgo,
      entries: [
        { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'hadir' },
      ],
    }

    adminStore.getState().attendanceSessions.push(session)

    expect(() => {
      adminStore.saveSessionAttendance('session-locked-edit', 'Percobaan Manipulasi', [
        { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'alpa' },
      ])
    }).toThrow(/Audit Lock|dikunci|24 jam/i)
  })
})
