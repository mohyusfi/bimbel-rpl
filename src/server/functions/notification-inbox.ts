import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const getNotificationInboxFn = createServerFn({ method: 'GET' })
  .validator((d: unknown) => {
    return z
      .object({
        userIds: z.array(z.string()).optional(),
        email: z.string().optional(),
      })
      .optional()
      .parse(d)
  })
  .handler(async ({ data }) => {
    const { notificationService } = await import(
      '~/server/services/notification.service'
    )
    return await notificationService.getInbox(data || {})
  })

export const markNotificationsReadFn = createServerFn({ method: 'POST' })
  .validator((d: unknown) => {
    return z
      .object({
        all: z.boolean().optional(),
        notificationIds: z.array(z.string()).optional(),
        announcementIds: z.array(z.string()).optional(),
        userIds: z.array(z.string()).optional(),
        email: z.string().optional(),
      })
      .parse(d)
  })
  .handler(async ({ data }) => {
    const { notificationService } = await import(
      '~/server/services/notification.service'
    )
    return await notificationService.markAsRead(data || {})
  })
