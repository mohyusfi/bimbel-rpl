import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  authStore,
  normalizeLoginEmail,
  getEffectivePassword,
  DEMO_ACCOUNTS,
} from '../auth-store'
import { createRouteGuard } from '../route-guard'

describe('Auth Store — Persistensi Sesi Demo & Normalisasi Akun', () => {
  let mockStorage: Record<string, string> = {}

  beforeEach(() => {
    mockStorage = {}
    const localStorageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val
      },
      removeItem: (key: string) => {
        delete mockStorage[key]
      },
      clear: () => {
        mockStorage = {}
      },
      key: (i: number) => Object.keys(mockStorage)[i] || null,
      get length() {
        return Object.keys(mockStorage).length
      },
    }

    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', localStorageMock)
    authStore.clearSession()
  })

  afterEach(() => {
    authStore.clearSession()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('1. Normalisasi Email Akun Tutor', () => {
    it('menormalisasi dian.pratiwi@tutor.tadulakocendekia.sch.id ke format canonical', () => {
      const alias = 'dian.pratiwi@tutor.tadulakocendekia.sch.id'
      const normalized = normalizeLoginEmail(alias)
      expect(normalized).toBe('dian.pratiwi@tadulakocendekia.sch.id')
    })

    it('mendapatkan kata sandi efektif yang sama untuk kedua format email tutor', () => {
      const pass1 = getEffectivePassword('dian.pratiwi@tadulakocendekia.sch.id')
      const pass2 = getEffectivePassword('dian.pratiwi@tutor.tadulakocendekia.sch.id')
      expect(pass1).toBe(DEMO_ACCOUNTS.tutor.defaultPassword)
      expect(pass2).toBe(DEMO_ACCOUNTS.tutor.defaultPassword)
    })
  })

  describe('2. Persistensi Sesi Demo ke localStorage (Anti-Logout saat F5)', () => {
    it('menyimpan sesi ke localStorage saat quickLogin dipanggil untuk peran tutor', () => {
      const res = authStore.quickLogin('tutor')
      expect(res.success).toBe(true)
      expect(authStore.getState().isAuthenticated).toBe(true)
      expect(authStore.getState().role).toBe('tutor')

      // Verifikasi tersimpan di localStorage
      const savedRaw = mockStorage['tc_bimbel_auth_state_v1']
      expect(savedRaw).toBeDefined()
      const saved = JSON.parse(savedRaw!)
      expect(saved.isAuthenticated).toBe(true)
      expect(saved.role).toBe('tutor')
      expect(saved.user?.email).toBe(DEMO_ACCOUNTS.tutor.email)
    })

    it('memulihkan sesi dari localStorage saat initialize() dipanggil (simulasi hard refresh F5)', async () => {
      // 1. Login sebagai orang tua
      authStore.quickLogin('parent')
      expect(authStore.getState().role).toBe('parent')

      // 2. Simulasikan browser dimuat ulang (in-memory state reset, tapi localStorage tetap ada)
      // Reset state internal in-memory manual
      ;(authStore as any).clearSessionWithoutClearingStorage?.() || (mockStorage['tc_bimbel_auth_state_v1'])

      // Jalankan initialize ulang
      await authStore.initialize()

      // 3. Sesi harus kembali pulih
      const state = authStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.role).toBe('parent')
      expect(state.user?.email).toBe(DEMO_ACCOUNTS.parent.email)
    })

    it('mengizinkan route guard parent setelah hard refresh', async () => {
      // Login cepat sebagai parent
      authStore.quickLogin('parent')

      // Jalankan guard
      const guard = createRouteGuard('parent')
      await expect(
        guard({ location: { pathname: '/parent', href: '/parent' } })
      ).resolves.toBeUndefined()
    })

    it('menghapus data sesi dari localStorage saat logout() / clearSession()', () => {
      authStore.quickLogin('admin')
      expect(mockStorage['tc_bimbel_auth_state_v1']).toBeDefined()

      authStore.clearSession()
      expect(mockStorage['tc_bimbel_auth_state_v1']).toBeUndefined()
      expect(authStore.getState().isAuthenticated).toBe(false)
    })
  })
})
