import { describe, it, expect } from 'vitest'
import { adminStore } from '~/lib/admin-store'
import { attendanceService } from '../attendance.service'
import { isSessionLockedForTutor } from '~/lib/attendance-helpers'

describe('Regression: Simpan Presensi Sesi & Transisi ke Riwayat', () => {
  it('menolak edit presensi sesi yang telah melewati grace period 2 jam (Audit Lock) via isSessionLockedForTutor', () => {
    const now = new Date()
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()

    // Sesi selesai lebih dari 2 jam yang lalu -> Harus TERKUNCI (true)
    const lockedSession = {
      isCompleted: true,
      sessionDate: '2026-10-20',
      completedAt: threeHoursAgo,
    }
    expect(isSessionLockedForTutor(lockedSession, now)).toBe(true)

    // Sesi baru selesai 1 jam yang lalu (dalam grace period) -> Tidak terkunci (false)
    const openSession = {
      isCompleted: true,
      sessionDate: '2026-10-23',
      completedAt: oneHourAgo,
    }
    expect(isSessionLockedForTutor(openSession, now)).toBe(false)

    // Sesi belum selesai -> Tidak pernah terkunci
    const pendingSession = {
      isCompleted: false,
      sessionDate: '2026-10-20',
    }
    expect(isSessionLockedForTutor(pendingSession, now)).toBe(false)
  })

  it('menolak simpan presensi jika terdapat entri siswa duplikat (DUPLICATE_STUDENT_ENTRY)', async () => {
    const res = await attendanceService.saveSessionAttendance({
      sessionId: 'ses-mock-1',
      topic: 'Percobaan Duplikat Siswa',
      entries: [
        { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'hadir' },
        { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'izin' },
      ],
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.code).toBe('DUPLICATE_STUDENT_ENTRY')
    }
  })

  it('memperbarui isCompleted menjadi true pada local store saat saveSessionAttendance dijalankan', () => {
    const sched = adminStore.addSchedule({
      classId: 'c1000000-0000-0000-0000-000000000001',
      className: 'UTBK Intensif A',
      subjectName: 'Fisika Lanjutan Store',
      tutorId: 'tut-1',
      tutorName: 'Kak Dian Pratiwi, S.Si',
      roomId: 'rm-1',
      roomName: 'Ruang Palu-1',
      dayOfWeek: 'Kamis',
      startTime: '10:00',
      endTime: '11:30',
    })

    const dummy = adminStore.getState().attendanceSessions.find((s) => s.scheduleId === sched.id)!
    expect(dummy).toBeDefined()
    expect(dummy.isCompleted).toBe(false)

    const res = adminStore.saveSessionAttendance(
      dummy.id,
      'Fisika Lanjutan - Dinamika',
      [
        { studentId: 'stu-1', studentName: 'Fahri Ramadhan', nis: 'TC-2026-001', status: 'hadir' },
      ]
    )

    expect(res).toBe(true)
    const updated = adminStore.getState().attendanceSessions.find((s) => s.id === dummy.id)
    expect(updated?.isCompleted).toBe(true)
    expect(updated?.completedAt).toBeDefined()
  })
})
