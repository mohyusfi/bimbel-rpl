import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { ServerResult } from '~/server/services/turnstile.service'

export const verifyLoginTurnstileSchema = z.object({
  turnstileToken: z.string().min(1, 'Verifikasi bot wajib diselesaikan.'),
  identifier: z.string().optional(),
})

export type VerifyLoginTurnstileInput = z.infer<typeof verifyLoginTurnstileSchema>

export const verifyLoginTurnstileFn = createServerFn({ method: 'POST' })
  .validator((d: unknown) => verifyLoginTurnstileSchema.parse(d))
  .handler(async ({ data }): Promise<ServerResult<{ verified: boolean }>> => {
    const { rateLimitService } = await import('~/server/services/rate-limit.service')
    const rateLimitBlocked = await rateLimitService.enforce<{ verified: boolean }>({
      tier: 'PUBLIC_AUTH',
      action: 'auth:login-turnstile',
      targetId: data.identifier,
    })
    if (rateLimitBlocked) {
      return rateLimitBlocked
    }

    const remoteIp = await rateLimitService.getClientIp()
    const { turnstileService } = await import('~/server/services/turnstile.service')
    const verifyResult = await turnstileService.verifyToken(data.turnstileToken, {
      expectedAction: 'login',
      remoteIp,
    })

    if (!verifyResult.success) {
      console.warn('[WARN] Login diblokir: Verifikasi Turnstile gagal', verifyResult.error)
      return {
        success: false,
        error: verifyResult.error || 'Verifikasi keamanan bot gagal. Silakan coba kembali.',
        code: verifyResult.code || 'BOT_VERIFICATION_FAILED',
      }
    }

    return {
      success: true,
      data: { verified: true },
    }
  })

export const activateUserSchema = z.object({
  email: z.string().email('Format email tidak valid.'),
})

export type ActivateUserInput = z.infer<typeof activateUserSchema>

export const activateUnconfirmedUserFn = createServerFn({ method: 'POST' })
  .validator((d: unknown) => activateUserSchema.parse(d))
  .handler(async ({ data }): Promise<ServerResult<{ activated: boolean }>> => {
    const { rateLimitService } = await import('~/server/services/rate-limit.service')
    const rateLimitBlocked = await rateLimitService.enforce<{ activated: boolean }>({
      tier: 'PUBLIC_AUTH',
      action: 'auth:activate-user',
      targetId: data.email,
    })
    if (rateLimitBlocked) {
      return rateLimitBlocked
    }

    const { registrationService } = await import('~/server/services/registration.service')
    return registrationService.activateUserAccount(data.email)
  })
