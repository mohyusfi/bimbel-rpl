import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const getVapidPublicKeyFn = createServerFn({ method: 'GET' }).handler(async () => {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || ''
  return { publicKey }
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
    const { pushNotificationService } = await import(
      '~/server/services/push-notification.service'
    )
    return await pushNotificationService.subscribe(data)
  })

export const removePushSubscriptionFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      endpoint: z.string().url(),
    })
  )
  .handler(async ({ data }) => {
    const { pushNotificationService } = await import(
      '~/server/services/push-notification.service'
    )
    return await pushNotificationService.unsubscribe(data.endpoint)
  })
