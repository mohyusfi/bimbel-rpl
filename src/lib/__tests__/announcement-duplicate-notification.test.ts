import { describe, it, expect, beforeEach } from 'vitest'
import { adminStore } from '../admin-store'
import { setupRealtimeNotifications } from '../../hooks/use-realtime-notifications'

function createMockRealtimeClient() {
  const eventHandlers = new Map<string, Array<{ event: string; callback: (payload: any) => void }>>()

  const client = {
    channel(name: string) {
      const handlers: Array<{ event: string; callback: (payload: any) => void }> = []
      eventHandlers.set(name, handlers)

      const channelObj = {
        name,
        on(type: string, filterOrCallback: any, maybeCallback?: any) {
          const callback = typeof filterOrCallback === 'function' ? filterOrCallback : maybeCallback
          const event = typeof filterOrCallback === 'object' ? filterOrCallback.event : type
          handlers.push({ event, callback })
          return channelObj
        },
        subscribe() {
          return channelObj
        },
      }
      return channelObj
    },
    getChannels() {
      return []
    },
    removeChannel() {},
    _simulate(channelName: string, event: string, payload: any) {
      const handlers = eventHandlers.get(channelName) || []
      handlers
        .filter((h) => h.event === event || h.event === 'INSERT')
        .forEach((h) => h.callback(payload))
    },
  }

  return client
}

describe('Announcement Duplicate Notification Prevention', () => {
  beforeEach(() => {
    adminStore.resetToDefault()
  })

  it('tidak membuat 2 notifikasi duplikat saat menerima broadcast dan postgres_changes untuk pengumuman yang sama', () => {
    const mockClient = createMockRealtimeClient()
    const currentUserId = '3718bd9b-1fcf-4159-acdf-44b8000ee4b3'
    const announcementId = 'ann-test-dedup-999'

    setupRealtimeNotifications({
      userId: currentUserId,
      client: mockClient as any,
      enabled: true,
    })

    // 1. Event pertama: Realtime broadcast dari channel broadcast:announcements
    mockClient._simulate('broadcast:announcements', 'announcement', {
      payload: {
        id: announcementId,
        title: 'Pengumuman Penting Libur Nasional',
        message: 'Bimbel libur selama 2 hari.',
        type: 'announcement',
        metadata: {
          announcementId,
          targetAudience: 'Semua',
        },
      },
    })

    // 2. Event kedua: PostgreSQL INSERT notification row dari Supabase Realtime
    mockClient._simulate(`user-notifications:${currentUserId}`, 'INSERT', {
      new: {
        id: 'db-uuid-8888-9999-aaaa',
        user_id: currentUserId,
        title: 'Pengumuman Penting Libur Nasional',
        message: 'Bimbel libur selama 2 hari.',
        type: 'announcement',
        metadata: {
          announcementId,
          targetAudience: 'Semua',
        },
      },
    })

    // Verifikasi: Hanya ada 1 notifikasi untuk announcementId ini di adminStore
    const notifications = adminStore.getState().notifications
    const matchingNotifs = notifications.filter(
      (n) => n.id === announcementId || n.metadata?.announcementId === announcementId
    )

    expect(matchingNotifs.length).toBe(1)
  })

  it('tidak membuat 2 notifikasi duplikat meskipun payload broadcast tidak menyertakan metadata', () => {
    const mockClient = createMockRealtimeClient()
    const currentUserId = '3718bd9b-1fcf-4159-acdf-44b8000ee4b3'
    const announcementId = 'ann-test-no-meta-888'

    setupRealtimeNotifications({
      userId: currentUserId,
      client: mockClient as any,
      enabled: true,
    })

    // 1. Event broadcast tanpa metadata
    mockClient._simulate('broadcast:announcements', 'announcement', {
      payload: {
        id: announcementId,
        title: 'Jadwal Try Out UTBK Akbar',
        message: 'Pelaksanaan Try Out akan digelar Sabtu besok.',
        type: 'announcement',
      },
    })

    // 2. Event postgres_changes dengan UUID berbeda
    mockClient._simulate(`user-notifications:${currentUserId}`, 'INSERT', {
      new: {
        id: 'uuid-diff-1234-5678',
        user_id: currentUserId,
        title: 'Jadwal Try Out UTBK Akbar',
        message: 'Pelaksanaan Try Out akan digelar Sabtu besok.',
        type: 'announcement',
        metadata: {
          announcementId,
        },
      },
    })

    const notifications = adminStore.getState().notifications
    const matchingNotifs = notifications.filter(
      (n) => n.title === 'Jadwal Try Out UTBK Akbar'
    )

    expect(matchingNotifs.length).toBe(1)
  })
})
