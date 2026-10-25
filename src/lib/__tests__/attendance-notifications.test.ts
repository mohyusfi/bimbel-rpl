import { describe, it, expect } from 'vitest'
import {
  buildAttendanceNotifications,
  attendanceStatusLabel,
} from '../attendance-notifications'

describe('buildAttendanceNotifications — notifikasi presensi ke orang tua', () => {
  const session = {
    id: 'sess-1',
    subjectName: 'Fisika UTBK',
    dayOfWeek: 'Jumat',
    startTime: '17:30',
  }

  it('membuat satu notifikasi per siswa ke orang tua untuk semua status', () => {
    const drafts = buildAttendanceNotifications({
      session,
      entries: [
        { studentId: 's1', studentName: 'Fahri', status: 'hadir' },
        { studentId: 's2', studentName: 'Alya', status: 'sakit' },
        { studentId: 's3', studentName: 'Rizki', status: 'izin' },
        { studentId: 's4', studentName: 'Dewi', status: 'alpa' },
      ],
      recipients: [
        { studentId: 's1', parentProfileId: 'par-1' },
        { studentId: 's2', parentProfileId: 'par-2' },
        { studentId: 's3', parentProfileId: 'par-3' },
        { studentId: 's4', parentProfileId: 'par-4' },
      ],
    })

    expect(drafts).toHaveLength(4)
    expect(drafts.every((d) => d.type === 'attendance')).toBe(true)
    expect(drafts.every((d) => d.linkUrl === '/parent/kehadiran')).toBe(true)
    expect(drafts.map((d) => d.userId)).toEqual(['par-1', 'par-2', 'par-3', 'par-4'])
    expect(drafts[0].title).toContain('Hadir')
    expect(drafts[1].title).toContain('Sakit')
    expect(drafts[2].title).toContain('Izin')
    expect(drafts[3].title).toContain('Alpa')
    expect(drafts[0].metadata.sessionId).toBe('sess-1')
    expect(drafts[0].metadata.studentId).toBe('s1')
    expect(drafts[0].metadata.targetRoles).toEqual(['parent'])
  })

  it('menyisipkan nama siswa, mata pelajaran, hari, dan jam ke dalam pesan', () => {
    const drafts = buildAttendanceNotifications({
      session,
      entries: [{ studentId: 's1', studentName: 'Fahri', status: 'alpa' }],
      recipients: [{ studentId: 's1', parentProfileId: 'par-1' }],
    })

    expect(drafts[0].message).toContain('Fahri')
    expect(drafts[0].message).toContain('Fisika UTBK')
    expect(drafts[0].message).toContain('Jumat')
    expect(drafts[0].message).toContain('17:30')
  })

  it('melewati siswa yang tidak memiliki orang tua terhubung', () => {
    const drafts = buildAttendanceNotifications({
      session,
      entries: [
        { studentId: 's1', studentName: 'Fahri', status: 'hadir' },
        { studentId: 's2', studentName: 'Tanpa Wali', status: 'hadir' },
      ],
      recipients: [{ studentId: 's1', parentProfileId: 'par-1' }],
    })

    expect(drafts).toHaveLength(1)
    expect(drafts[0].metadata.studentId).toBe('s1')
  })

  it('tidak menduplikasi notifikasi untuk penerima yang sama pada satu siswa', () => {
    const drafts = buildAttendanceNotifications({
      session,
      entries: [{ studentId: 's1', studentName: 'Fahri', status: 'hadir' }],
      recipients: [
        { studentId: 's1', parentProfileId: 'par-1' },
        { studentId: 's1', parentProfileId: 'par-1' },
      ],
    })

    expect(drafts).toHaveLength(1)
  })

  it('mengembalikan array kosong tanpa sesi, entri, atau penerima', () => {
    expect(
      buildAttendanceNotifications({ session, entries: [], recipients: [{ studentId: 's1', parentProfileId: 'par-1' }] })
    ).toEqual([])
    expect(
      buildAttendanceNotifications({ session, entries: [{ studentId: 's1', studentName: 'F', status: 'hadir' }], recipients: [] })
    ).toEqual([])
  })

  it('memberi label status yang ramah untuk nilai tak dikenal', () => {
    expect(attendanceStatusLabel('hadir')).toBe('Hadir')
    expect(attendanceStatusLabel('SAKIT')).toBe('Sakit')
    expect(attendanceStatusLabel('unknown')).toBe('Hadir')
  })
})
