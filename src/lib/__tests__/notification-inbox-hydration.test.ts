/**
 * Regression test (feedback loop) untuk bug:
 * "Notifikasi lonceng tidak muncul di role/audiens yang dipilih (tutor/orang tua),
 *  hanya admin & siswa."
 *
 * Akar masalah: lonceng (useRealtimeNotifications) hanya membaca store in-memory
 * (adminStore) yang kosong saat halaman dimuat dan tidak pernah di-hydrate dari
 * tabel `notifications` di Supabase. Akibatnya baris notifikasi per-penerima yang
 * sudah benar dibuat oleh announcementService tidak pernah tampil.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { getNotificationInboxFnMock } = vi.hoisted(() => ({
  getNotificationInboxFnMock: vi.fn(),
}))

vi.mock('~/server/functions/notification-inbox', () => ({
  getNotificationInboxFn: getNotificationInboxFnMock,
}))

import { adminStore } from '../admin-store'
import {
  mergeNotificationSources,
  createNotificationQueryFn,
  type RealtimeNotificationsOptions,
} from '../../hooks/use-realtime-notifications'
import type { AdminNotification } from '../admin-store'

const TUTOR_PROFILE_ID = '1dc75962-7771-4c58-85af-5ce40c2eabae'
const ANN_ID = 'ann-1792917220030-cdo3a'

const tutorInboxRow: AdminNotification = {
  id: '23a621a0-0000-0000-0000-000000000001',
  userId: TUTOR_PROFILE_ID,
  title: 'PENGUMUNAN: SPP akan dinaikkan dalam waktu dekat',
  message: 'SPP akan disesuaikan. Mohon persiapkan.',
  type: 'announcement',
  linkUrl: '/tutor',
  isRead: false,
  timestamp: '2026-10-25T08:33:42Z',
  createdAt: '2026-10-25T08:33:42Z',
  metadata: {
    announcementId: ANN_ID,
    targetAudience: 'Semua',
    recipientRole: 'tutor',
  },
}

describe('Feedback loop: lonceng harus memuat notifikasi dari DB inbox', () => {
  beforeEach(() => {
    getNotificationInboxFnMock.mockReset()
    adminStore.resetToDefault()
  })

  it('RED->GREEN: queryFn mengembalikan baris DB walau store realtime kosong', async () => {
    getNotificationInboxFnMock.mockResolvedValue({
      success: true,
      data: [tutorInboxRow],
    })

    const options: RealtimeNotificationsOptions = {
      userId: TUTOR_PROFILE_ID,
      role: 'tutor',
      relevantUserIds: [TUTOR_PROFILE_ID],
      userEmail: 'dian.pratiwi@tadulakocendekia.sch.id',
    }

    const rows = await createNotificationQueryFn(options)()
    const found = rows.find((r) => r.metadata?.announcementId === ANN_ID)

    expect(found).toBeTruthy()
    expect(found?.type).toBe('announcement')
    expect(found?.userId).toBe(TUTOR_PROFILE_ID)
  })

  it('queryFn tetap mengembalikan store realtime bila server gagal (offline fallback)', async () => {
    getNotificationInboxFnMock.mockRejectedValue(new Error('offline'))
    adminStore.addNotification({
      id: 'live-1',
      title: 'Notif Live',
      message: 'dari realtime',
      type: 'general',
    })

    const rows = await createNotificationQueryFn({ role: 'tutor' })()
    expect(rows.some((r) => r.id === 'live-1')).toBe(true)
  })

  it('mergeNotificationSources menggabungkan inbox + realtime dan dedup by id', () => {
    const live: AdminNotification = {
      id: 'live-1',
      title: 'Notif Live',
      message: 'dari realtime',
      type: 'general',
      isRead: false,
      timestamp: 'Baru saja',
    }

    const merged = mergeNotificationSources([tutorInboxRow], [live])
    expect(merged.length).toBe(2)

    const mergedDup = mergeNotificationSources([tutorInboxRow], [tutorInboxRow])
    expect(mergedDup.length).toBe(1)
  })

  it('mergeNotificationSources dedup baris broadcast & personal untuk announcementId yang sama', () => {
    const broadcast: AdminNotification = {
      id: ANN_ID,
      title: tutorInboxRow.title,
      message: tutorInboxRow.message,
      type: 'announcement',
      isRead: false,
      timestamp: 'Baru saja',
      metadata: { announcementId: ANN_ID, targetAudience: 'Semua' },
    }

    const merged = mergeNotificationSources([tutorInboxRow], [broadcast])
    const forAnn = merged.filter((r) => r.metadata?.announcementId === ANN_ID)
    expect(forAnn.length).toBe(1)
    // Baris personal (dari DB inbox) yang diprioritaskan
    expect(forAnn[0].id).toBe(tutorInboxRow.id)
  })
})
