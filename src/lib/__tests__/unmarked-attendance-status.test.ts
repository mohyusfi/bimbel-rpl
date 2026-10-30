import { describe, it, expect } from 'vitest'
import { calculateAttendancePercentage } from '~/lib/attendance-helpers'

export interface MockSessionEntry {
  studentId: string
  status: 'hadir' | 'sakit' | 'izin' | 'alpa'
  note?: string
}

export interface MockSession {
  id: string
  sessionDate: string
  isCompleted: boolean
  entries: MockSessionEntry[]
}

export function resolveStudentAttendanceStatus(
  session: MockSession,
  studentId: string
): 'hadir' | 'sakit' | 'izin' | 'alpa' | 'terjadwal' | 'belum_diabsen' {
  const entry = session.entries.find((e) => e.studentId === studentId)
  if (!session.isCompleted) {
    return 'terjadwal'
  }
  return entry?.status || 'belum_diabsen'
}

describe('Unmarked Attendance Status & Attendance Rate Regression Tests', () => {
  const studentYusfiId = '954a274b-ebbc-48f1-bf8f-8ab2ac4f88f8'
  const studentFahriId = 'd992d9fc-6f5b-434f-998b-358e54a754b7'

  it('sesi yang sudah selesai (isCompleted = true) tetapi belum diabsen oleh tutor menghasilkan status "belum_diabsen", BUKAN "hadir"', () => {
    const completedSessionWithoutYusfi: MockSession = {
      id: 'session-1',
      sessionDate: '2026-10-30',
      isCompleted: true,
      entries: [
        {
          studentId: studentFahriId,
          status: 'hadir',
        },
      ],
    }

    const statusYusfi = resolveStudentAttendanceStatus(completedSessionWithoutYusfi, studentYusfiId)
    expect(statusYusfi).toBe('belum_diabsen')
    expect(statusYusfi).not.toBe('hadir')
  })

  it('sesi yang belum selesai (isCompleted = false) selalu menghasilkan status "terjadwal"', () => {
    const upcomingSession: MockSession = {
      id: 'session-2',
      sessionDate: '2026-11-05',
      isCompleted: false,
      entries: [],
    }

    const statusYusfi = resolveStudentAttendanceStatus(upcomingSession, studentYusfiId)
    expect(statusYusfi).toBe('terjadwal')
  })

  it('sesi yang sudah selesai dengan entri presensi siswa menghasilkan status aktual siswa tersebut', () => {
    const completedSessionWithBoth: MockSession = {
      id: 'session-3',
      sessionDate: '2026-11-06',
      isCompleted: true,
      entries: [
        {
          studentId: studentYusfiId,
          status: 'sakit',
          note: 'Surat dokter',
        },
        {
          studentId: studentFahriId,
          status: 'hadir',
        },
      ],
    }

    const statusYusfi = resolveStudentAttendanceStatus(completedSessionWithBoth, studentYusfiId)
    expect(statusYusfi).toBe('sakit')

    const statusFahri = resolveStudentAttendanceStatus(completedSessionWithBoth, studentFahriId)
    expect(statusFahri).toBe('hadir')
  })

  it('persentase kehadiran siswa baru yang belum pernah dievaluasi adalah 100% (bersih dari penalti)', () => {
    const hadirCount = 0
    const sakitCount = 0
    const izinCount = 0
    const alpaCount = 0
    const evaluatedTotal = hadirCount + sakitCount + izinCount + alpaCount

    const attendanceRate = calculateAttendancePercentage(hadirCount, evaluatedTotal)
    expect(attendanceRate).toBe(100)
  })

  it('persentase kehadiran dihitung proporsional hanya dari sesi yang telah dievaluasi', () => {
    const hadirCount = 3
    const sakitCount = 1
    const izinCount = 0
    const alpaCount = 0
    const evaluatedTotal = hadirCount + sakitCount + izinCount + alpaCount // 4 sesi dievaluasi

    const attendanceRate = calculateAttendancePercentage(hadirCount, evaluatedTotal)
    expect(attendanceRate).toBe(75) // 3 dari 4 = 75%
  })
})
