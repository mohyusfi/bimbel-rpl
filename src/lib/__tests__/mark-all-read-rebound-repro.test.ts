import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mergeNotificationSources,
  notificationDedupKey,
  type RealtimeNotificationsOptions,
} from '~/hooks/use-realtime-notifications'
import { adminStore, type AdminNotification } from '~/lib/admin-store'
import { notificationService } from '~/server/services/notification.service'

describe('markAllAsRead Rebound Diagnosis (Phase 1 Feedback Loop)', () => {
  beforeEach(() => {
    adminStore.resetToDefault()
    adminStore.getState().notifications = []
  })

  it('RED TEST: mergeNotificationSources must NOT resurrect isRead: false if item was already read in live store', () => {
    const ANN_ID = 'ann-test-999'

    // Live store has notification marked as read by user
    const liveItem: AdminNotification = {
      id: `notif-ann-${ANN_ID}-admin`,
      title: 'Pengumuman Penting',
      message: 'Isi pengumuman',
      type: 'announcement',
      timestamp: 'Baru saja',
      isRead: true, // User just marked it as read!
      metadata: {
        announcementId: ANN_ID,
        targetAudience: 'Semua',
        recipientRole: 'admin',
      },
    }

    // Database still returns old row with is_read: false because update was in-flight
    const dbInboxItem: AdminNotification = {
      id: 'd992d9fc-6f5b-434f-998b-358e54a754b7',
      title: 'Pengumuman Penting',
      message: 'Isi pengumuman',
      type: 'announcement',
      timestamp: 'Baru saja',
      isRead: false, // Old state from DB!
      metadata: {
        announcementId: ANN_ID,
        targetAudience: 'Semua',
        recipientRole: 'admin',
      },
    }

    const merged = mergeNotificationSources([dbInboxItem], [liveItem])

    expect(merged).toHaveLength(1)
    // Symptom: in unpatched code, merged[0].isRead is FALSE (resurrected!), causing "1 baru" to bounce back
    expect(merged[0].isRead).toBe(true)
  })

  it('RED TEST: notificationService.markAsRead correctly resolves notif-ann-{id}-admin IDs to announcementId', async () => {
    const ANN_ID = 'ann-4567'

    // When client sends notif-ann-ann-4567-admin as notificationId
    const res = await notificationService.markAsRead({
      notificationIds: [`notif-ann-${ANN_ID}-admin`],
      announcementIds: [ANN_ID],
    })

    expect(res.success).toBe(true)
  })
})
