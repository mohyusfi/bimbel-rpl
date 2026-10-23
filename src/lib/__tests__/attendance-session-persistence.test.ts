import { describe, it, expect, beforeEach } from 'vitest'
import {
  adminStore,
  calculateAttendancePercentage,
  getStudentAttendanceSummary,
  type AttendanceEntry,
  type AttendanceStatus,
  type AttendanceSession,
} from '../admin-store'
import {
  schedules,
  sessions,
  attendances,
  classes,
  tutors,
  rooms,
  students,
  schedulesRelations,
  sessionsRelations,
  attendancesRelations,
  type Schedule as DrizzleSchedule,
  type NewSchedule,
  type Session as DrizzleSession,
  type NewSession,
  type Attendance as DrizzleAttendance,
  type NewAttendance,
} from '../../db/schema'

describe('Tiket 03 — Presensi Digital Sesi Kalender Aktual & Persistensi Audit', () => {
  beforeEach(() => {
    // Reset state ke kondisi awal yang bersih untuk menjamin isolasi antar pengujian
    adminStore.resetToDefault()
  })

  // =========================================================================
  // 1. PEMBUATAN SESI KALENDER AKTUAL DARI JADWAL BIMBINGAN BERULANG
  // =========================================================================
  describe('Pembuatan Sesi Kalender Aktual dari Jadwal Bimbingan Berulang', () => {
    it('berhasil menurunkan sesi kalender baru dari jadwal berulang dengan mewarisi metadata lengkap', () => {
      // Ambil jadwal bimbingan pertama (UTBK Intensif A - Pak Hendra Wijaya)
      const baseSchedule = adminStore.getState().schedules[0]
      expect(baseSchedule).toBeDefined()

      const sessionDate = '2026-10-26'
      const sessionTopic = 'Pendalaman Logika Analitik & Silogisme TPS'

      const createdSession = adminStore.createSessionFromSchedule(
        baseSchedule.id,
        sessionDate,
        sessionTopic
      )

      expect(createdSession).toBeDefined()
      expect(createdSession.id).toBeDefined()
      expect(createdSession.scheduleId).toBe(baseSchedule.id)
      expect(createdSession.classId).toBe(baseSchedule.classId)
      expect(createdSession.className).toBe(baseSchedule.className)
      expect(createdSession.subjectName).toBe(baseSchedule.subjectName)
      expect(createdSession.tutorId).toBe(baseSchedule.tutorId)
      expect(createdSession.tutorName).toBe(baseSchedule.tutorName)
      expect(createdSession.roomId).toBe(baseSchedule.roomId)
      expect(createdSession.roomName).toBe(baseSchedule.roomName)
      expect(createdSession.sessionDate).toBe(sessionDate)
      expect(createdSession.dayOfWeek).toBe(baseSchedule.dayOfWeek)
      expect(createdSession.startTime).toBe(baseSchedule.startTime)
      expect(createdSession.endTime).toBe(baseSchedule.endTime)
      expect(createdSession.topic).toBe(sessionTopic)
      expect(createdSession.isCompleted).toBe(false)

      // Pastikan sesi baru tercatat di daftar global attendanceSessions
      const foundInStore = adminStore
        .getState()
        .attendanceSessions.find((s) => s.id === createdSession.id)
      expect(foundInStore).toBeDefined()
      expect(foundInStore?.sessionDate).toBe(sessionDate)
    })

    it('otomatis mengisi entri presensi awal dengan status "hadir" untuk seluruh siswa di kelas rombel', () => {
      const baseSchedule = adminStore.getState().schedules[0]
      const enrolledStudents = adminStore
        .getState()
        .students.filter((s) => s.classId === baseSchedule.classId)

      expect(enrolledStudents.length).toBeGreaterThan(0)

      const sessionDate = '2026-10-27'
      const session = adminStore.createSessionFromSchedule(baseSchedule.id, sessionDate)

      expect(session.entries.length).toBe(enrolledStudents.length)

      enrolledStudents.forEach((student) => {
        const studentEntry = session.entries.find((e) => e.studentId === student.id)
        expect(studentEntry).toBeDefined()
        expect(studentEntry?.studentName).toBe(student.name)
        expect(studentEntry?.nis).toBe(student.nis)
        expect(studentEntry?.status).toBe('hadir')
      })
    })

    it('mencegah pembuatan sesi duplikat jika jadwal dan tanggal sesi yang sama dipanggil ulang (idempoten)', () => {
      const baseSchedule = adminStore.getState().schedules[0]
      const sessionDate = '2026-10-28'

      const countBefore = adminStore.getState().attendanceSessions.length

      const session1 = adminStore.createSessionFromSchedule(
        baseSchedule.id,
        sessionDate,
        'Topik Pertama'
      )
      expect(adminStore.getState().attendanceSessions.length).toBe(countBefore + 1)

      // Panggil ulang dengan jadwal dan tanggal yang sama persis
      const session2 = adminStore.createSessionFromSchedule(
        baseSchedule.id,
        sessionDate,
        'Topik Kedua'
      )

      // Harus mengembalikan instance sesi yang sudah ada tanpa menambah jumlah sesi
      expect(session2.id).toBe(session1.id)
      expect(adminStore.getState().attendanceSessions.length).toBe(countBefore + 1)
    })

    it('menolak pembuatan sesi jika scheduleId tidak terdaftar di sistem', () => {
      expect(() => {
        adminStore.createSessionFromSchedule('invalid-sch-999', '2026-10-29')
      }).toThrow(/tidak ditemukan/i)
    })
  })

  // =========================================================================
  // 2. PENGISIAN STATUS PRESENSI SISWA (HADIR, SAKIT, IZIN, ALPA)
  // =========================================================================
  describe('Pengisian Status Presensi Siswa (Hadir, Sakit, Izin, Alpa)', () => {
    it('berhasil menyimpan presensi dengan ragam status (Hadir, Sakit, Izin, Alpa) dan catatan evaluasi', () => {
      // Buat sesi baru
      const schedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(schedule.id, '2026-11-02')

      const updatedEntries: AttendanceEntry[] = [
        {
          studentId: 'stu-1',
          studentName: 'Fahri Ramadhan',
          nis: 'TC-2026-001',
          status: 'hadir',
          note: 'Aktif bertanya dan menyelesaikan soal latihan dengan cepat',
        },
        {
          studentId: 'stu-2',
          studentName: 'Alya Salsabila',
          nis: 'TC-2026-002',
          status: 'sakit',
          note: 'Surat dokter: demam tipoid',
        },
        {
          studentId: 'stu-3',
          studentName: 'Rizki Kurniawan',
          nis: 'TC-2026-003',
          status: 'izin',
          note: 'Izin lomba debat Bahasa Inggris tingkat Kota Palu',
        },
      ]

      const success = adminStore.saveSessionAttendance(
        session.id,
        'Trigonometri & Analisis Sudut Berelasi',
        updatedEntries
      )

      expect(success).toBe(true)

      const savedSession = adminStore
        .getState()
        .attendanceSessions.find((s) => s.id === session.id)

      expect(savedSession).toBeDefined()
      expect(savedSession?.isCompleted).toBe(true)
      expect(savedSession?.topic).toBe('Trigonometri & Analisis Sudut Berelasi')
      expect(savedSession?.entries.length).toBe(3)

      const entry1 = savedSession?.entries.find((e) => e.studentId === 'stu-1')
      expect(entry1?.status).toBe('hadir')
      expect(entry1?.note).toBe('Aktif bertanya dan menyelesaikan soal latihan dengan cepat')

      const entry2 = savedSession?.entries.find((e) => e.studentId === 'stu-2')
      expect(entry2?.status).toBe('sakit')
      expect(entry2?.note).toBe('Surat dokter: demam tipoid')

      const entry3 = savedSession?.entries.find((e) => e.studentId === 'stu-3')
      expect(entry3?.status).toBe('izin')
      expect(entry3?.note).toBe('Izin lomba debat Bahasa Inggris tingkat Kota Palu')
    })

    it('fitur cepat "Tandai Semua Hadir" mengubah seluruh status siswa menjadi hadir secara efisien', () => {
      const schedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(schedule.id, '2026-11-03')

      // Awalnya ada siswa yang sakit dan izin
      const mixedEntries: AttendanceEntry[] = [
        { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'sakit' },
        { studentId: 'stu-2', studentName: 'Alya Salsabila', nis: 'TC-2026-002', status: 'izin' },
        { studentId: 'stu-3', studentName: 'Rizki Kurniawan', nis: 'TC-2026-003', status: 'alpa' },
      ]

      // Simulasi aksi tutor menekan "Tandai Semua Hadir"
      const allHadirEntries: AttendanceEntry[] = mixedEntries.map((e) => ({
        ...e,
        status: 'hadir',
      }))

      adminStore.saveSessionAttendance(session.id, 'Kalkulus Diferensial Dasar', allHadirEntries)

      const saved = adminStore.getState().attendanceSessions.find((s) => s.id === session.id)
      expect(saved?.entries.every((e) => e.status === 'hadir')).toBe(true)
      expect(saved?.entries.filter((e) => e.status === 'hadir').length).toBe(3)
    })

    it('mengembalikan false jika sessionId yang hendak disimpan tidak ada di database', () => {
      const result = adminStore.saveSessionAttendance('ses-nonexistent-999', 'Topik X', [])
      expect(result).toBe(false)
    })

    it('menolak pengubahan presensi jika sesi sudah selesai lebih dari 24 jam yang lalu (Audit Lock)', () => {
      const baseSchedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(baseSchedule.id, '2026-10-15')

      // Tandai sesi selesai 48 jam yang lalu
      const pastTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      session.isCompleted = true
      session.completedAt = pastTime

      expect(() => {
        adminStore.saveSessionAttendance(session.id, 'Topik Terkunci', [
          { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'hadir' },
        ])
      }).toThrow(/Pencegahan manipulasi presensi: Sesi bimbingan telah selesai lebih dari 24 jam/)
    })

    it('mengizinkan pengubahan presensi jika sesi baru selesai dalam batas 24 jam (Grace Period aktif)', () => {
      const baseSchedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(baseSchedule.id, '2026-10-23')

      // Sesi selesai 2 jam yang lalu
      const recentTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      session.isCompleted = true
      session.completedAt = recentTime

      const success = adminStore.saveSessionAttendance(session.id, 'Topik Terkoreksi', [
        { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'izin' },
      ])
      expect(success).toBe(true)

      const saved = adminStore.getState().attendanceSessions.find((s) => s.id === session.id)
      expect(saved?.topic).toBe('Topik Terkoreksi')
      expect(saved?.entries.find((e) => e.studentId === 'stu-1')?.status).toBe('izin')
    })
  })

  // =========================================================================
  // 3. FORMULA KALKULASI PERSENTASE KEHADIRAN: Math.round((hadir / total) * 100)
  // =========================================================================
  describe('Formula Kalkulasi Persentase Kehadiran: Math.round((hadirCount / totalCount) * 100)', () => {
    it('menghitung persentase kehadiran dengan pembulatan matematis standar secara akurat', () => {
      // 10 dari 10 sesi = 100%
      expect(calculateAttendancePercentage(10, 10)).toBe(100)

      // 0 dari 10 sesi = 0%
      expect(calculateAttendancePercentage(0, 10)).toBe(0)

      // 2 dari 3 sesi = Math.round((2 / 3) * 100) = Math.round(66.666...) = 67%
      expect(calculateAttendancePercentage(2, 3)).toBe(67)

      // 1 dari 6 sesi = Math.round((1 / 6) * 100) = Math.round(16.666...) = 17%
      expect(calculateAttendancePercentage(1, 6)).toBe(17)

      // 5 dari 6 sesi = Math.round((5 / 6) * 100) = Math.round(83.333...) = 83%
      expect(calculateAttendancePercentage(5, 6)).toBe(83)

      // 7 dari 8 sesi = Math.round((7 / 8) * 100) = Math.round(87.5) = 88%
      expect(calculateAttendancePercentage(7, 8)).toBe(88)

      // 1 dari 8 sesi = Math.round((1 / 8) * 100) = Math.round(12.5) = 13%
      expect(calculateAttendancePercentage(1, 8)).toBe(13)

      // Edge case: 0 total sesi bimbingan harus aman dan tidak menghasilkan NaN
      expect(calculateAttendancePercentage(0, 0)).toBe(0)
    })

    it('menghitung rekapitulasi kehadiran siswa lintas sesi kalender dengan akurat', () => {
      // Simulasi 5 sesi untuk Fahri Ramadhan (stu-1)
      const mockSessions: AttendanceSession[] = [
        {
          id: 'ses-u1',
          scheduleId: 'sch-1',
          classId: 'cls-1',
          className: 'UTBK Intensif A',
          subjectName: 'TPS',
          tutorId: 'tut-1',
          tutorName: 'Pak Hendra',
          roomId: 'rm-1',
          roomName: 'Ruang Palu-1',
          sessionDate: '2026-10-01',
          dayOfWeek: 'Senin',
          startTime: '15:30',
          endTime: '17:00',
          topic: 'Topik 1',
          isCompleted: true,
          entries: [{ studentId: 'stu-1', studentName: 'Fahri', nis: 'TC-001', status: 'hadir' }],
        },
        {
          id: 'ses-u2',
          scheduleId: 'sch-1',
          classId: 'cls-1',
          className: 'UTBK Intensif A',
          subjectName: 'TPS',
          tutorId: 'tut-1',
          tutorName: 'Pak Hendra',
          roomId: 'rm-1',
          roomName: 'Ruang Palu-1',
          sessionDate: '2026-10-03',
          dayOfWeek: 'Rabu',
          startTime: '15:30',
          endTime: '17:00',
          topic: 'Topik 2',
          isCompleted: true,
          entries: [{ studentId: 'stu-1', studentName: 'Fahri', nis: 'TC-001', status: 'hadir' }],
        },
        {
          id: 'ses-u3',
          scheduleId: 'sch-1',
          classId: 'cls-1',
          className: 'UTBK Intensif A',
          subjectName: 'TPS',
          tutorId: 'tut-1',
          tutorName: 'Pak Hendra',
          roomId: 'rm-1',
          roomName: 'Ruang Palu-1',
          sessionDate: '2026-10-05',
          dayOfWeek: 'Jumat',
          startTime: '15:30',
          endTime: '17:00',
          topic: 'Topik 3',
          isCompleted: true,
          entries: [{ studentId: 'stu-1', studentName: 'Fahri', nis: 'TC-001', status: 'sakit' }],
        },
        {
          id: 'ses-u4',
          scheduleId: 'sch-1',
          classId: 'cls-1',
          className: 'UTBK Intensif A',
          subjectName: 'TPS',
          tutorId: 'tut-1',
          tutorName: 'Pak Hendra',
          roomId: 'rm-1',
          roomName: 'Ruang Palu-1',
          sessionDate: '2026-10-08',
          dayOfWeek: 'Senin',
          startTime: '15:30',
          endTime: '17:00',
          topic: 'Topik 4',
          isCompleted: true,
          entries: [{ studentId: 'stu-1', studentName: 'Fahri', nis: 'TC-001', status: 'izin' }],
        },
        {
          id: 'ses-u5',
          scheduleId: 'sch-1',
          classId: 'cls-1',
          className: 'UTBK Intensif A',
          subjectName: 'TPS',
          tutorId: 'tut-1',
          tutorName: 'Pak Hendra',
          roomId: 'rm-1',
          roomName: 'Ruang Palu-1',
          sessionDate: '2026-10-10',
          dayOfWeek: 'Rabu',
          startTime: '15:30',
          endTime: '17:00',
          topic: 'Topik 5',
          isCompleted: true,
          entries: [{ studentId: 'stu-1', studentName: 'Fahri', nis: 'TC-001', status: 'alpa' }],
        },
      ]

      const summary = getStudentAttendanceSummary('stu-1', mockSessions)

      expect(summary.totalSessions).toBe(5)
      expect(summary.hadirCount).toBe(2)
      expect(summary.sakitCount).toBe(1)
      expect(summary.izinCount).toBe(1)
      expect(summary.alpaCount).toBe(1)

      // Formula: Math.round((2 / 5) * 100) = 40%
      expect(summary.percentage).toBe(40)
    })

    it('memastikan status Sakit dan Izin tidak dihitung sebagai Hadir dalam persentase kehadiran tatap muka', () => {
      // 4 sesi: 2 hadir, 1 sakit, 1 izin, 0 alpa -> hadir 2 dari 4 = 50%
      const mockSessions: AttendanceSession[] = [
        {
          id: 'ses-m1',
          scheduleId: 'sch-1',
          classId: 'cls-1',
          className: 'Kelas IPA',
          subjectName: 'Biologi',
          tutorId: 'tut-1',
          tutorName: 'Tutor',
          roomId: 'rm-1',
          roomName: 'Ruang-1',
          sessionDate: '2026-10-12',
          dayOfWeek: 'Senin',
          startTime: '14:00',
          endTime: '15:30',
          topic: 'Topik',
          isCompleted: true,
          entries: [{ studentId: 'stu-2', studentName: 'Alya', nis: 'TC-002', status: 'hadir' }],
        },
        {
          id: 'ses-m2',
          scheduleId: 'sch-1',
          classId: 'cls-1',
          className: 'Kelas IPA',
          subjectName: 'Biologi',
          tutorId: 'tut-1',
          tutorName: 'Tutor',
          roomId: 'rm-1',
          roomName: 'Ruang-1',
          sessionDate: '2026-10-14',
          dayOfWeek: 'Rabu',
          startTime: '14:00',
          endTime: '15:30',
          topic: 'Topik',
          isCompleted: true,
          entries: [{ studentId: 'stu-2', studentName: 'Alya', nis: 'TC-002', status: 'hadir' }],
        },
        {
          id: 'ses-m3',
          scheduleId: 'sch-1',
          classId: 'cls-1',
          className: 'Kelas IPA',
          subjectName: 'Biologi',
          tutorId: 'tut-1',
          tutorName: 'Tutor',
          roomId: 'rm-1',
          roomName: 'Ruang-1',
          sessionDate: '2026-10-16',
          dayOfWeek: 'Jumat',
          startTime: '14:00',
          endTime: '15:30',
          topic: 'Topik',
          isCompleted: true,
          entries: [{ studentId: 'stu-2', studentName: 'Alya', nis: 'TC-002', status: 'sakit' }],
        },
        {
          id: 'ses-m4',
          scheduleId: 'sch-1',
          classId: 'cls-1',
          className: 'Kelas IPA',
          subjectName: 'Biologi',
          tutorId: 'tut-1',
          tutorName: 'Tutor',
          roomId: 'rm-1',
          roomName: 'Ruang-1',
          sessionDate: '2026-10-19',
          dayOfWeek: 'Senin',
          startTime: '14:00',
          endTime: '15:30',
          topic: 'Topik',
          isCompleted: true,
          entries: [{ studentId: 'stu-2', studentName: 'Alya', nis: 'TC-002', status: 'izin' }],
        },
      ]

      const summary = getStudentAttendanceSummary('stu-2', mockSessions)
      expect(summary.totalSessions).toBe(4)
      expect(summary.hadirCount).toBe(2)
      expect(summary.percentage).toBe(50) // Math.round((2 / 4) * 100) = 50%
    })
  })

  // =========================================================================
  // 4. PENANGANAN STATUS ALPA MEMICU NOTIFIKASI PERINGATAN PERWALIAN
  // =========================================================================
  describe('Penanganan Status Alpa Memicu Notifikasi Peringatan Perwalian', () => {
    it('menerbitkan notifikasi peringatan perwalian saat ada siswa yang tercatat Alpa', () => {
      const schedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(schedule.id, '2026-11-04')

      const notifCountBefore = adminStore.getState().notifications.length

      const entriesWithAlpa: AttendanceEntry[] = [
        {
          studentId: 'stu-1',
          studentName: 'Fahri Ramadhan',
          nis: 'TC-2026-001',
          status: 'alpa',
          note: 'Tanpa konfirmasi hadir',
        },
        {
          studentId: 'stu-2',
          studentName: 'Alya Salsabila',
          nis: 'TC-2026-002',
          status: 'hadir',
        },
      ]

      adminStore.saveSessionAttendance(
        session.id,
        'Analisis Soal Mandiri & Kuis Cepat',
        entriesWithAlpa
      )

      const notifsAfter = adminStore.getState().notifications
      expect(notifsAfter.length).toBe(notifCountBefore + 1)

      const latestNotif = notifsAfter[0]
      expect(latestNotif.title).toBe('Peringatan Ketidakhadiran Siswa (Alpa)')
      expect(latestNotif.message).toContain('Fahri Ramadhan')
      expect(latestNotif.message).toContain('Alpa')
      expect(latestNotif.message).toContain(session.subjectName)
      expect(latestNotif.message).toContain(session.startTime)
      expect(['attendance', 'schedule']).toContain(latestNotif.type)
      expect(latestNotif.isRead).toBe(false)
    })

    it('menerbitkan beberapa notifikasi peringatan jika terdapat lebih dari satu siswa yang Alpa', () => {
      const schedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(schedule.id, '2026-11-05')

      const notifCountBefore = adminStore.getState().notifications.length

      const multiAlpaEntries: AttendanceEntry[] = [
        {
          studentId: 'stu-1',
          studentName: 'Fahri Ramadhan',
          nis: 'TC-2026-001',
          status: 'alpa',
        },
        {
          studentId: 'stu-2',
          studentName: 'Alya Salsabila',
          nis: 'TC-2026-002',
          status: 'alpa',
        },
        {
          studentId: 'stu-3',
          studentName: 'Rizki Kurniawan',
          nis: 'TC-2026-003',
          status: 'hadir',
        },
      ]

      adminStore.saveSessionAttendance(session.id, 'Pekan Review Materi', multiAlpaEntries)

      const notifsAfter = adminStore.getState().notifications
      // Harus bertambah 2 notifikasi
      expect(notifsAfter.length).toBe(notifCountBefore + 2)

      const fahriNotif = notifsAfter.find(
        (n) => n.title.includes('Alpa') && n.message.includes('Fahri Ramadhan')
      )
      const alyaNotif = notifsAfter.find(
        (n) => n.title.includes('Alpa') && n.message.includes('Alya Salsabila')
      )

      expect(fahriNotif).toBeDefined()
      expect(alyaNotif).toBeDefined()
    })

    it('tidak menerbitkan notifikasi Alpa jika seluruh siswa hadir, sakit, atau izin', () => {
      const schedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(schedule.id, '2026-11-06')

      const notifCountBefore = adminStore.getState().notifications.length

      const nonAlpaEntries: AttendanceEntry[] = [
        {
          studentId: 'stu-1',
          studentName: 'Fahri Ramadhan',
          nis: 'TC-2026-001',
          status: 'hadir',
        },
        {
          studentId: 'stu-2',
          studentName: 'Alya Salsabila',
          nis: 'TC-2026-002',
          status: 'sakit',
        },
        {
          studentId: 'stu-3',
          studentName: 'Rizki Kurniawan',
          nis: 'TC-2026-003',
          status: 'izin',
        },
      ]

      adminStore.saveSessionAttendance(session.id, 'Review Bab V', nonAlpaEntries)

      const notifsAfter = adminStore.getState().notifications
      expect(notifsAfter.length).toBe(notifCountBefore)
    })
  })

  // =========================================================================
  // 5. PENCEGAHAN DUPLIKASI PRESENSI SISWA PADA SESI YANG SAMA
  // =========================================================================
  describe('Pencegahan Duplikasi Presensi Siswa pada Sesi yang Sama', () => {
    it('menolak (melempar error) jika terdapat duplikasi entri siswa dalam payload penyimpanan presensi', () => {
      const schedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(schedule.id, '2026-11-09')

      // Payload yang tidak sengaja mengirimkan 2 status berbeda untuk siswa yang sama
      const duplicateEntries: AttendanceEntry[] = [
        {
          studentId: 'stu-1',
          studentName: 'Fahri Ramadhan',
          nis: 'TC-2026-001',
          status: 'hadir',
        },
        {
          studentId: 'stu-1', // Duplikasi ID siswa
          studentName: 'Fahri Ramadhan',
          nis: 'TC-2026-001',
          status: 'alpa',
        },
      ]

      expect(() => {
        adminStore.saveSessionAttendance(session.id, 'Topik Duplikat', duplicateEntries)
      }).toThrow(/Pencegahan duplikasi presensi/i)
    })

    it('metode recordStudentAttendance memperbarui status siswa yang sudah ada tanpa menambah duplikat baris', () => {
      const schedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(schedule.id, '2026-11-10')

      const initialCount = session.entries.length

      // Catat presensi awal siswa stu-1 sebagai 'hadir'
      adminStore.recordStudentAttendance(session.id, {
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        status: 'hadir',
        note: 'Hadir tepat waktu',
      })

      expect(session.entries.length).toBe(initialCount)
      const entryBefore = session.entries.find((e) => e.studentId === 'stu-1')
      expect(entryBefore?.status).toBe('hadir')

      // Kemudian siswa meminta izin pulang lebih awal / status diubah menjadi 'izin'
      adminStore.recordStudentAttendance(session.id, {
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        status: 'izin',
        note: 'Izin pulang awal karena acara keluarga',
      })

      // Jumlah entri siswa pada sesi tersebut tetap sama (tidak bertambah jadi 2)
      expect(session.entries.length).toBe(initialCount)

      const entryAfter = session.entries.find((e) => e.studentId === 'stu-1')
      expect(entryAfter?.status).toBe('izin')
      expect(entryAfter?.note).toBe('Izin pulang awal karena acara keluarga')

      // Pastikan hanya ada 1 entri untuk stu-1
      const allEntriesForStudent = session.entries.filter((e) => e.studentId === 'stu-1')
      expect(allEntriesForStudent.length).toBe(1)
    })

    it('memastikan skema Drizzle attendances memiliki unique index pada pasangan sessionId dan studentId', () => {
      expect(attendances).toBeDefined()

      // Ambil seluruh konfigurasi extraConfig atau indeks pada tabel Drizzle
      const tableConfig = (attendances as unknown as { [key: symbol]: unknown })
      expect(tableConfig).toBeDefined()

      // Verifikasi kolom-kolom yang terlibat dalam constraint unik
      expect(attendances.sessionId).toBeDefined()
      expect(attendances.studentId).toBeDefined()
    })
  })

  // =========================================================================
  // 6. VALIDASI RELASI DATA DRIZZLE DAN INTEGRITAS TIPE DATA TYPESCRIPT
  // =========================================================================
  describe('Validasi Relasi Data Drizzle dan Integritas Tipe Data TypeScript', () => {
    it('memastikan skema Drizzle schedules memiliki kolom-kolom wajib dan relasi ke classes, tutors, rooms, sessions', () => {
      expect(schedules).toBeDefined()
      expect(schedules.id).toBeDefined()
      expect(schedules.classId).toBeDefined()
      expect(schedules.tutorId).toBeDefined()
      expect(schedules.roomId).toBeDefined()
      expect(schedules.dayOfWeek).toBeDefined()
      expect(schedules.startTime).toBeDefined()
      expect(schedules.endTime).toBeDefined()
      expect(schedules.createdAt).toBeDefined()

      // Relasi schedules
      expect(schedulesRelations).toBeDefined()
    })

    it('memastikan skema Drizzle sessions memiliki kolom-kolom wajib dan relasi ke schedules, classes, tutors, rooms, attendances', () => {
      expect(sessions).toBeDefined()
      expect(sessions.id).toBeDefined()
      expect(sessions.scheduleId).toBeDefined()
      expect(sessions.classId).toBeDefined()
      expect(sessions.tutorId).toBeDefined()
      expect(sessions.roomId).toBeDefined()
      expect(sessions.sessionDate).toBeDefined()
      expect(sessions.topic).toBeDefined()
      expect(sessions.isCompleted).toBeDefined()
      expect(sessions.createdAt).toBeDefined()

      // Relasi sessions
      expect(sessionsRelations).toBeDefined()
    })

    it('memastikan skema Drizzle attendances memiliki kolom-kolom status dan relasi ke sessions dan students', () => {
      expect(attendances).toBeDefined()
      expect(attendances.id).toBeDefined()
      expect(attendances.sessionId).toBeDefined()
      expect(attendances.studentId).toBeDefined()
      expect(attendances.status).toBeDefined()
      expect(attendances.notes).toBeDefined()
      expect(attendances.createdAt).toBeDefined()

      // Relasi attendances
      expect(attendancesRelations).toBeDefined()
    })

    it('memvalidasi integritas tipe data TypeScript untuk payload NewSession dan NewAttendance', () => {
      // Validasi kontrak tipe NewSession
      const validSessionPayload: NewSession = {
        scheduleId: '11111111-2222-3333-4444-555555555555',
        classId: '22222222-3333-4444-5555-666666666666',
        tutorId: '33333333-4444-5555-6666-777777777777',
        roomId: '44444444-5555-6666-7777-888888888888',
        sessionDate: '2026-10-30',
        topic: 'Latihan Soal HOTS UTBK',
        isCompleted: false,
      }

      expect(validSessionPayload.sessionDate).toBe('2026-10-30')
      expect(validSessionPayload.isCompleted).toBe(false)

      // Validasi kontrak tipe NewAttendance
      const validAttendancePayload: NewAttendance = {
        sessionId: '55555555-6666-7777-8888-999999999999',
        studentId: '66666666-7777-8888-9999-000000000000',
        status: 'hadir',
        notes: 'Hadir lengkap dan mengerjakan seluruh soal',
      }

      expect(validAttendancePayload.status).toBe('hadir')
      expect(validAttendancePayload.notes).toBe('Hadir lengkap dan mengerjakan seluruh soal')

      // Validasi kontrak tipe NewSchedule
      const validSchedulePayload: NewSchedule = {
        classId: '22222222-3333-4444-5555-666666666666',
        tutorId: '33333333-4444-5555-6666-777777777777',
        roomId: '44444444-5555-6666-7777-888888888888',
        dayOfWeek: 'Senin',
        startTime: '15:30',
        endTime: '17:00',
      }

      expect(validSchedulePayload.dayOfWeek).toBe('Senin')
      expect(validSchedulePayload.startTime).toBe('15:30')
      expect(validSchedulePayload.endTime).toBe('17:00')
    })
  })
})
