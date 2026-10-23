import { describe, it, expect } from 'vitest'
import { registrationService } from '../registration.service'

describe('REPRO: Data siswa tidak ditemukan di database ketika lihat detail dan edit', () => {
  it('1. getStudents() must authenticate and return real students from Supabase', async () => {
    const students = await registrationService.getStudents()
    expect(students.length).toBeGreaterThan(0)
    // Supabase has 9 students seeded
    expect(students.length).toBeGreaterThanOrEqual(9)
  })

  it('2. getStudentById must find student by ID or legacy/local ID mapping like stu-1', async () => {
    // Look up by legacy ID stu-1
    const res = await registrationService.getStudentById('stu-1')
    expect(res.success, `Expected getStudentById('stu-1') to succeed, got: ${res.success ? '' : res.error}`).toBe(true)
    if (res.success) {
      expect(res.data.nis).toBe('TC-2026-001')
      expect(res.data.name).toBe('Fahri Ramadhan')
    }
  })

  it('3. updateStudent must successfully update student with legacy/local ID like stu-1', async () => {
    const res = await registrationService.updateStudent({
      id: 'stu-1',
      name: 'Fahri Ramadhan',
      email: 'rafly.palu@gmail.com',
      phone: '0821-9988-7711',
      school: 'SMA Negeri 1 Palu',
      classId: 'c1000000-0000-0000-0000-000000000001',
      parentName: 'Ahmad Dahlan',
      parentPhone: '0821-4455-6677',
      status: 'aktif',
    })
    expect(res.success, `Expected updateStudent('stu-1') to succeed, got: ${res.success ? '' : res.error}`).toBe(true)
  }, 15000)

  it('4. getStudentById must find student by real UUID', async () => {
    const res = await registrationService.getStudentById('d992d9fc-6f5b-434f-998b-358e54a754b7')
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.nis).toBe('TC-2026-001')
      expect(res.data.name).toBe('Fahri Ramadhan')
    }
  })
})
