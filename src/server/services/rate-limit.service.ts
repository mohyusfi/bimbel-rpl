import { createHash, randomUUID } from 'node:crypto'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export type RateLimitBlockedResult = {
  success: false
  error: string
  code: 'RATE_LIMIT_EXCEEDED'
  retryAfterSeconds: number
}

export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; retryAfterSeconds?: number }

export type RateLimitTier =
  | 'PUBLIC_AUTH'
  | 'PUBLIC_REGISTRATION'
  | 'PUBLIC_LOOKUP'
  | 'MUTATION'
  | 'READ'

export interface TierConfig {
  /** Maksimal request per subject (browser session / target akun / user) dalam jendela waktu */
  maxRequests: number
  /** Jendela waktu dalam milidetik */
  windowMs: number
  /**
   * Plafon darurat per IP (sangat longgar agar puluhan siswa di Wi-Fi bimbel / CGNAT
   * tidak saling memblokir, namun tetap menahan banjir ribuan request botnet dari 1 IP).
   */
  ipSafetyCeiling: number
}

export const RATE_LIMIT_TIERS: Record<RateLimitTier, TierConfig> = {
  PUBLIC_AUTH: {
    maxRequests: 10,
    windowMs: 60_000, // 10 percobaan login/aktivasi per menit per sesi/akun
    ipSafetyCeiling: 180, // hingga ~18-30 pengguna bersamaan di 1 Wi-Fi bimbel
  },
  PUBLIC_REGISTRATION: {
    maxRequests: 5,
    windowMs: 60_000, // 5 submit pendaftaran per menit per sesi/email calon siswa
    ipSafetyCeiling: 120, // hingga ~24 siswa submit bersamaan di 1 Wi-Fi bimbel
  },
  PUBLIC_LOOKUP: {
    maxRequests: 15,
    windowMs: 60_000, // 15 pengecekan nomor/email wali per menit per sesi browser
    ipSafetyCeiling: 300,
  },
  MUTATION: {
    maxRequests: 30,
    windowMs: 60_000, // 30 aksi mutasi dashboard per menit per pengguna
    ipSafetyCeiling: 600,
  },
  READ: {
    maxRequests: 120,
    windowMs: 60_000, // 120 pembacaan data per menit per pengguna
    ipSafetyCeiling: 1500,
  },
}

const SESSION_COOKIE_NAME = '__py_rl_sid'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 hari

export interface RateLimitContextInput {
  tier: RateLimitTier
  action: string
  /**
   * Identitas spesifik target operasi (misal: email, nomor WA, atau userId).
   * Memastikan pengguna A dan pengguna B di jaringan Wi-Fi yang sama memiliki
   * kuota terpisah meskipun browser mereka memblokir cookie.
   */
  targetId?: string
  /**
   * Override eksplisit untuk pengujian unit (opsional).
   */
  contextOverride?: {
    sessionId?: string
    clientIp?: string
    userAgent?: string
    nowMs?: number
    forceMemory?: boolean
  }
}

export interface RateLimitCheckStatus {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
  resetAtMs: number
  subjectKey: string
  backend: 'upstash' | 'memory'
}

interface SlidingWindowEntry {
  timestamps: number[]
  expiresAt: number
}

// In-Memory Storage & Fallback
const memoryStore = new Map<string, SlidingWindowEntry>()
const ephemeralCache = new Map<string, number>()
let lastCleanupMs = 0
const CLEANUP_INTERVAL_MS = 60_000

function cleanupExpiredEntries(nowMs: number): void {
  if (nowMs - lastCleanupMs < CLEANUP_INTERVAL_MS) return
  lastCleanupMs = nowMs
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= nowMs) {
      memoryStore.delete(key)
    }
  }
}

function hashShort(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16)
}

interface RequestMetadata {
  sessionId: string
  clientIp: string
  userAgent: string
}

// Upstash Clients & Limiters Cache
let redisClient: Redis | null = null
const upstashSubjectLimiters = new Map<RateLimitTier, Ratelimit>()
const upstashCeilingLimiters = new Map<RateLimitTier, Ratelimit>()

function getNamespacePrefix(): string {
  return process.env.NODE_ENV === 'production' ? 'py:prod:rl:' : 'py:dev:rl:'
}

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  if (!redisClient) {
    redisClient = new Redis({
      url,
      token,
      // Retry otomatis 1x jika ada spike latensi jaringan
      retry: {
        retries: 1,
        backoff: (retryCount) => Math.exp(retryCount) * 50,
      },
    })
  }
  return redisClient
}

function getSubjectLimiter(tier: RateLimitTier): Ratelimit | null {
  const redis = getRedisClient()
  if (!redis) return null

  const cached = upstashSubjectLimiters.get(tier)
  if (cached) return cached

  const config = RATE_LIMIT_TIERS[tier]
  const prefix = `${getNamespacePrefix()}subj:${tier}:`
  const windowSeconds = Math.max(1, Math.round(config.windowMs / 1000))

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${windowSeconds} s`),
    ephemeralCache,
    prefix,
    analytics: true,
  })

  upstashSubjectLimiters.set(tier, limiter)
  return limiter
}

function getCeilingLimiter(tier: RateLimitTier): Ratelimit | null {
  const redis = getRedisClient()
  if (!redis) return null

  const cached = upstashCeilingLimiters.get(tier)
  if (cached) return cached

  const config = RATE_LIMIT_TIERS[tier]
  const prefix = `${getNamespacePrefix()}ceil:${tier}:`
  const windowSeconds = Math.max(1, Math.round(config.windowMs / 1000))

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.ipSafetyCeiling, `${windowSeconds} s`),
    ephemeralCache,
    prefix,
    analytics: true,
  })

  upstashCeilingLimiters.set(tier, limiter)
  return limiter
}

/**
 * Mengambil metadata request dari konteks server TanStack Start secara aman.
 */
async function extractRequestMetadata(
  override?: RateLimitContextInput['contextOverride']
): Promise<RequestMetadata> {
  if (override?.sessionId || override?.clientIp || override?.userAgent) {
    return {
      sessionId: override.sessionId || '',
      clientIp: override.clientIp || '127.0.0.1',
      userAgent: override.userAgent || 'test-agent',
    }
  }

  let sessionId = ''
  let clientIp = ''
  let userAgent = ''

  try {
    const serverUtils = await import('@tanstack/react-start/server')

    try {
      const forwardedFor = serverUtils.getRequestHeader('x-forwarded-for')
      const realIp =
        serverUtils.getRequestHeader('cf-connecting-ip') ||
        serverUtils.getRequestHeader('x-real-ip')
      if (forwardedFor) {
        clientIp = forwardedFor.split(',')[0]?.trim() || ''
      } else if (realIp) {
        clientIp = realIp.trim()
      } else {
        clientIp =
          serverUtils.getRequestIP({ xForwardedFor: true }) || '127.0.0.1'
      }
    } catch {
      clientIp = '127.0.0.1'
    }

    try {
      userAgent = serverUtils.getRequestHeader('user-agent') || 'unknown-ua'
    } catch {
      userAgent = 'unknown-ua'
    }

    try {
      const existingCookie = serverUtils.getCookie(SESSION_COOKIE_NAME)
      if (existingCookie && existingCookie.trim().length >= 16) {
        sessionId = existingCookie.trim()
      } else {
        const newSid = randomUUID()
        sessionId = newSid
        serverUtils.setCookie(SESSION_COOKIE_NAME, newSid, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: SESSION_COOKIE_MAX_AGE,
        })
      }
    } catch {
      sessionId = ''
    }
  } catch {
    clientIp = '127.0.0.1'
    userAgent = 'unknown-ua'
  }

  return {
    sessionId,
    clientIp: clientIp || '127.0.0.1',
    userAgent: userAgent || 'unknown-ua',
  }
}

async function applyResponseRateLimitHeaders(
  status: RateLimitCheckStatus
): Promise<void> {
  try {
    const serverUtils = await import('@tanstack/react-start/server')
    serverUtils.setResponseHeader('X-RateLimit-Limit', String(status.limit))
    serverUtils.setResponseHeader(
      'X-RateLimit-Remaining',
      String(status.remaining)
    )
    serverUtils.setResponseHeader(
      'X-RateLimit-Reset',
      String(Math.ceil(status.resetAtMs / 1000))
    )
    serverUtils.setResponseHeader('X-RateLimit-Backend', status.backend)
    if (!status.allowed) {
      serverUtils.setResponseHeader(
        'Retry-After',
        String(status.retryAfterSeconds)
      )
    }
  } catch {
    // Abaikan jika dipanggil di luar siklus HTTP request
  }
}

function consumeSlidingWindow(
  key: string,
  maxRequests: number,
  windowMs: number,
  nowMs: number
): {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
  resetAtMs: number
} {
  const windowStart = nowMs - windowMs
  const existing = memoryStore.get(key)

  const validTimestamps = existing
    ? existing.timestamps.filter((ts) => ts > windowStart)
    : []

  if (validTimestamps.length >= maxRequests) {
    const oldestInWindow = validTimestamps[0] ?? nowMs
    const resetAtMs = oldestInWindow + windowMs
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((resetAtMs - nowMs) / 1000)
    )
    memoryStore.set(key, {
      timestamps: validTimestamps,
      expiresAt: resetAtMs,
    })
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      resetAtMs,
    }
  }

  validTimestamps.push(nowMs)
  const oldestInWindow = validTimestamps[0] ?? nowMs
  const resetAtMs = oldestInWindow + windowMs

  memoryStore.set(key, {
    timestamps: validTimestamps,
    expiresAt: nowMs + windowMs,
  })

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - validTimestamps.length),
    retryAfterSeconds: 0,
    resetAtMs,
  }
}

export const rateLimitService = {
  /**
   * Menghapus seluruh state rate limiter di memori dan cache lokal
   * (wajib dipanggil pada hook afterEach/afterAll di pengujian otomatis).
   */
  resetStore(): void {
    memoryStore.clear()
    ephemeralCache.clear()
    lastCleanupMs = 0
  },

  /**
   * Mengambil IP client dari header request saat ini.
   */
  async getClientIp(): Promise<string | undefined> {
    const meta = await extractRequestMetadata()
    return meta.clientIp && meta.clientIp !== '127.0.0.1'
      ? meta.clientIp
      : undefined
  },

  /**
   * Menyusun Composite Subject Key yang aman untuk jaringan IP Bersama (Wi-Fi Bimbel / CGNAT).
   */
  buildSubjectKey(
    action: string,
    meta: RequestMetadata,
    targetId?: string
  ): string {
    const normalizedTarget = targetId ? targetId.trim().toLowerCase() : ''
    const deviceIdentity = meta.sessionId
      ? `sid:${hashShort(meta.sessionId)}`
      : `dev:${hashShort(`${meta.clientIp}|${meta.userAgent}`)}`

    if (normalizedTarget) {
      return `${action}:${deviceIdentity}:tgt:${hashShort(normalizedTarget)}`
    }

    return `${action}:${deviceIdentity}`
  },

  /**
   * Mengevaluasi apakah request saat ini masih berada dalam batas kuota.
   * Mencoba Upstash Redis terlebih dahulu; jika offline/gagal, otomatis fallback ke in-memory.
   */
  async check(input: RateLimitContextInput): Promise<RateLimitCheckStatus> {
    const tierConfig = RATE_LIMIT_TIERS[input.tier]
    const nowMs = input.contextOverride?.nowMs ?? Date.now()

    cleanupExpiredEntries(nowMs)

    const meta = await extractRequestMetadata(input.contextOverride)
    const subjectKey = this.buildSubjectKey(input.action, meta, input.targetId)

    const forceMemory = Boolean(input.contextOverride?.forceMemory)
    const subjectLimiter = forceMemory ? null : getSubjectLimiter(input.tier)

    // 1. Jalur Utama: Upstash Redis Serverless
    if (subjectLimiter) {
      try {
        const upstashRes = await subjectLimiter.limit(subjectKey)
        const resetAtMs = upstashRes.reset
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((resetAtMs - nowMs) / 1000)
        )

        // Cek Plafon Darurat IP jika subject masih lolos
        if (upstashRes.success && meta.clientIp) {
          const ceilingLimiter = getCeilingLimiter(input.tier)
          if (ceilingLimiter) {
            const ceilingKey = `ip:${hashShort(meta.clientIp)}`
            const ceilingRes = await ceilingLimiter.limit(ceilingKey)
            if (!ceilingRes.success) {
              const ceilRetry = Math.max(
                1,
                Math.ceil((ceilingRes.reset - nowMs) / 1000)
              )
              const status: RateLimitCheckStatus = {
                allowed: false,
                limit: tierConfig.ipSafetyCeiling,
                remaining: 0,
                retryAfterSeconds: ceilRetry,
                resetAtMs: ceilingRes.reset,
                subjectKey: `ceil:${ceilingKey}`,
                backend: 'upstash',
              }
              await applyResponseRateLimitHeaders(status)
              return status
            }
          }
        }

        const status: RateLimitCheckStatus = {
          allowed: upstashRes.success,
          limit: upstashRes.limit,
          remaining: upstashRes.remaining,
          retryAfterSeconds: upstashRes.success ? 0 : retryAfterSeconds,
          resetAtMs,
          subjectKey,
          backend: 'upstash',
        }
        await applyResponseRateLimitHeaders(status)
        return status
      } catch (err: any) {
        console.warn(
          '[WARN] Upstash Redis tidak dapat dihubungi, beralih ke in-memory fallback:',
          err?.message
        )
      }
    }

    // 2. Jalur Cadangan (Failover High Availability): In-Memory Sliding Window
    const memoryKey = `rl:subj:${input.action}:${subjectKey}`
    const subjectEval = consumeSlidingWindow(
      memoryKey,
      tierConfig.maxRequests,
      tierConfig.windowMs,
      nowMs
    )

    if (!subjectEval.allowed) {
      const status: RateLimitCheckStatus = {
        allowed: false,
        limit: tierConfig.maxRequests,
        remaining: 0,
        retryAfterSeconds: subjectEval.retryAfterSeconds,
        resetAtMs: subjectEval.resetAtMs,
        subjectKey: memoryKey,
        backend: 'memory',
      }
      await applyResponseRateLimitHeaders(status)
      return status
    }

    // Plafon darurat IP in-memory
    if (meta.clientIp) {
      const ipCeilingKey = `rl:ip-ceiling:${input.tier}:${hashShort(meta.clientIp)}`
      const ipEval = consumeSlidingWindow(
        ipCeilingKey,
        tierConfig.ipSafetyCeiling,
        tierConfig.windowMs,
        nowMs
      )

      if (!ipEval.allowed) {
        const status: RateLimitCheckStatus = {
          allowed: false,
          limit: tierConfig.ipSafetyCeiling,
          remaining: 0,
          retryAfterSeconds: ipEval.retryAfterSeconds,
          resetAtMs: ipEval.resetAtMs,
          subjectKey: ipCeilingKey,
          backend: 'memory',
        }
        await applyResponseRateLimitHeaders(status)
        return status
      }
    }

    const status: RateLimitCheckStatus = {
      allowed: true,
      limit: tierConfig.maxRequests,
      remaining: subjectEval.remaining,
      retryAfterSeconds: 0,
      resetAtMs: subjectEval.resetAtMs,
      subjectKey: memoryKey,
      backend: 'memory',
    }
    await applyResponseRateLimitHeaders(status)
    return status
  },

  /**
   * Guard siap pakai untuk `createServerFn`. Mengembalikan `RateLimitBlockedResult` error
   * jika batas terlampaui, atau `null` jika diizinkan lanjut.
   */
  async enforce<_T = never>(
    input: RateLimitContextInput
  ): Promise<RateLimitBlockedResult | null> {
    const status = await this.check(input)
    if (!status.allowed) {
      console.warn(
        `[WARN] Rate limit terlampaui pada action="${input.action}" tier="${input.tier}" backend="${status.backend}" key="${status.subjectKey}" retryAfter=${status.retryAfterSeconds}s`
      )
      return {
        success: false,
        error: `Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu ${status.retryAfterSeconds} detik sebelum mencoba kembali.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: status.retryAfterSeconds,
      }
    }
    return null
  },
}
