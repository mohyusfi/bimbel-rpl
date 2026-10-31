import { describe, it, expect } from 'vitest'
import { verifyLoginTurnstileSchema } from '../auth'

describe('Auth Server Function — Turnstile Validation Schema', () => {
  it('berhasil memvalidasi token Turnstile yang valid', () => {
    const validPayload = {
      turnstileToken: 'valid-token-login-123',
    }

    const parsed = verifyLoginTurnstileSchema.parse(validPayload)
    expect(parsed.turnstileToken).toBe('valid-token-login-123')
  })

  it('gagal memvalidasi jika turnstileToken kosong', () => {
    const invalidPayload = {
      turnstileToken: '',
    }

    expect(() => verifyLoginTurnstileSchema.parse(invalidPayload)).toThrow(
      'Verifikasi bot wajib diselesaikan'
    )
  })
})
