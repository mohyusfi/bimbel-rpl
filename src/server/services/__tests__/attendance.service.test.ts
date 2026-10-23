import { describe, it, expect } from 'vitest'
import { attendanceService } from '../attendance.service'

describe('AttendanceService — TDD Unit Tests', () => {
  it('menolak penyimpanan presensi jika sessionId kosong', async () => {
    const res = await attendanceService.saveSessionAttendance({
      sessionId: '',
      topic: 'Topik Uji',
      entries: [],
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toContain('ID sesi tidak valid')
    }
  })

  it('menolak penyimpanan presensi jika terdapat duplikasi entri siswa', async () => {
    const res = await attendanceService.saveSessionAttendance({
      sessionId: 'ses-1',
      topic: 'Topik Uji',
      entries: [
        { studentId: 'stu-1', studentName: 'Fahri', nis: 'TC-001', status: 'hadir' },
        { studentId: 'stu-1', studentName: 'Fahri Duplicate', nis: 'TC-001', status: 'hadir' },
      ],
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.code === 'DUPLICATE_STUDENT_ENTRY' || res.code === undefined).toBe(true)
    }
  })

  it('menolak getStudentAttendanceSummary jika studentId kosong', async () => {
    const res = await attendanceService.getStudentAttendanceSummary('')
    expect(res.success).toBe(false)
  })
})
