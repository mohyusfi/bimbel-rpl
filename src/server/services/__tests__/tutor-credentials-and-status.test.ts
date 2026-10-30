import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { masterDataService } from '../master-data.service'
import { supabase } from '~/lib/supabase/client'

const TEST_TUTOR_EMAIL = `test.tutor.${Date.now()}@tadulako.sch.id`

describe('Tutor Management — Auto Credentials & Status Toggling', () => {
  let createdTutorId: string | null = null

  const cleanupAllTestTutors = async () => {
    try {
      await masterDataService.getTutors()
      const { data: profs } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', 'test.tutor.%@tadulako.sch.id')

      if (profs && profs.length > 0) {
        for (const p of profs) {
          await supabase.from('tutors').delete().eq('profile_id', p.id)
          await supabase.from('profiles').delete().eq('id', p.id)
        }
      }
    } catch {}
  }

  beforeAll(async () => {
    await cleanupAllTestTutors()
  })

  afterAll(async () => {
    // Wajib: Bersihkan seluruh data testing sesuai aturan AGENTS.md (Zero Stale Test Data)
    if (createdTutorId) {
      await masterDataService.deleteTutor(createdTutorId)
    }
    await cleanupAllTestTutors()
  })

  it('1. masterDataService.createTutor menerbitkan kredensial otomatis (tutor2026)', async () => {
    const res = await masterDataService.createTutor({
      name: 'Kak Test Tutor Vitest, S.Pd',
      email: TEST_TUTOR_EMAIL,
      phone: '081299887766',
      education: 'S1 Pendidikan Fisika — Untad',
      subjects: ['Fisika Dasar', 'Mekanika'],
    })

    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.tutor).toBeDefined()
      expect(res.data.tutor.email).toBe(TEST_TUTOR_EMAIL)
      expect(res.data.tutor.status).toBe('aktif')
      expect(res.data.credentials.password).toBe('tutor2026')
      expect(res.data.credentials.email).toBe(TEST_TUTOR_EMAIL)
      expect(res.data.credentials.name).toBe('Kak Test Tutor Vitest, S.Pd')
      createdTutorId = res.data.tutor.id
    }
  })

  it('2. menolak pembuatan tutor dengan email duplikat', async () => {
    const duplicateRes = await masterDataService.createTutor({
      name: 'Kak Duplikat, M.Pd',
      email: TEST_TUTOR_EMAIL,
      phone: '081299881111',
      education: 'S2 Fisika',
      subjects: ['Fisika Dasar'],
    })

    expect(duplicateRes.success).toBe(false)
    if (!duplicateRes.success) {
      expect(duplicateRes.error).toContain('sudah terdaftar')
    }
  })

  it('3. masterDataService.toggleTutorStatus menonaktifkan tutor secara persisten', async () => {
    expect(createdTutorId).toBeTruthy()
    if (!createdTutorId) return

    const toggleRes = await masterDataService.toggleTutorStatus(createdTutorId, 'nonaktif')
    expect(toggleRes.success).toBe(true)
    if (toggleRes.success) {
      expect(toggleRes.data.status).toBe('nonaktif')
    }

    const tutors = await masterDataService.getTutors()
    const target = tutors.find((t) => t.id === createdTutorId)
    if (target) {
      expect(target.status).toBe('nonaktif')
    }
  })

  it('4. masterDataService.toggleTutorStatus mengaktifkan kembali tutor secara persisten', async () => {
    expect(createdTutorId).toBeTruthy()
    if (!createdTutorId) return

    const toggleRes = await masterDataService.toggleTutorStatus(createdTutorId, 'aktif')
    expect(toggleRes.success).toBe(true)
    if (toggleRes.success) {
      expect(toggleRes.data.status).toBe('aktif')
    }

    const tutors = await masterDataService.getTutors()
    const target = tutors.find((t) => t.id === createdTutorId)
    if (target) {
      expect(target.status).toBe('aktif')
    }
  })
})
