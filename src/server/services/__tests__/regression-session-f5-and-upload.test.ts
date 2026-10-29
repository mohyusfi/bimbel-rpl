import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { authStore } from '~/lib/auth-store'
import { masterDataService } from '../master-data.service'
import { learningService } from '../learning.service'

describe('REGRESSION: Session Persistence on Refresh and Tutor Material Upload', () => {
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

    vi.stubGlobal('window', { location: { pathname: '/tutor' } })
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('1. Sesi login tutor di authStore dan localStorage tidak ter-hijack saat background queries memuat data', async () => {
    // 1. Tutor quick login
    authStore.quickLogin('tutor')
    expect(authStore.getState().role).toBe('tutor')
    const savedBefore = JSON.parse(mockStorage['tc_bimbel_auth_state_v1'] || '{}')
    expect(savedBefore.role).toBe('tutor')

    // 2. Query master data (memanggil ensureAuthenticatedSession di background)
    await masterDataService.getClasses()

    // 3. Verifikasi peran tutor tetap terjaga
    const currentRole = authStore.getState().role
    const savedAfter = JSON.parse(mockStorage['tc_bimbel_auth_state_v1'] || '{}')

    expect(currentRole).toBe('tutor')
    expect(savedAfter.role).toBe('tutor')
    expect(authStore.getState().user?.email).toBe('dian.pratiwi@tadulakocendekia.sch.id')
  }, 15000)

  it('2. Hard refresh (F5) memulihkan sesi pengguna tanpa beralih ke admin', async () => {
    mockStorage['tc_bimbel_auth_state_v1'] = JSON.stringify({
      user: {
        id: 'usr-tutor-test',
        email: 'dian.pratiwi@tadulakocendekia.sch.id',
        fullName: 'Kak Dian Pratiwi, S.Si',
        role: 'tutor',
      },
      role: 'tutor',
      isAuthenticated: true,r
    })

    await authStore.initialize()

    expect(authStore.getState().role).toBe('tutor')
    expect(authStore.getState().user?.email).toBe('dian.pratiwi@tadulakocendekia.sch.id')
    const stored = JSON.parse(mockStorage['tc_bimbel_auth_state_v1'] || '{}')
    expect(stored.role).toBe('tutor')
  })

  it('3. Tutor berhasil mengunggah modul belajar dengan sesi terotentikasi otomatis', async () => {
    authStore.quickLogin('tutor')
    const buffer = Buffer.from('test unit modul bimbingan fisika')
    const file = new File([buffer], 'modul-fisika-regression.pdf', { type: 'application/pdf' })

    const res = await learningService.uploadMaterial({
      classId: 'c1000000-0000-0000-0000-000000000001',
      title: 'Modul Fisika Regresi Test',
      file,
      category: 'Modul Teori',
    })

    expect(res.success).toBe(true)
    if (res.success && res.data?.id) {
      await learningService.deleteMaterial(res.data.id)
    }
  }, 15000)
})
