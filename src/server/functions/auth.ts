import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { ServerResult } from '~/server/services/turnstile.service'

export const verifyLoginTurnstileSchema = z.object({
  turnstileToken: z.string().min(1, 'Verifikasi bot wajib diselesaikan.'),
})

export type VerifyLoginTurnstileInput = z.infer<typeof verifyLoginTurnstileSchema>

export const verifyLoginTurnstileFn = createServerFn({ method: 'POST' })
  .validator((d: unknown) => verifyLoginTurnstileSchema.parse(d))
  .handler(async ({ data }): Promise<ServerResult<{ verified: boolean }>> => {
    const { turnstileService } = await import('~/server/services/turnstile.service')
    const verifyResult = await turnstileService.verifyToken(data.turnstileToken, {
      expectedAction: 'login',
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
    const { registrationService } = await import('~/server/services/registration.service')
    return registrationService.activateUserAccount(data.email)
  })
