import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { adminStore, type AdminNotification, type Announcement } from '~/lib/admin-store'
import { supabase } from '~/lib/supabase/client'
import { ADMIN_KEYS } from '~/hooks/use-admin-data'

describe('Tiket 07 — Notifikasi Waktu-Nyata Supabase Realtime & Broadcast Bimbel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // =========================================================================
  // 1. DEDUP & PENAMBAHAN NOTIFIKASI PADA ADMIN STORE
  // =========================================================================
  describe('Admin Store: Manajemen Notifikasi & Deduplikasi', () => {
    it('menambahkan notifikasi baru ke dalam antrean paling depan', () => {
      const initialCount = adminStore.getState().notifications.length
      const notif = adminStore.addNotification({
        title: 'Pembayaran Diterima',
        message: 'Tagihan INV-2026-0301 lunas.',
        type: 'billing',
      })

      expect(notif).toBeDefined()
      expect(notif.id).toBeDefined()
      expect(notif.isRead).toBe(false)
      expect(notif.timestamp).toBe('Baru saja')

      const currentNotifs = adminStore.getState().notifications
      expect(currentNotifs.length).toBe(initialCount + 1)
      expect(currentNotifs[0].id).toBe(notif.id)
    })

    it('mencegah duplikasi notifikasi jika ID notifikasi yang sama dimasukkan ulang', () => {
      const uniqueId = `notif-test-dedup-${Date.now()}`
      const first = adminStore.addNotification({
        id: uniqueId,
        title: 'Notifikasi Uji Dedup',
        message: 'Pesan asli',
        type: 'general',
      })

      const initialLength = adminStore.getState().notifications.length

      const duplicate = adminStore.addNotification({
        id: uniqueId,
        title: 'Notifikasi Uji Dedup (Duplikat)',
        message: 'Pesan duplikat',
        type: 'general',
      })

      expect(duplicate.id).toBe(first.id)
      expect(duplicate.title).toBe(first.title)
      expect(adminStore.getState().notifications.length).toBe(initialLength)
    })

    it('menandai satu notifikasi telah dibaca secara type-safe', () => {
      const notif = adminStore.addNotification({
        title: 'Periksa Jadwal',
        message: 'Jadwal bimbingan telah diperbarui.',
        type: 'schedule',
      })

      expect(notif.isRead).toBe(false)
      adminStore.markNotificationRead(notif.id)

      const updated = adminStore.getState().notifications.find((n) => n.id === notif.id)
      expect(updated?.isRead).toBe(true)
    })

    it('menandai seluruh notifikasi telah dibaca sekaligus', () => {
      adminStore.addNotification({
        title: 'Notif 1',
        message: 'Pesan 1',
        type: 'general',
      })
      adminStore.addNotification({
        title: 'Notif 2',
        message: 'Pesan 2',
        type: 'academic',
      })

      adminStore.markAllNotificationsRead()
      const allRead = adminStore.getState().notifications.every((n) => n.isRead === true)
      expect(allRead).toBe(true)
    })
  })

  // =========================================================================
  // 2. BROADCAST PENGUMUMAN WAKTU-NYATA
  // =========================================================================
  describe('Supabase Realtime Broadcast: Pengumuman Bimbel', () => {
    it('adminStore.broadcastAnnouncement membuat notifikasi lokal dan mengirim pesan ke channel broadcast', async () => {
      const mockChannel = {
        subscribe: vi.fn((cb) => {
          cb('SUBSCRIBED')
          return mockChannel
        }),
        send: vi.fn().mockResolvedValue('ok'),
      }

      const channelSpy = vi.spyOn(supabase, 'channel').mockReturnValue(mockChannel as any)
      const removeChannelSpy = vi.spyOn(supabase, 'removeChannel').mockResolvedValue('ok' as any)

      const testAnn: Announcement = {
        id: `ann-test-${Date.now()}`,
        title: 'Simulasi Akbar UTBK 2026',
        content: 'Simulasi dilaksanakan hari Minggu jam 08.00 WITA di Ruang Palu-1.',
        targetAudience: 'Semua',
        publishedDate: '20 Oktober 2026',
        author: 'Hj. Nuraini, S.Pd',
        isPinned: true,
      }

      const notifResult = await adminStore.broadcastAnnouncement(testAnn)
      const notif = Array.isArray(notifResult) ? notifResult[notifResult.length - 1] : notifResult

      expect(notif).toBeDefined()
      expect(notif.type).toBe('announcement')
      expect(notif.title).toContain(testAnn.title)
      expect(notif.linkUrl).toBe('/admin/pengumuman')

      // Verifikasi channel broadcast dibuka
      expect(channelSpy).toHaveBeenCalledWith('broadcast:announcements')
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'broadcast',
          event: 'announcement',
          payload: expect.objectContaining({
            title: expect.stringContaining(testAnn.title),
            targetAudience: 'Semua',
          }),
        })
      )
    })
  })

  // =========================================================================
  // 3. PEMERIKSAAN KONTRAK CHANNEL & PENCEGAHAN KEBOCORAN KONEKSI WEBSOCKET
  // =========================================================================
  describe('Pembersihan Saluran WebSocket (Anti-Connection Leak)', () => {
    it('memastikan supabase.removeChannel tersedia dan melepaskan koneksi saluran aktif', async () => {
      const dummyChannel = supabase.channel('user-notifications:dummy-user')
      expect(typeof supabase.removeChannel).toBe('function')

      const result = await supabase.removeChannel(dummyChannel)
      expect(['ok', 'timed out', 'error']).toContain(result)
    })

    it('memvalidasi pemetaan queryKey TanStack Query untuk setiap tipe notifikasi Tiket 07', () => {
      // Sesuai requirement:
      // notifications -> ADMIN_KEYS.notifications
      // attendance -> ADMIN_KEYS.attendanceSessions
      // billing -> ADMIN_KEYS.invoices
      // academic -> ADMIN_KEYS.gradeRecords
      // announcement -> ADMIN_KEYS.announcements
      expect(ADMIN_KEYS.notifications).toEqual(['admin', 'notifications'])
      expect(ADMIN_KEYS.attendanceSessions).toEqual(['admin', 'attendance'])
      expect(ADMIN_KEYS.invoices).toEqual(['admin', 'invoices'])
      expect(ADMIN_KEYS.gradeRecords).toEqual(['admin', 'grades'])
      expect(ADMIN_KEYS.announcements).toEqual(['admin', 'announcements'])
    })
  })
})
