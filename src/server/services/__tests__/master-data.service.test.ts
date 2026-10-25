import { describe, it, expect, vi } from 'vitest'
import { clampCapacity, ensureAdminSession, masterDataService } from '../master-data.service'
import { authStore } from '~/lib/auth-store'

describe('MasterDataService — Clamping & Mapping Guardrails', () => {
  it('clamping kapasitas menjepit input > 12 menjadi 12', () => {
    expect(clampCapacity(15)).toBe(12)
    expect(clampCapacity(100)).toBe(12)
    expect(clampCapacity('25')).toBe(12)
  })

  it('clamping kapasitas menjepit input <= 0 menjadi 1', () => {
    expect(clampCapacity(0)).toBe(1)
    expect(clampCapacity(-5)).toBe(1)
    expect(clampCapacity('-10')).toBe(1)
  })

  it('clamping kapasitas mempertahankan nilai valid (1–12)', () => {
    expect(clampCapacity(10)).toBe(10)
    expect(clampCapacity(12)).toBe(12)
    expect(clampCapacity(1)).toBe(1)
    expect(clampCapacity('8')).toBe(8)
  })

  it('clamping kapasitas mengembalikan default 12 untuk NaN atau undefined', () => {
    expect(clampCapacity(undefined)).toBe(12)
    expect(clampCapacity(null)).toBe(1) // Number(null) is 0 -> clamped to 1
    expect(clampCapacity('invalid')).toBe(12)
  })

  it('ensureAdminSession berhasil mengeksekusi autentikasi admin di Supabase', async () => {
    const isAuthed = await ensureAdminSession()
    expect(isAuthed).toBe(true)
  })

  it('ensureAdminSession TIDAK menimpa peran non-admin (siswa/tutor/wali) dan mencegah role hijacking', async () => {
    // Simulasikan pengguna sedang login sebagai siswa
    authStore.quickLogin('student')
    expect(authStore.getState().role).toBe('student')

    // Panggil ensureAdminSession (misalnya terpanggil oleh service query)
    const isAuthed = await ensureAdminSession()

    // Peran siswa di authStore harus TETAP 'student', TIDAK boleh berganti menjadi 'admin'
    expect(authStore.getState().role).toBe('student')
  })

  it('berhasil melakukan operasi CRUD ruangan fisik secara persisten dengan auto-session', async () => {
    // 1. Create Room
    const createRes = await masterDataService.createRoom({
      name: 'Ruang Uji Otomatis QA-Nuraini',
      capacity: 10,
      facilities: 'AC, Smart Board Magnetik',
    })

    expect(createRes.success).toBe(true)
    if (!createRes.success) return
    expect(createRes.data.name).toBe('Ruang Uji Otomatis QA-Nuraini')
    expect(createRes.data.capacity).toBe(10)

    const createdId = createRes.data.id

    // 2. Read Rooms
    const allRooms = await masterDataService.getRooms()
    const found = allRooms.find((r) => r.id === createdId)
    expect(found).toBeDefined()
    expect(found?.name).toBe('Ruang Uji Otomatis QA-Nuraini')

    // 3. Update Room
    const updateRes = await masterDataService.updateRoom(createdId, {
      name: 'Ruang Uji Otomatis QA-Nuraini (Updated)',
      capacity: 12,
    })
    expect(updateRes.success).toBe(true)
    if (updateRes.success) {
      expect(updateRes.data.name).toBe('Ruang Uji Otomatis QA-Nuraini (Updated)')
      expect(updateRes.data.capacity).toBe(12)
    }

    // 4. Toggle Active
    const toggleRes = await masterDataService.toggleRoomActive(createdId)
    expect(toggleRes.success).toBe(true)
    if (toggleRes.success) {
      expect(toggleRes.data.isActive).toBe(false)
    }

    // 5. Cleanup Test Room directly via Supabase
    const { supabase } = await import('~/lib/supabase/client')
    await supabase.from('rooms').delete().eq('id', createdId)
  })
})
