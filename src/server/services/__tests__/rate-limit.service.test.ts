import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { rateLimitService, RATE_LIMIT_TIERS } from '../rate-limit.service'

describe('Rate Limit Service — Multi-Tier & Shared-IP Safe Sliding Window', () => {
  beforeEach(() => {
    rateLimitService.resetStore()
  })

  afterEach(() => {
    rateLimitService.resetStore()
  })

  it('mengizinkan permintaan di bawah batas kuota dan mengurangi remaining secara akurat', async () => {
    const status1 = await rateLimitService.check({
      tier: 'PUBLIC_REGISTRATION',
      action: 'reg:submit',
      targetId: 'siswa1@example.com',
      contextOverride: {
        sessionId: 'session-device-aaa-1111',
        clientIp: '103.10.20.30',
        nowMs: 1_000_000,
      },
    })

    expect(status1.allowed).toBe(true)
    expect(status1.limit).toBe(RATE_LIMIT_TIERS.PUBLIC_REGISTRATION.maxRequests)
    expect(status1.remaining).toBe(RATE_LIMIT_TIERS.PUBLIC_REGISTRATION.maxRequests - 1)
  })

  it('memblokir permintaan dari sesi dan target yang sama ketika melampaui kuota PUBLIC_REGISTRATION (5 req/menit)', async () => {
    const baseInput = {
      tier: 'PUBLIC_REGISTRATION' as const,
      action: 'reg:submit',
      targetId: 'spammer@example.com',
      contextOverride: {
        sessionId: 'session-spammer-0001',
        clientIp: '103.10.20.30',
        nowMs: 1_000_000,
      },
    }

    for (let i = 0; i < RATE_LIMIT_TIERS.PUBLIC_REGISTRATION.maxRequests; i++) {
      const res = await rateLimitService.enforce(baseInput)
      expect(res).toBeNull()
    }

    // Request ke-6 dalam menit yang sama wajib ditolak
    const blockedRes = await rateLimitService.enforce(baseInput)
    expect(blockedRes).not.toBeNull()
    expect(blockedRes?.success).toBe(false)
    if (blockedRes && !blockedRes.success) {
      expect(blockedRes.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0)
      expect(blockedRes.error).toContain('Terlalu banyak permintaan')
    }
  })

  it('TIDAK memblokir puluhan siswa berbeda yang berbagi 1 IP publik Wi-Fi Bimbel yang sama (Shared-IP Safe)', async () => {
    const sharedBimbelWifiIp = '114.122.88.99'
    const baseTime = 2_000_000

    // Simulasikan 20 siswa berbeda di gedung bimbel yang sama melakukan pendaftaran & login bersamaan
    for (let studentIdx = 1; studentIdx <= 20; studentIdx++) {
      const regBlocked = await rateLimitService.enforce({
        tier: 'PUBLIC_REGISTRATION',
        action: 'reg:submit',
        targetId: `siswa${studentIdx}@sman1palu.sch.id`,
        contextOverride: {
          sessionId: `browser-session-siswa-${studentIdx}-xxxx`,
          clientIp: sharedBimbelWifiIp,
          userAgent: `Mozilla/5.0 SiswaDevice/${studentIdx}`,
          nowMs: baseTime + studentIdx * 10,
        },
      })

      expect(regBlocked).toBeNull()

      const loginBlocked = await rateLimitService.enforce({
        tier: 'PUBLIC_AUTH',
        action: 'auth:login-turnstile',
        targetId: `siswa${studentIdx}@sman1palu.sch.id`,
        contextOverride: {
          sessionId: `browser-session-siswa-${studentIdx}-xxxx`,
          clientIp: sharedBimbelWifiIp,
          userAgent: `Mozilla/5.0 SiswaDevice/${studentIdx}`,
          nowMs: baseTime + studentIdx * 10,
        },
      })

      expect(loginBlocked).toBeNull()
    }
  })

  it('memulihkan kuota secara otomatis setelah jendela waktu 60 detik berlalu', async () => {
    const startTime = 5_000_000
    const makeInput = (nowMs: number) => ({
      tier: 'PUBLIC_REGISTRATION' as const,
      action: 'reg:submit',
      targetId: 'calonsiswa@example.com',
      contextOverride: {
        sessionId: 'session-calonsiswa-9999',
        clientIp: '103.55.66.77',
        nowMs,
      },
    })

    // Habiskan kuota 5x pada t = 0s
    for (let i = 0; i < 5; i++) {
      const res = await rateLimitService.enforce(makeInput(startTime + i * 100))
      expect(res).toBeNull()
    }

    // Pada t = 30s masih terblokir
    const blockedAt30s = await rateLimitService.enforce(makeInput(startTime + 30_000))
    expect(blockedAt30s).not.toBeNull()

    // Pada t = 61s jendela waktu sudah lewat dan kembali diizinkan
    const allowedAt61s = await rateLimitService.enforce(makeInput(startTime + 61_000))
    expect(allowedAt61s).toBeNull()
  })

  it('tetap menghentikan banjir serangan DDoS masif dari 1 IP ketika melampaui ipSafetyCeiling', async () => {
    const attackerIp = '45.66.77.88'
    const ceiling = RATE_LIMIT_TIERS.PUBLIC_REGISTRATION.ipSafetyCeiling
    const nowMs = 8_000_000

    // Botnet memalsukan sessionId & email berbeda-beda dari 1 IP yang sama hingga melewati plafon darurat (120 req/m)
    for (let i = 0; i < ceiling; i++) {
      const res = await rateLimitService.enforce({
        tier: 'PUBLIC_REGISTRATION',
        action: 'reg:submit',
        targetId: `bot${i}@botnet.invalid`,
        contextOverride: {
          sessionId: `fake-session-${i}-0000000000`,
          clientIp: attackerIp,
          nowMs,
        },
      })
      expect(res).toBeNull()
    }

    // Permintaan ke-(ceiling + 1) dari IP penyerang tersebut ditahan oleh IP Safety Ceiling
    const ceilingBlocked = await rateLimitService.enforce({
      tier: 'PUBLIC_REGISTRATION',
      action: 'reg:submit',
      targetId: 'bot-overflow@botnet.invalid',
      contextOverride: {
        sessionId: 'fake-session-overflow-0000000000',
        clientIp: attackerIp,
        nowMs,
      },
    })

    expect(ceilingBlocked).not.toBeNull()
    expect(ceilingBlocked?.success).toBe(false)
    if (ceilingBlocked && !ceilingBlocked.success) {
      expect(ceilingBlocked.code).toBe('RATE_LIMIT_EXCEEDED')
    }
  })
})
