import { describe, it, expect } from 'vitest'
import { pushNotificationService } from '../push-notification.service'

describe('PushNotificationService (Disabled for Release)', () => {
  it('initVapid mengembalikan false secara aman saat dinonaktifkan', async () => {
    const isReady = await pushNotificationService.initVapid()
    expect(isReady).toBe(false)
  })

  it('subscribe dan unsubscribe mengembalikan respons sukses tanpa operasi eksternal', async () => {
    const subRes = await pushNotificationService.subscribe({
      userId: 'test-user',
      endpoint: 'https://example.com/endpoint',
      keys: { p256dh: 'key', auth: 'auth' },
    })
    expect(subRes.success).toBe(true)

    const unsubRes = await pushNotificationService.unsubscribe('https://example.com/endpoint')
    expect(unsubRes.success).toBe(true)
  })

  it('getSubscriptionsForUsers mengembalikan array kosong', async () => {
    const subs = await pushNotificationService.getSubscriptionsForUsers(['test-user'])
    expect(subs).toEqual([])
  })

  it('sendToUsers menghasilkan deliveredCount 0 tanpa melemparkan error', async () => {
    const res = await pushNotificationService.sendToUsers(['test-user'], {
      title: 'Judul',
      message: 'Pesan',
    })
    expect(res.deliveredCount).toBe(0)
    expect(res.failedCount).toBe(0)
  })
})
