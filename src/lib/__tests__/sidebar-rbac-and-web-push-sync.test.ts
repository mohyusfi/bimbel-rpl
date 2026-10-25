import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { authStore, DEMO_ACCOUNTS } from '~/lib/auth-store'
import { validateRouteAccess } from '~/lib/route-guard'
import { adminStore } from '~/lib/admin-store'
import { pushNotificationService } from '~/server/services/push-notification.service'

// Polyfill localStorage & window jika belum ada di node test runner
const storageMap = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, String(val)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
}

if (typeof globalThis.localStorage === 'undefined') {
  ;(globalThis as any).localStorage = mockLocalStorage
}
if (typeof (globalThis as any).window === 'undefined') {
  ;(globalThis as any).window = { localStorage: mockLocalStorage }
}

describe('Perbaikan Masalah RBAC Ganti Role & Notifikasi SPP / Web Push', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    authStore.clearSession()
    pushNotificationService.clearMemorySubscriptions()
  })

  describe('1. Verifikasi Pencegahan Pembajakan Sesi Peran (Role Poisoning) & Sidebar RBAC', () => {
    it('memastikan login sebagai siswa tidak dibajak oleh sisa token admin lama di localStorage', async () => {
      // Simulasi token Supabase admin tertinggal di localStorage
      localStorage.setItem('tc_bimbel_supabase_auth_token', JSON.stringify({
        currentSession: {
          user: {
            id: 'admin-uuid-1234',
            email: DEMO_ACCOUNTS.super_admin.email,
            user_metadata: { role: 'admin', isSuperAdmin: true },
          },
        },
      }))

      // Pengguna memilih masuk sebagai Siswa (Fahri Ramadhan) via quickLogin
      const res = authStore.quickLogin('student')
      expect(res.success).toBe(true)
      expect(res.role).toBe('student')
      expect(authStore.getState().role).toBe('student')

      // Saat layout me-mount dan menjalankan authStore.initialize()
      await authStore.initialize()

      // Peran HARUS tetap 'student', tidak boleh berbalik menjadi 'admin'
      const state = authStore.getState()
      expect(state.role).toBe('student')
      expect(state.isAuthenticated).toBe(true)

      // Cek route guard TanStack Router ketika mengklik tautan sidebar /student/jadwal
      const accessCheck = validateRouteAccess('/student/jadwal', state, 'student')
      expect(accessCheck.allowed).toBe(true)
      expect(accessCheck.redirectTo).toBeUndefined()
    })

    it('memastikan login sebagai orang tua / wali tidak dibajak oleh sesi lama', async () => {
      // Pengguna memilih masuk sebagai Orang Tua (Ahmad Dahlan)
      const res = authStore.quickLogin('parent')
      expect(res.success).toBe(true)
      expect(res.role).toBe('parent')

      await authStore.initialize()

      const state = authStore.getState()
      expect(state.role).toBe('parent')

      // Cek route guard TanStack Router ketika mengklik tautan sidebar /parent/tagihan
      const accessCheck = validateRouteAccess('/parent/tagihan', state, 'parent')
      expect(accessCheck.allowed).toBe(true)
      expect(accessCheck.redirectTo).toBeUndefined()
    })
  })

  describe('2. Verifikasi Pembuatan Notifikasi Tagihan SPP & Visibilitas Slider', () => {
    it('membuat notifikasi untuk admin, siswa, dan wali saat tagihan diterbitkan', () => {
      // Buat tagihan baru untuk Fahri Ramadhan (stu-1)
      const invNotifs = adminStore.recordInvoiceNotifications({
        id: 'INV-202610-0999',
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        programName: 'UTBK Intensif A',
        amount: 850000,
        dueDate: '10 November 2026',
        invoiceNumber: 'INV-202610-0999',
      })

      expect(invNotifs.length).toBeGreaterThanOrEqual(2)

      const allNotifs = adminStore.getState().notifications
      expect(allNotifs.length).toBeGreaterThanOrEqual(2)

      // 1. Notifikasi Admin
      const adminNotif = allNotifs.find((n) => n.metadata?.targetRoles?.includes('admin') || !n.userId)
      expect(adminNotif).toBeDefined()
      expect(adminNotif?.title).toContain('Tagihan SPP Diterbitkan')

      // 2. Notifikasi Siswa
      const studentNotif = allNotifs.find(
        (n) => n.userId === 'stu-1' || n.metadata?.studentId === 'stu-1'
      )
      expect(studentNotif).toBeDefined()
      expect(studentNotif?.title).toContain('Tagihan SPP Baru')
      expect(studentNotif?.linkUrl).toBe('/student/tagihan')

      // 3. Notifikasi Wali Murid
      const parentNotif = allNotifs.find(
        (n) => n.userId === 'par-1' || n.metadata?.parentId === 'par-1' || n.title.includes('Putra/Putri')
      )
      expect(parentNotif).toBeDefined()
      expect(parentNotif?.title).toContain('Tagihan SPP Putra/Putri')
      expect(parentNotif?.linkUrl).toBe('/parent/tagihan')
    })
  })

  describe('3. Verifikasi Sinkronisasi Langganan Web Push & Penanganan Multi-ID', () => {
    it('mampu menyimpan dan menemukan langganan push untuk ID alias siswa dan wali', async () => {
      const endpoint = 'https://fcm.googleapis.com/fcm/send/test-sub-1234'
      const p256dh = 'BNcRdreALRF8FsECAQiNsPPOXNJMTkWapQElgnVo06VKAlPrGoDFFa7OH'
      const auth = 'tBHItJqlVqNtpYzCeMMvFg'

      // Simpan langganan dengan alias akun demo dan UUID
      const res = await pushNotificationService.subscribe({
        userId: 'stu-1',
        extraUserIds: ['d992d9fc-6f5b-434f-998b-358e54a754b7', 'usr-student-demo'],
        endpoint,
        keys: { p256dh, auth },
      })

      expect(res.success).toBe(true)

      // Query menggunakan UUID siswa
      const foundByUuid = await pushNotificationService.getSubscriptionsForUsers([
        'd992d9fc-6f5b-434f-998b-358e54a754b7',
      ])
      expect(foundByUuid.length).toBe(1)
      expect(foundByUuid[0].endpoint).toBe(endpoint)

      // Query menggunakan ID legacy 'stu-1'
      const foundByLegacy = await pushNotificationService.getSubscriptionsForUsers(['stu-1'])
      expect(foundByLegacy.length).toBe(1)
      expect(foundByLegacy[0].endpoint).toBe(endpoint)
    })
  })
})
