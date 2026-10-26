import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getLoginMode, isDemoLogin } from '../login-mode'

describe('login-mode utility', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.unstubAllGlobals()
  })

  it('mengembalikan demo jika VITE_LOGIN_MODE=demo', () => {
    vi.stubEnv('VITE_LOGIN_MODE', 'demo')
    expect(getLoginMode()).toBe('demo')
    expect(isDemoLogin()).toBe(true)
  })

  it('mengembalikan production jika VITE_LOGIN_MODE=production', () => {
    vi.stubEnv('VITE_LOGIN_MODE', 'production')
    expect(getLoginMode()).toBe('production')
    expect(isDemoLogin()).toBe(false)
  })

  it('mengabaikan case-sensitivity dan spasi putih', () => {
    vi.stubEnv('VITE_LOGIN_MODE', '  PRODUCTION  ')
    expect(getLoginMode()).toBe('production')
    expect(isDemoLogin()).toBe(false)

    vi.stubEnv('VITE_LOGIN_MODE', '  DEMO ')
    expect(getLoginMode()).toBe('demo')
    expect(isDemoLogin()).toBe(true)
  })

  it('menggunakan fallback default saat VITE_LOGIN_MODE kosong', () => {
    vi.stubEnv('VITE_LOGIN_MODE', '')
    const mode = getLoginMode()
    expect(['demo', 'production']).toContain(mode)
  })
})
