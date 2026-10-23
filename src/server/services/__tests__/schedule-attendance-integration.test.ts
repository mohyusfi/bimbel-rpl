import { describe, it, expect } from 'vitest'
import { adminStore } from '~/lib/admin-store'

describe('Jadwal & Presensi Sesi Bimbingan Tutor Integration', () => {
  it('otomatis generate sesi perdana di attendanceSessions saat jadwal baru ditambahkan', () => {
    const initialSessionCount = adminStore.getState().attendanceSessions.length

    // Tambah jadwal baru untuk Kak Dian Pratiwi
    const newSchedule = adminStore.addSchedule({
      classId: 'cls-1',
      className: 'UTBK Intensif A',
      subjectName: 'Fisika Lanjutan UTBK',
      tutorId: 'tut-1',
      tutorName: 'Kak Dian Pratiwi, S.Si',
      roomId: 'rm-3',
      roomName: 'Ruang Palu-3',
      dayOfWeek: 'Jumat',
      startTime: '16:00',
      endTime: '17:30',
    })

    expect(newSchedule.id).toBeDefined()

    // Verifikasi sesi perdana langsung terbuat
    const allSessions = adminStore.getState().attendanceSessions
    expect(allSessions.length).toBe(initialSessionCount + 1)

    const createdSession = allSessions.find((s) => s.scheduleId === newSchedule.id)
    expect(createdSession).toBeDefined()
    expect(createdSession?.tutorId).toBe('tut-1')
    expect(createdSession?.subjectName).toBe('Fisika Lanjutan UTBK')
    expect(createdSession?.isCompleted).toBe(false)
    expect(createdSession?.startTime).toBe('16:00')
    expect(createdSession?.endTime).toBe('17:30')
    expect(createdSession?.dayOfWeek).toBe('Jumat')

    // Verifikasi sesi berstatus belum selesai (Perlu Presensi) sehingga langsung tampil di antarmuka
    const pendingForTutor = allSessions.filter(
      (s) => s.tutorId === 'tut-1' && !s.isCompleted
    )
    expect(pendingForTutor.some((s) => s.id === createdSession?.id)).toBe(true)
  })
})
