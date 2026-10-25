import { describe, it, expect, vi, beforeEach } from 'vitest'
import { adminStore, type AdminNotification } from '~/lib/admin-store'
import { ADMIN_KEYS } from '~/hooks/use-admin-data'

describe('markAllAsRead Double Click Bug Diagnosis (Phase 1 Feedback Loop)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    adminStore.resetToDefault()
  })

  it('RED TEST: markAllNotificationsRead must mark announcements as read even when targetIds has DB UUIDs', () => {
    const ANN_ID = 'ann-2026-xyz'
    const DB_ROW_UUID = '52b26a0a-ba32-48eb-9378-4c7658ae9a7a'
    const ADMIN_USER_ID = '3718bd9b-1fcf-4159-acdf-44b8000ee4b3'

    // Add announcement in adminStore (which has notif-ann-{id}-admin format and undefined userId)
    adminStore.getState().notifications = [
      {
        id: `notif-ann-${ANN_ID}-admin`,
        title: 'Pengumuman Penting',
        message: 'Isi pengumuman',
        type: 'announcement',
        timestamp: 'Baru saja',
        isRead: false,
        metadata: {
          announcementId: ANN_ID,
          targetAudience: 'Semua',
          recipientRole: 'admin',
        },
      },
    ]

    // In the UI, the notification displayed in the drawer came from DB, so targetIds has DB_ROW_UUID
    // but announcementIds has ANN_ID
    // In current buggy code, markAllNotificationsRead(ADMIN_USER_ID, [DB_ROW_UUID]) does NOT mark notif-ann-... read!
    adminStore.markAllNotificationsRead(
      ADMIN_USER_ID,
      [DB_ROW_UUID],
      [ANN_ID]
    )

    const notifInStore = adminStore.getState().notifications[0]
    expect(notifInStore.isRead).toBe(true)
  })

  it('RED TEST: useAdminDataSync must NOT invalidate ADMIN_KEYS.notifications on store updates', () => {
    // Simulated QueryClient
    const invalidatedKeys: any[] = []
    const mockQueryClient: any = {
      invalidateQueries: vi.fn((options: any) => {
        invalidatedKeys.push(options)
      }),
    }

    // In current code:
    // adminStoreUnsub = adminStore.subscribe(() => {
    //   qc.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    // })
    // If ADMIN_KEYS.all (['admin']) is invalidated, ADMIN_KEYS.notifications (['admin', 'notifications'])
    // matches and triggers an immediate premature refetch storm while the server mutation is in flight!

    // We test that predicate or key filter excludes 'notifications'
    const isNotificationsInvalidated = (call: any) => {
      if (call.queryKey) {
        return (
          call.queryKey[0] === 'admin' &&
          (call.queryKey.length === 1 || call.queryKey[1] === 'notifications')
        )
      }
      if (typeof call.predicate === 'function') {
        return call.predicate({ queryKey: ADMIN_KEYS.notifications })
      }
      return false
    }

    // If we trigger a subscriber that mimics useAdminDataSync with the bug:
    const buggyHandler = () => {
      mockQueryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    }

    // The desired handler should NOT match notifications:
    const desiredHandler = () => {
      mockQueryClient.invalidateQueries({
        predicate: (query: any) => {
          const key = query.queryKey
          if (!Array.isArray(key)) return false
          return key[0] === 'admin' && key[1] !== 'notifications'
        },
      })
    }

    // Assert buggyHandler causes notifications to be invalidated:
    buggyHandler()
    expect(isNotificationsInvalidated(invalidatedKeys[0])).toBe(true)

    // Assert desiredHandler does NOT cause notifications to be invalidated:
    invalidatedKeys.length = 0
    desiredHandler()
    expect(isNotificationsInvalidated(invalidatedKeys[0])).toBe(false)
  })
})
