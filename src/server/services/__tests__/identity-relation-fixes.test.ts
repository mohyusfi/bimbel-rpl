import { describe, it, expect } from 'vitest'
import { masterDataService } from '../master-data.service'
import { scheduleService } from '../schedule.service'
import { registrationService } from '../registration.service'

describe('Verifikasi Perbaikan Identitas & Relasi Supabase', () => {
  it('1. masterDataService.getClasses() mengembalikan daftar rombel kelas dari Supabase', async () => {
    const classes = await masterDataService.getClasses()
    expect(classes.length).toBeGreaterThan(0)
    const utbkClass = classes.find((c) => c.name === 'UTBK Intensif A')
    expect(utbkClass).toBeDefined()
    expect(utbkClass?.id).toBe('c1000000-0000-0000-0000-000000000001')
  })

  it('2. registrationService.getStudents() mengembalikan Fahri dengan email resmi & wali Ahmad Dahlan', async () => {
    const students = await registrationService.getStudents()
    const fahri = students.find((s) => s.nis === 'TC-2026-001')
    expect(fahri).toBeDefined()
    expect(fahri?.email).toBe('fahri.ramadhan@siswa.tadulakocendekia.sch.id')
    expect(fahri?.className).toBe('UTBK Intensif A')
    expect(fahri?.parentName).toContain('Ahmad Dahlan')
  })

  it('3. scheduleService.getSessions() mengembalikan sesi selesai untuk pengajar', async () => {
    const dianTutorId = '9383fc09-99fc-423c-ac09-e3f94c26f5e9'
    const sessions = await scheduleService.getSessions(dianTutorId)
    const completedSessions = sessions.filter((s) => s.isCompleted)
    expect(completedSessions.length).toBeGreaterThanOrEqual(2)
  })
})
