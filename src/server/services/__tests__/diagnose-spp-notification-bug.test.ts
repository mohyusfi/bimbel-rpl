import { describe, it, expect, beforeEach } from 'vitest'
import { billingService } from '../billing.service'
import { adminStore } from '~/lib/admin-store'
import { pushNotificationService } from '../push-notification.service'

describe('Diagnose SPP Notification Bug', () => {
  beforeEach(() => {
    pushNotificationService.clearMemorySubscriptions()
  })

  it('1. saat admin menambahkan tagihan SPP baru, notifikasi billing harus dibuat untuk siswa/wali', async () => {
    // Fahri Ramadhan (stu-1)
    const initialNotifCount = adminStore.getState().notifications.filter((n) => n.type === 'billing').length

    const res = await billingService.createInvoice({
      studentId: 'stu-1',
      programName: 'Reguler SMA - Semester Genap',
      amount: 750000,
      dueDate: '2026-11-10',
      description: 'Tagihan SPP November 2026',
    })

    expect(res.success).toBe(true)
    if (!res.success) throw new Error(res.error)
    expect(res.data).toBeDefined()

    // Cek apakah notifikasi bertambah di notifikasi slider / store
    const currentBillingNotifs = adminStore.getState().notifications.filter((n) => n.type === 'billing')
    expect(currentBillingNotifs.length).toBeGreaterThan(initialNotifCount)
  }, 15000)

  it('2. saat admin menambahkan tagihan SPP baru, push notification harus dikirim ke profileId siswa dan wali murid', async () => {
    let pushSent = false
    let sentUserIds: string[] = []

    const originalSend = pushNotificationService.sendToUsers.bind(pushNotificationService)
    pushNotificationService.sendToUsers = async (userIds, payload) => {
      pushSent = true
      sentUserIds = userIds
      return { deliveredCount: userIds.length, failedCount: 0 }
    }

    try {
      const res = await billingService.createInvoice({
        studentId: 'stu-1',
        programName: 'Reguler SMA - Semester Genap',
        amount: 750000,
        dueDate: '2026-11-10',
        description: 'Tagihan SPP November 2026',
      })

      expect(res.success).toBe(true)
      expect(pushSent).toBe(true)
      // Harus mencakup ID siswa atau profileId siswa
      expect(
        sentUserIds.some(
          (id) =>
            id === 'd992d9fc-6f5b-434f-998b-358e54a754b7' ||
            id === '943d2c13-0a7f-4e5d-b00d-a930e5bbbfdc'
        )
      ).toBe(true)
    } finally {
      pushNotificationService.sendToUsers = originalSend
    }
  }, 15000)

  it('3. saat verifikasi pembayaran SPP, push notification harus dikirim ke penerima target', async () => {
    const invRes = await billingService.createInvoice({
      studentId: 'stu-1',
      programName: 'Reguler SMA - Ujian',
      amount: 500000,
      dueDate: '2026-11-10',
    })

    expect(invRes.success).toBe(true)
    if (!invRes.success) throw new Error(invRes.error)
    const invoiceId = invRes.data.id

    let sentUserIds: string[] = []
    const originalSend = pushNotificationService.sendToUsers.bind(pushNotificationService)
    pushNotificationService.sendToUsers = async (userIds) => {
      sentUserIds = userIds
      return { deliveredCount: userIds.length, failedCount: 0 }
    }

    try {
      const verifyRes = await billingService.verifyPayment(invoiceId, {
        verifiedByName: 'Hj. Nuraini, S.Pd',
      })
      expect(verifyRes.success).toBe(true)

      // Pastikan target dikirimkan ke student ID / profile ID
      expect(
        sentUserIds.some(
          (id) =>
            id === 'd992d9fc-6f5b-434f-998b-358e54a754b7' ||
            id === '943d2c13-0a7f-4e5d-b00d-a930e5bbbfdc'
        )
      ).toBe(true)
    } finally {
      pushNotificationService.sendToUsers = originalSend
    }
  }, 15000)
})
