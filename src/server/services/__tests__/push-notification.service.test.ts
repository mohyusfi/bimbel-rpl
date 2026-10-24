import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pushNotificationService, type SendPushPayload } from '../push-notification.service'
import webpush from 'web-push'

const VALID_VAPID_PUBLIC_KEY =
  'BFf8amwD3P7ZDVQaehCJ2XXPxiPaslwbWF4u3pM7sBplSZkdBcIiBR3izXemr0_M1uPbmvgY2Sjvx6zzllBpG2o'
const VALID_VAPID_PRIVATE_KEY = 'mqd09EYG9zFAh696oZdu5UmPXiTMikHH3VUqIKr8yEA'

describe('PushNotificationService (TDD & Vercel-Safe Push)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    pushNotificationService.clearMemorySubscriptions()
    process.env.VAPID_PUBLIC_KEY = VALID_VAPID_PUBLIC_KEY
    process.env.VAPID_PRIVATE_KEY = VALID_VAPID_PRIVATE_KEY
    process.env.VAPID_SUBJECT = 'mailto:admin@tadulakocendekia.sch.id'
  })

  describe('1. VAPID Configuration & Initialization', () => {
    it('menginisialisasi webpush dengan VAPID credentials yang valid', () => {
      const setVapidSpy = vi.spyOn(webpush, 'setVapidDetails').mockImplementation(() => {})
      const isReady = pushNotificationService.initVapid()

      expect(isReady).toBe(true)
      expect(setVapidSpy).toHaveBeenCalledWith(
        'mailto:admin@tadulakocendekia.sch.id',
        VALID_VAPID_PUBLIC_KEY,
        VALID_VAPID_PRIVATE_KEY
      )
    })

    it('mengembalikan false secara aman jika VAPID keys belum terkonfigurasi', () => {
      delete process.env.VAPID_PUBLIC_KEY
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const isReady = pushNotificationService.initVapid()
      expect(isReady).toBe(false)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN] VAPID keys'))
    })
  })

  describe('2. Subscription Management (subscribe & unsubscribe)', () => {
    it('menerima pendaftaran langganan baru dengan payload valid', async () => {
      const result = await pushNotificationService.subscribe({
        userId: '11111111-1111-1111-1111-111111111111',
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
        keys: {
          p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t0A43cxQ3iEN-bu3-2Q63DYmsZ-AI45AFr0468652Q18k=',
          auth: 'tBHItJI5svbpez7KI4CCXg==',
        },
        userAgent: 'Mozilla/5.0 Chrome/120.0',
      })

      expect(result.success).toBe(true)
    })

    it('menghapus pendaftaran langganan saat unsubscribe dipanggil', async () => {
      await pushNotificationService.subscribe({
        userId: '11111111-1111-1111-1111-111111111111',
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
        keys: { p256dh: 'key1', auth: 'auth1' },
      })

      const result = await pushNotificationService.unsubscribe('https://fcm.googleapis.com/fcm/send/test-endpoint-1')
      expect(result.success).toBe(true)
    })
  })

  describe('3. Vercel-Safe Push Dispatching (sendToUsers)', () => {
    it('mengabaikan pemanggilan jika daftar userIds kosong tanpa error', async () => {
      const res = await pushNotificationService.sendToUsers([], {
        title: 'Judul',
        message: 'Pesan',
      })

      expect(res.deliveredCount).toBe(0)
    })

    it('mengirim push notification ke perangkat target dengan timeout 3000ms', async () => {
      // Mock getSubscriptionsForUsers
      vi.spyOn(pushNotificationService, 'getSubscriptionsForUsers').mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'usr-1',
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint-success',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      ])

      const sendSpy = vi.spyOn(webpush, 'sendNotification').mockResolvedValue({
        statusCode: 201,
        body: '',
        headers: {},
      } as any)

      const payload: SendPushPayload = {
        title: 'Peringatan Ketidakhadiran Siswa (Alpa)',
        message: 'Siswa tercatat Alpa.',
        linkUrl: '/parent/kehadiran',
      }

      const res = await pushNotificationService.sendToUsers(['usr-1'], payload)

      expect(sendSpy).toHaveBeenCalledWith(
        {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint-success',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
        JSON.stringify(payload),
        expect.objectContaining({ timeout: 3000 })
      )
      expect(res.deliveredCount).toBe(1)
    })

    it('membersihkan endpoint yang kedaluwarsa (410 Gone / 404 Not Found) secara otomatis', async () => {
      vi.spyOn(pushNotificationService, 'getSubscriptionsForUsers').mockResolvedValue([
        {
          id: 'sub-expired',
          userId: 'usr-2',
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint-expired',
          keys: { p256dh: 'key2', auth: 'auth2' },
        },
      ])

      vi.spyOn(webpush, 'sendNotification').mockRejectedValue({
        statusCode: 410,
        message: 'Subscription has expired or is no longer valid',
      })

      const deleteSpy = vi.spyOn(pushNotificationService, 'removeStaleSubscriptions').mockResolvedValue(true)

      const res = await pushNotificationService.sendToUsers(['usr-2'], {
        title: 'Test Expired',
        message: 'Test message',
      })

      expect(res.deliveredCount).toBe(0)
      expect(deleteSpy).toHaveBeenCalledWith(['https://fcm.googleapis.com/fcm/send/endpoint-expired'])
    })

    it('membatasi target maksimal 10 penerima per panggilan Vercel serverless', async () => {
      const getSubsSpy = vi.spyOn(pushNotificationService, 'getSubscriptionsForUsers').mockResolvedValue([])

      const manyUserIds = Array.from({ length: 25 }, (_, i) => `user-${i}`)
      await pushNotificationService.sendToUsers(manyUserIds, {
        title: 'Broadcast Attempt',
        message: 'Message',
      })

      // Memastikan argumen yang diteruskan ke getSubscriptionsForUsers dibatasi 10
      expect(getSubsSpy).toHaveBeenCalledWith(manyUserIds.slice(0, 10))
    })
  })
})
