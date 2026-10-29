import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { turnstileService } from '../turnstile.service'

describe('TurnstileService — TDD Unit Tests', () => {
  const originalFetch = globalThis.fetch
  const originalEnv = process.env.TURNSTILE_SECRET_KEY

  beforeEach(() => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret-key'
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    process.env.TURNSTILE_SECRET_KEY = originalEnv
    vi.restoreAllMocks()
  })

  it('menolak jika token Turnstile kosong atau hanya spasi', async () => {
    const result = await turnstileService.verifyToken('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Token verifikasi')
    }

    const resultWhitespace = await turnstileService.verifyToken('   ')
    expect(resultWhitespace.success).toBe(false)
  })

  it('berhasil memvalidasi token ketika Cloudflare siteverify mengembalikan success: true', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        challenge_ts: '2026-10-30T00:00:00.000Z',
        hostname: 'dev.anemone.fiyus.me',
      }),
    } as any)

    const result = await turnstileService.verifyToken('valid-token-from-cf', '127.0.0.1')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.verified).toBe(true)
      expect(result.data.hostname).toBe('dev.anemone.fiyus.me')
    }

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  it('menolak token jika Cloudflare siteverify mengembalikan success: false dengan error-codes', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        'error-codes': ['invalid-input-response'],
      }),
    } as any)

    const result = await turnstileService.verifyToken('invalid-token')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Verifikasi bot gagal')
    }
  })

  it('menangani kegagalan jaringan atau timeout secara aman tanpa crash', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error / connection reset'))

    const result = await turnstileService.verifyToken('some-token')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Gagal menghubungi server verifikasi')
    }
  })

  it('menggunakan Cloudflare dummy secret key jika process.env.TURNSTILE_SECRET_KEY belum diisi di development', async () => {
    delete process.env.TURNSTILE_SECRET_KEY

    let sentFormData: any = null
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, options: any) => {
      sentFormData = options.body
      return {
        ok: true,
        json: async () => ({
          success: true,
          hostname: 'localhost',
        }),
      }
    })

    const result = await turnstileService.verifyToken('dummy-token')
    expect(result.success).toBe(true)
    expect(sentFormData).not.toBeNull()
    expect(sentFormData?.get('secret')).toBe('1x0000000000000000000000000000000AA')
  })

  it('memvalidasi expectedAction dan menolak jika action dari Cloudflare tidak cocok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        action: 'signup',
      }),
    } as any)

    const result = await turnstileService.verifyToken('valid-token', {
      expectedAction: 'login',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('TURNSTILE_ACTION_MISMATCH')
    }
  })

  it('berhasil jika expectedAction sesuai dengan response Cloudflare', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        action: 'login',
      }),
    } as any)

    const result = await turnstileService.verifyToken('valid-token', {
      expectedAction: 'login',
    })

    expect(result.success).toBe(true)
  })
})
