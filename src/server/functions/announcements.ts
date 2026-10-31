import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const getAnnouncementsFn = createServerFn({ method: 'GET' })
  .validator((d: unknown) => {
    return z
      .object({
        targetAudience: z.string().optional(),
        role: z.string().optional(),
      })
      .optional()
      .parse(d)
  })
  .handler(async ({ data }) => {
    const { rateLimitService } = await import(
      '~/server/services/rate-limit.service'
    )
    const rateLimitBlocked = await rateLimitService.enforce({
      tier: 'READ',
      action: 'announcements:get',
      targetId: data?.role,
    })
    if (rateLimitBlocked) {
      return rateLimitBlocked
    }

    const { announcementService } = await import(
      '~/server/services/announcement.service'
    )
    return await announcementService.getAnnouncements(data)
  })

export const createAnnouncementFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      title: z.string().min(1, 'Judul pengumuman wajib diisi'),
      content: z.string().min(1, 'Isi pengumuman wajib diisi'),
      targetAudience: z.enum(['Semua', 'Siswa', 'Orang Tua', 'Tutor']),
      isPinned: z.boolean().optional(),
      broadcast: z.boolean().optional(),
      author: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { rateLimitService } = await import(
      '~/server/services/rate-limit.service'
    )
    const rateLimitBlocked = await rateLimitService.enforce({
      tier: 'MUTATION',
      action: 'announcements:create',
      targetId: data.author,
    })
    if (rateLimitBlocked) {
      return rateLimitBlocked
    }

    const { announcementService } = await import(
      '~/server/services/announcement.service'
    )
    return await announcementService.createAnnouncement(data)
  })

export const deleteAnnouncementFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      announcementId: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    const { rateLimitService } = await import(
      '~/server/services/rate-limit.service'
    )
    const rateLimitBlocked = await rateLimitService.enforce({
      tier: 'MUTATION',
      action: 'announcements:delete',
    })
    if (rateLimitBlocked) {
      return rateLimitBlocked
    }

    const { announcementService } = await import(
      '~/server/services/announcement.service'
    )
    return await announcementService.deleteAnnouncement(data.announcementId)
  })

export const togglePinAnnouncementFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      announcementId: z.string().min(1),
      isPinned: z.boolean(),
    })
  )
  .handler(async ({ data }) => {
    const { rateLimitService } = await import(
      '~/server/services/rate-limit.service'
    )
    const rateLimitBlocked = await rateLimitService.enforce({
      tier: 'MUTATION',
      action: 'announcements:toggle-pin',
    })
    if (rateLimitBlocked) {
      return rateLimitBlocked
    }

    const { announcementService } = await import(
      '~/server/services/announcement.service'
    )
    return await announcementService.togglePinAnnouncement(
      data.announcementId,
      data.isPinned
    )
  })
