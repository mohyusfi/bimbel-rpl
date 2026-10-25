import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const getVapidPublicKeyFn = createServerFn({ method: 'GET' }).handler(async () => {
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
  .handler(async () => {
    return { success: true }
  })

export const removePushSubscriptionFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      endpoint: z.string().url(),
    })
  )
  .handler(async () => {
    return { success: true }
  })
