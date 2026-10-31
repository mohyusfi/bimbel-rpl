import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const getVapidPublicKeyFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { rateLimitService } = await import('~/server/services/rate-limit.service')
  const rateLimitBlocked = await rateLimitService.enforce({
    tier: 'READ',
    action: 'push:get-vapid-key',
  })
  if (rateLimitBlocked) {
    return { publicKey: '', error: rateLimitBlocked.error, code: rateLimitBlocked.code }
  }
  return { publicKey: '' }
})

export const savePushSubscriptionFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      userId: z.string().min(1),
      extraUserIds: z.array(z.string()).optional(),
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
      }),
      userAgent: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { rateLimitService } = await import('~/server/services/rate-limit.service')
    const rateLimitBlocked = await rateLimitService.enforce<{ subscribed: boolean }>({
      tier: 'MUTATION',
      action: 'push:save-subscription',
      targetId: data.userId,
    })
    if (rateLimitBlocked) {
      return rateLimitBlocked
    }
    return { success: true, data: { subscribed: true } }
  })

export const removePushSubscriptionFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      endpoint: z.string().url(),
    })
  )
  .handler(async ({ data }) => {
    const { rateLimitService } = await import('~/server/services/rate-limit.service')
    const rateLimitBlocked = await rateLimitService.enforce<{ removed: boolean }>({
      tier: 'MUTATION',
      action: 'push:remove-subscription',
      targetId: data.endpoint,
    })
    if (rateLimitBlocked) {
      return rateLimitBlocked
    }
    return { success: true, data: { removed: true } }
  })
