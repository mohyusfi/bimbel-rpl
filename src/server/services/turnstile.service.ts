export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

// Official Cloudflare dummy secret key for always-pass testing
const CLOUDFLARE_DUMMY_SECRET_KEY = '1x0000000000000000000000000000000AA'
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TIMEOUT_MS = 10_000

export interface TurnstileVerificationData {
  verified: boolean
  challengeTs?: string
  hostname?: string
  action?: string
  errorCodes?: string[]
}

interface CloudflareSiteverifyRawResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
}

export const turnstileService = {
  /**
   * Memvalidasi token Cloudflare Turnstile sisi server via endpoint siteverify
   */
  async verifyToken(
    token: string,
    remoteIp?: string
  ): Promise<ServerResult<TurnstileVerificationData>> {
    const cleanToken = token ? token.trim() : ''
    if (!cleanToken) {
      return {
        success: false,
        error: 'Token verifikasi keamanan tidak ditemukan. Silakan selesaikan verifikasi.',
        code: 'TURNSTILE_MISSING_TOKEN',
      }
    }

    if (cleanToken.length > 2048) {
      return {
        success: false,
        error: 'Token verifikasi tidak valid (melebihi batas panjang).',
        code: 'TURNSTILE_TOKEN_TOO_LONG',
      }
    }

    const isTestToken = cleanToken === '1x00000000000000000000AA'
    const secretKey =
      (isTestToken && process.env.NODE_ENV !== 'production')
        ? CLOUDFLARE_DUMMY_SECRET_KEY
        : (process.env.TURNSTILE_SECRET_KEY || (process.env.NODE_ENV !== 'production' ? CLOUDFLARE_DUMMY_SECRET_KEY : ''))

    if (!secretKey) {
      console.error('[ERROR] TURNSTILE_SECRET_KEY belum dikonfigurasi di environment.')
      return {
        success: false,
        error: 'Konfigurasi verifikasi keamanan server belum lengkap.',
        code: 'TURNSTILE_UNCONFIGURED_SECRET',
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const formData = new FormData()
      formData.append('secret', secretKey)
      formData.append('response', cleanToken)
      if (remoteIp) {
        formData.append('remoteip', remoteIp)
      }

      const response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      if (!response.ok) {
        console.error(`[ERROR] Cloudflare siteverify HTTP error: ${response.status}`)
        return {
          success: false,
          error: 'Gagal menghubungi server verifikasi keamanan Cloudflare.',
          code: 'TURNSTILE_HTTP_ERROR',
        }
      }

      const data = (await response.json()) as CloudflareSiteverifyRawResponse

      if (!data.success) {
        console.warn('[WARN] Verifikasi Turnstile ditolak oleh Cloudflare:', data['error-codes'])
        return {
          success: false,
          error: 'Verifikasi bot gagal. Silakan coba kembali atau muat ulang halaman.',
          code: 'TURNSTILE_CHALLENGE_FAILED',
        }
      }

      return {
        success: true,
        data: {
          verified: true,
          challengeTs: data.challenge_ts,
          hostname: data.hostname,
          action: data.action,
          errorCodes: data['error-codes'],
        },
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.error('[ERROR] Batas waktu verifikasi Turnstile habis (timeout)')
        return {
          success: false,
          error: 'Batas waktu verifikasi keamanan habis. Silakan coba kembali.',
          code: 'TURNSTILE_TIMEOUT',
        }
      }

      console.error('[ERROR] Terjadi kegagalan saat verifikasi Turnstile:', err?.message)
      return {
        success: false,
        error: 'Gagal menghubungi server verifikasi keamanan.',
        code: 'TURNSTILE_NETWORK_ERROR',
      }
    } finally {
      clearTimeout(timeoutId)
    }
  },
}
