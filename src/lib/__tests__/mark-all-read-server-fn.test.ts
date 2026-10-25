import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notificationService } from '~/server/services/notification.service'

describe('notificationService.markAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates notifications matching valid userIds and notificationIds', async () => {
    const res = await notificationService.markAsRead({
      userIds: ['d992d9fc-6f5b-434f-998b-358e54a754b7'],
      notificationIds: ['943d2c13-0a7f-4e5d-b00d-a930e5bbbfdc'],
    })

    expect(res).toBeDefined()
    expect(res.success).toBe(true)
    if (res.success) {
      expect(typeof res.data.count).toBe('number')
    }
  })

  it('ignores invalid non-uuid userIds safely without throwing postgrest errors', async () => {
    const res = await notificationService.markAsRead({
      userIds: ['stu-1', 'par-1', 'tut-invalid'],
      notificationIds: ['announcement-local-123'],
    })

    expect(res).toBeDefined()
    expect(res.success).toBe(true)
  })

  it('resolves user profile ID from email safely', async () => {
    const res = await notificationService.markAsRead({
      email: 'siswa@tadulakocendekia.sch.id',
      notificationIds: ['943d2c13-0a7f-4e5d-b00d-a930e5bbbfdc'],
    })

    expect(res).toBeDefined()
    expect(res.success).toBe(true)
  })

  it('handles empty inputs safely without error', async () => {
    const res = await notificationService.markAsRead({})
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.count).toBe(0)
    }
  })
})
