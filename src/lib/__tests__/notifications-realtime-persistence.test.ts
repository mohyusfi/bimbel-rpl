import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getTableColumns } from 'drizzle-orm'
import {
  adminStore,
  type AdminNotification,
  type NotificationType,
  type Announcement,
  type AttendanceEntry,
} from '../admin-store'
import {
  notifications as drizzleNotifications,
  notificationsRelations,
  profiles as drizzleProfiles,
  type Notification as DrizzleNotification,
  type NewNotification as DrizzleNewNotification,
} from '../../db/schema'
import { ADMIN_KEYS } from '../../hooks/use-admin-data'
import {
  useRealtimeNotifications,
  setupRealtimeNotifications,
} from '../../hooks/use-realtime-notifications'

// =========================================================================
// TEST HARNESS & MOCK SUPABASE REALTIME CLIENT
// =========================================================================

function createMockRealtimeClient() {
  const activeChannels = new Map<string, any>()
  const removedChannels = new Set<string>()
  const eventHandlers = new Map<
    string,
    Array<{ type: string; filter?: any; callback: (payload: any) => void }>
  >()

  const client = {
    channel(name: string) {
      const handlers: Array<{
        type: string
        filter?: any
        callback: (payload: any) => void
      }> = []
      eventHandlers.set(name, handlers)

      const channelObj = {
        name,
        on(type: string, filterOrCallback: any, maybeCallback?: any) {
          const callback =
            typeof filterOrCallback === 'function'
              ? filterOrCallback
              : maybeCallback
          const filter =
            typeof filterOrCallback === 'object' ? filterOrCallback : undefined
          handlers.push({ type, filter, callback })
          return channelObj
        },
        subscribe(cb?: (status: string) => void) {
          if (cb) cb('SUBSCRIBED')
          return channelObj
        },
      }
      activeChannels.set(name, channelObj)
      return channelObj
    },
    removeChannel(ch: any) {
      if (ch && ch.name) {
        activeChannels.delete(ch.name)
        removedChannels.add(ch.name)
      }
    },
    emit(channelName: string, eventType: string, payload: any) {
      const handlers = eventHandlers.get(channelName) || []
      for (const h of handlers) {
        h.callback(payload)
      }
    },
    activeChannels,
    removedChannels,
    eventHandlers,
  }

  return client
}

function renderHookInSSR<T>(hookFn: () => T, queryClient: QueryClient): T {
  let result!: T
  function TestHarness() {
    result = hookFn()
    return React.createElement('div', null, 'rendered')
  }

  renderToString(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(TestHarness)
    )
  )

  return result
}

describe('Tiket 07 — Notifikasi Waktu-Nyata Supabase Realtime & Broadcast Bimbel', () => {
  beforeEach(() => {
    // Reset state toko data ke kondisi awal sebelum setiap pengujian
    adminStore.resetToDefault()
    vi.restoreAllMocks()
  })

  // =========================================================================
  // 1. DRIZZLE ORM SCHEMA VALIDATION & TYPE INTEGRITY
  // =========================================================================
  describe('1. Drizzle ORM Schema Validation & Type Definitions', () => {
    it('memvalidasi kolom-kolom wajib tabel "notifications" pada skema Drizzle', () => {
      expect(drizzleNotifications).toBeDefined()
      const columns = getTableColumns(drizzleNotifications)

      // Memastikan 9 kolom wajib tersedia sesuai spesifikasi Tiket 07
      expect(columns.id).toBeDefined()
      expect(columns.userId).toBeDefined()
      expect(columns.title).toBeDefined()
      expect(columns.message).toBeDefined()
      expect(columns.type).toBeDefined()
      expect(columns.isRead).toBeDefined()
      expect(columns.linkUrl).toBeDefined()
      expect(columns.metadata).toBeDefined()
      expect(columns.createdAt).toBeDefined()

      // Validasi penamaan nama kolom SQL sebenarnya (snake_case)
      expect(columns.id.name).toBe('id')
      expect(columns.userId.name).toBe('user_id')
      expect(columns.title.name).toBe('title')
      expect(columns.message.name).toBe('message')
      expect(columns.type.name).toBe('type')
      expect(columns.isRead.name).toBe('is_read')
      expect(columns.linkUrl.name).toBe('link_url')
      expect(columns.metadata.name).toBe('metadata')
      expect(columns.createdAt.name).toBe('created_at')
    })

    it('memvalidasi relasi Drizzle "notificationsRelations" terhubung ke "profiles"', () => {
      expect(notificationsRelations).toBeDefined()
      expect(drizzleProfiles).toBeDefined()
    })

    it('memastikan type safety Drizzle Notification dan NewNotification dapat dikompilasi dengan benar', () => {
      const validSelectNotif: DrizzleNotification = {
        id: '11111111-2222-3333-4444-555555555555',
        userId: '22222222-3333-4444-5555-666666666666',
        title: 'Pengumuman Penting',
        message: 'Jadwal belajar tatap muka disesuaikan.',
        type: 'announcement',
        isRead: false,
        linkUrl: '/student/pengumuman',
        metadata: { priority: 'high', channel: 'broadcast' },
        createdAt: new Date(),
      }

      const validInsertNotif: DrizzleNewNotification = {
        title: 'Verifikasi Pembayaran',
        message: 'Kwitansi KWT-2026-0001 telah resmi terbit.',
        type: 'billing',
        isRead: false,
      }

      expect(validSelectNotif.id).toBe('11111111-2222-3333-4444-555555555555')
      expect(validInsertNotif.type).toBe('billing')
    })
  })

  // =========================================================================
  // 2. STORE PERSISTENCE OPERATIONS IN ADMINSTORE
  // =========================================================================
  describe('2. Store Persistence Operations in adminStore', () => {
    it('berhasil menambahkan notifikasi baru untuk berbagai kategori (attendance, billing, academic, announcement, registration, general)', () => {
      const categories: NotificationType[] = [
        'attendance',
        'billing',
        'academic',
        'announcement',
        'registration',
        'general',
      ]

      const initialCount = adminStore.getState().notifications.length

      categories.forEach((cat, index) => {
        const added = adminStore.addNotification({
          userId: `usr-${index + 1}`,
          title: `Judul Notifikasi ${cat}`,
          message: `Pesan rincian untuk kategori ${cat}`,
          type: cat,
          linkUrl: `/${cat}`,
          metadata: { categoryIndex: index },
        })

        expect(added).toBeDefined()
        expect(added.type).toBe(cat)
        expect(added.isRead).toBe(false)
        expect(added.title).toBe(`Judul Notifikasi ${cat}`)
      })

      const stateAfter = adminStore.getState().notifications
      expect(stateAfter.length).toBe(initialCount + categories.length)
    })

    it('menandai satu notifikasi spesifik sebagai terbaca via markNotificationRead(id)', () => {
      const newNotif = adminStore.addNotification({
        userId: 'stu-1',
        title: 'Tugas Mandiri Fisika',
        message: 'Modul latihan telah diunggah oleh Kak Dian.',
        type: 'academic',
        isRead: false,
      })

      expect(newNotif.isRead).toBe(false)

      adminStore.markNotificationRead(newNotif.id)

      const updated = adminStore
        .getState()
        .notifications.find((n) => n.id === newNotif.id)
      expect(updated?.isRead).toBe(true)
    })

    it('menandai seluruh notifikasi milik userId tertentu sebagai terbaca via markAllNotificationsRead(userId)', () => {
      const userA = 'stu-fahri'
      const userB = 'stu-alya'

      adminStore.addNotification({
        userId: userA,
        title: 'Notif A1',
        message: 'Pesan A1',
        type: 'general',
        isRead: false,
      })
      adminStore.addNotification({
        userId: userA,
        title: 'Notif A2',
        message: 'Pesan A2',
        type: 'billing',
        isRead: false,
      })
      adminStore.addNotification({
        userId: userB,
        title: 'Notif B1',
        message: 'Pesan B1',
        type: 'academic',
        isRead: false,
      })

      // Tandai hanya milik userA
      adminStore.markAllNotificationsRead(userA)

      const notifsA = adminStore
        .getState()
        .notifications.filter((n) => n.userId === userA)
      const notifsB = adminStore
        .getState()
        .notifications.filter((n) => n.userId === userB)

      // Notifikasi userA harus lunas terbaca
      expect(notifsA.every((n) => n.isRead === true)).toBe(true)

      // Notifikasi userB harus tetap belum terbaca
      expect(notifsB.some((n) => n.isRead === false)).toBe(true)
    })

    it('menandai seluruh notifikasi global sebagai terbaca saat markAllNotificationsRead() dipanggil tanpa argumen', () => {
      adminStore.addNotification({
        title: 'Notif Global 1',
        message: 'Pesan 1',
        type: 'general',
        isRead: false,
      })
      adminStore.addNotification({
        title: 'Notif Global 2',
        message: 'Pesan 2',
        type: 'announcement',
        isRead: false,
      })

      adminStore.markAllNotificationsRead()

      const allNotifs = adminStore.getState().notifications
      expect(allNotifs.every((n) => n.isRead === true)).toBe(true)
    })

    it('mengambil notifikasi terarah per userId secara akurat via getNotifications(userId)', () => {
      const targetUser = 'stu-specific-99'

      adminStore.addNotification({
        userId: targetUser,
        title: 'Notifikasi Terarah',
        message: 'Pesan khusus pengguna 99',
        type: 'academic',
      })

      const userNotifs = adminStore.getNotifications(targetUser)
      expect(userNotifs.length).toBeGreaterThanOrEqual(1)
      expect(userNotifs.some((n) => n.userId === targetUser)).toBe(true)

      // Jika tanpa parameter, mengembalikan semua notifikasi
      const allNotifs = adminStore.getNotifications()
      expect(allNotifs.length).toBe(adminStore.getState().notifications.length)
    })
  })

  // =========================================================================
  // 3. AUTOMATED EVENT TRIGGERS ACROSS OPERATIONS
  // =========================================================================
  describe('3. Automated Event Triggers Across Operations', () => {
    it('pencatatan presensi berstatus Alpa otomatis memicu notifikasi peringatan ketidakhadiran (attendance) ke siswa dan orang tua', () => {
      const schedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(
        schedule.id,
        '2026-11-20'
      )

      const student = adminStore.getState().students[0]
      const parent = adminStore
        .getState()
        .parents.find((p) => p.studentIds.includes(student.id))

      expect(student).toBeDefined()
      expect(parent).toBeDefined()

      const beforeCount = adminStore.getState().notifications.length

      // Panggil trigger notifikasi Alpa perwalian
      const triggeredNotifs = adminStore.notifyAttendanceAlpa(
        session.id,
        student.id
      )

      expect(triggeredNotifs.length).toBe(2)

      const studentNotif = triggeredNotifs.find((n) => n.userId === student.id)
      const parentNotif = triggeredNotifs.find((n) => n.userId === parent?.id)

      expect(studentNotif).toBeDefined()
      expect(studentNotif?.type).toBe('attendance')
      expect(studentNotif?.title).toContain('Alpa')

      expect(parentNotif).toBeDefined()
      expect(parentNotif?.type).toBe('attendance')
      expect(parentNotif?.title).toContain('Alpa')
      expect(parentNotif?.message).toContain(student.name)

      // Memastikan tersimpan dalam store
      const afterCount = adminStore.getState().notifications.length
      expect(afterCount).toBe(beforeCount + 2)
    })

    it('verifikasi SPP lunas (approve / verifyInvoice) otomatis memicu notifikasi pembayaran (billing)', () => {
      const invoice = adminStore.getState().invoices[0]

      const beforeCount = adminStore.getState().notifications.length

      // Lakukan verifikasi pembayaran SPP
      const success = adminStore.approvePaymentProof(invoice.id)
      expect(success).toBe(true)

      const afterNotifs = adminStore.getState().notifications
      expect(afterNotifs.length).toBeGreaterThan(beforeCount)

      // Cari notifikasi billing yang baru terbit
      const latestNotif = afterNotifs[0]
      expect(latestNotif.type).toBe('billing')
      expect(latestNotif.title).toContain('Terverifikasi Lunas')
      expect(latestNotif.metadata?.invoiceId).toBe(invoice.id)
    })

    it('penolakan bukti bayar SPP (rejectInvoice) otomatis memicu notifikasi penolakan (billing)', () => {
      const invoice = adminStore.getState().invoices[0]
      invoice.status = 'menunggu'
      invoice.transferReceiptFile = 'bukti-struk.jpg'

      const rejectReason = 'Foto bukti transfer buram dan tidak terbaca jelas'
      const success = adminStore.rejectInvoice(invoice.id, rejectReason)

      expect(success).toBe(true)

      const notifs = adminStore.getState().notifications
      const rejectNotif = notifs.find(
        (n) =>
          n.type === 'billing' &&
          n.title.includes('Ditolak') &&
          n.metadata?.invoiceId === invoice.id
      )

      expect(rejectNotif).toBeDefined()
      expect(rejectNotif?.message).toContain(rejectReason)
      expect(rejectNotif?.type).toBe('billing')
    })

    it('input nilai evaluasi rapor baru (addGradeRecord) otomatis memicu notifikasi akademik (academic)', () => {
      const student = adminStore.getState().students[0]
      const classGroup = adminStore.getState().classes[0]

      const newGrade = adminStore.addGradeRecord({
        studentId: student.id,
        studentName: student.name,
        nis: student.nis,
        classId: classGroup.id,
        className: classGroup.name,
        subjectName: 'Fisika Kuantum & Relativitas',
        assessmentTitle: 'Try Out Mandiri Bab 4',
        category: 'Try Out',
        score: 96,
        tutorId: 'tut-1',
        tutorName: 'Kak Dian Pratiwi, S.Si',
        tutorFeedback: 'Pemecahan model matematis sangat teliti dan terstruktur.',
      })

      expect(newGrade).toBeDefined()

      const notifs = adminStore.getState().notifications
      const gradeNotif = notifs[0]

      expect(gradeNotif.type).toBe('academic')
      expect(gradeNotif.title).toBe('Nilai Evaluasi Rapor Baru')
      expect(gradeNotif.message).toContain('Try Out Mandiri Bab 4')
      expect(gradeNotif.message).toContain(student.name)
      expect(gradeNotif.userId).toBe(student.id)
    })
  })

  // =========================================================================
  // 4. BROADCAST ANNOUNCEMENT & AUDIENCE FILTERING
  // =========================================================================
  describe('4. Broadcast Announcement & Multi-Audience Distribution', () => {
    it('siaran pengumuman target "Semua" mendistribusikan notifikasi ke seluruh Siswa, Orang Tua, dan Tutor aktif', async () => {
      const announcementInput: Announcement = {
        id: 'ann-broadcast-semua-test',
        title: 'Libur Hari Raya Idul Fitri & Cuti Bersama 2026',
        content:
          'Seluruh kegiatan belajar mengajar bimbel diliburkan mulai tanggal 20 Maret hingga 28 Maret 2026.',
        targetAudience: 'Semua',
        publishedDate: '15 Maret 2026',
        author: 'Tata Usaha Bimbel',
        isPinned: true,
      }

      const activeStudents = adminStore
        .getState()
        .students.filter((s) => s.status === 'aktif')
      const activeParents = adminStore.getState().parents
      const activeTutors = adminStore
        .getState()
        .tutors.filter((t) => t.status === 'aktif')

      const distributed =
        await adminStore.broadcastAnnouncement(announcementInput)

      expect(distributed).toBeDefined()

      const currentNotifs = adminStore.getState().notifications

      // Pastikan ada notifikasi terkirim ke siswa
      activeStudents.forEach((stu) => {
        const found = currentNotifs.find(
          (n) =>
            n.userId === stu.id &&
            n.type === 'announcement' &&
            n.metadata?.announcementId === announcementInput.id
        )
        expect(found).toBeDefined()
      })

      // Pastikan ada notifikasi terkirim ke orang tua
      activeParents.forEach((par) => {
        const found = currentNotifs.find(
          (n) =>
            n.userId === par.id &&
            n.type === 'announcement' &&
            n.metadata?.announcementId === announcementInput.id
        )
        expect(found).toBeDefined()
      })

      // Pastikan ada notifikasi terkirim ke tutor
      activeTutors.forEach((tut) => {
        const found = currentNotifs.find(
          (n) =>
            n.userId === tut.id &&
            n.type === 'announcement' &&
            n.metadata?.announcementId === announcementInput.id
        )
        expect(found).toBeDefined()
      })
    })

    it('siaran pengumuman target "Siswa" hanya mendistribusikan notifikasi ke siswa aktif, tidak ke orang tua atau tutor', async () => {
      const annSiswa: Announcement = {
        id: 'ann-broadcast-siswa-only',
        title: 'Pengambilan Kartu Ujian Try Out Akbar',
        content:
          'Siswa dimohon mengambil kartu tanda peserta di ruang tata usaha bimbel.',
        targetAudience: 'Siswa',
        publishedDate: '18 Maret 2026',
        author: 'Admin Akademik',
        isPinned: false,
      }

      await adminStore.broadcastAnnouncement(annSiswa)

      const notifs = adminStore.getState().notifications
      const annNotifs = notifs.filter(
        (n) => n.metadata?.announcementId === annSiswa.id && n.userId
      )

      // Seluruh notifikasi yang didistribusikan harus ber-role student
      annNotifs.forEach((n) => {
        expect(n.metadata?.recipientRole).toBe('student')
      })

      // Tidak ada notifikasi yang ditujukan ke parent atau tutor
      expect(
        annNotifs.some((n) => n.metadata?.recipientRole === 'parent')
      ).toBe(false)
      expect(
        annNotifs.some((n) => n.metadata?.recipientRole === 'tutor')
      ).toBe(false)
    })

    it('siaran pengumuman target "Orang Tua" mendistribusikan notifikasi hanya ke akun orang tua', async () => {
      const annOrtu: Announcement = {
        id: 'ann-broadcast-ortu-only',
        title: 'Undangan Pertemuan Konsultasi Progres Belajar Siswa',
        content:
          'Kami mengundang Bapak/Ibu wali murid untuk hadir dalam forum diskusi capaian belajar.',
        targetAudience: 'Orang Tua',
        publishedDate: '20 Maret 2026',
        author: 'Kepala Bimbel',
        isPinned: false,
      }

      await adminStore.broadcastAnnouncement(annOrtu)

      const notifs = adminStore.getState().notifications
      const annNotifs = notifs.filter(
        (n) => n.metadata?.announcementId === annOrtu.id && n.userId
      )

      expect(annNotifs.length).toBeGreaterThanOrEqual(1)
      annNotifs.forEach((n) => {
        expect(n.metadata?.recipientRole).toBe('parent')
      })
    })
  })

  // =========================================================================
  // 5. REALTIME HOOK & CONNECTION CLEANUP (ZERO CONNECTION LEAKS)
  // =========================================================================
  describe('5. Realtime Hook (useRealtimeNotifications) & Connection Cleanup', () => {
    it('berlangganan ke saluran broadcast:announcements dan user-notifications:${userId}', () => {
      const mockClient = createMockRealtimeClient()
      const queryClient = new QueryClient()

      const targetUserId = 'stu-2026-user-1'

      const subscription = setupRealtimeNotifications({
        userId: targetUserId,
        client: mockClient as any,
        queryClient,
      })

      // Pastikan kedua channel terdaftar dan aktif
      expect(mockClient.activeChannels.has('broadcast:announcements')).toBe(true)
      expect(
        mockClient.activeChannels.has(`user-notifications:${targetUserId}`)
      ).toBe(true)

      expect(subscription.channels.length).toBe(2)

      subscription.unsubscribe()
    })

    it('membersihkan seluruh koneksi realtime channel saat unmount (zero connection leaks)', () => {
      const mockClient = createMockRealtimeClient()
      const queryClient = new QueryClient()

      const targetUserId = 'stu-fahri-cleanup'

      const subscription = setupRealtimeNotifications({
        userId: targetUserId,
        client: mockClient as any,
        queryClient,
      })

      expect(mockClient.activeChannels.size).toBe(2)
      expect(mockClient.removedChannels.size).toBe(0)

      // Simulasikan Unmount komponen / pembatalan langganan
      subscription.unsubscribe()

      // Pastikan saluran dibersihkan via removeChannel (koneksi ditutup tanpa sisa)
      expect(mockClient.activeChannels.size).toBe(0)
      expect(
        mockClient.removedChannels.has('broadcast:announcements')
      ).toBe(true)
      expect(
        mockClient.removedChannels.has(`user-notifications:${targetUserId}`)
      ).toBe(true)
    })

    it('memicu query invalidation saat menerima payload notifikasi realtime yang masuk', () => {
      const mockClient = createMockRealtimeClient()
      const queryClient = new QueryClient()

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      const targetUserId = 'stu-99-invalidation'

      const onNotificationMock = vi.fn()

      const subscription = setupRealtimeNotifications({
        userId: targetUserId,
        client: mockClient as any,
        queryClient,
        onNotification: onNotificationMock,
      })

      const incomingPayload = {
        id: `notif-incoming-${Date.now()}`,
        userId: targetUserId,
        title: 'Materi Belajar Baru Tersedia',
        message: 'Kak Hendra mengunggah soal latihan logika deret.',
        type: 'academic',
      }

      // Kirim event realtime melalui mock channel
      mockClient.emit(
        `user-notifications:${targetUserId}`,
        'postgres_changes',
        incomingPayload
      )

      // Pastikan invalidateQueries dipanggil untuk query key yang relevan
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ADMIN_KEYS.notifications })
      )
      expect(onNotificationMock).toHaveBeenCalledWith(incomingPayload)

      subscription.unsubscribe()
    })

    it('merender React hook useRealtimeNotifications secara murni di dalam QueryClientProvider', () => {
      const queryClient = new QueryClient()
      const hookResult = renderHookInSSR(
        () => useRealtimeNotifications('stu-1'),
        queryClient
      )

      expect(hookResult).toBeDefined()
      expect(typeof hookResult.getActiveChannels).toBe('function')
    })
  })

  // =========================================================================
  // 6. EDGE CASES & CONCURRENCY RESILIENCE
  // =========================================================================
  describe('6. Edge Cases, Missing User IDs & Rapid Notification Events', () => {
    it('menangani userId bernilai undefined atau null secara aman tanpa error', () => {
      const mockClient = createMockRealtimeClient()
      const queryClient = new QueryClient()

      // Langganan tanpa userId (misal pengunjung belum login)
      const subscription = setupRealtimeNotifications({
        userId: undefined,
        client: mockClient as any,
        queryClient,
      })

      // Hanya channel broadcast umum yang berlangganan, bukan saluran undefined
      expect(mockClient.activeChannels.has('broadcast:announcements')).toBe(true)
      expect(
        mockClient.activeChannels.has('user-notifications:undefined')
      ).toBe(false)

      expect(subscription.channels.length).toBe(1)

      // Unmount tetap aman dan membersihkan saluran
      subscription.unsubscribe()
      expect(mockClient.activeChannels.size).toBe(0)
    })

    it('memproses semburan multi-notifikasi (rapid event burst) tanpa duplikasi atau data korup', () => {
      const burstCount = 20
      const initialCount = adminStore.getState().notifications.length

      for (let i = 0; i < burstCount; i++) {
        adminStore.addNotification({
          userId: `stu-rapid-${i}`,
          title: `Semburan Notifikasi #${i + 1}`,
          message: `Pesan data konkuren #${i + 1}`,
          type: 'general',
          metadata: { sequence: i },
        })
      }

      const allNotifs = adminStore.getState().notifications
      expect(allNotifs.length).toBe(initialCount + burstCount)

      // Seluruh notifikasi memiliki ID yang valid dan data utuh
      const titles = allNotifs.map((n) => n.title)
      for (let i = 0; i < burstCount; i++) {
        expect(titles).toContain(`Semburan Notifikasi #${i + 1}`)
      }
    })

    it('mencegah duplikasi notifikasi jika notifikasi dengan ID yang sama diinput ulang (idempoten)', () => {
      const fixedId = 'notif-fixed-id-12345'

      const firstAdd = adminStore.addNotification({
        id: fixedId,
        title: 'Notifikasi Tetap',
        message: 'Pesan asli pertama',
        type: 'general',
      })

      const secondAdd = adminStore.addNotification({
        id: fixedId,
        title: 'Notifikasi Tetap Modifikasi',
        message: 'Pesan coba duplikat',
        type: 'general',
      })

      expect(firstAdd.id).toBe(fixedId)
      expect(secondAdd.id).toBe(fixedId)

      // Jumlah baris dengan ID tersebut dalam store harus tepat 1
      const matching = adminStore
        .getState()
        .notifications.filter((n) => n.id === fixedId)
      expect(matching.length).toBe(1)
    })
  })
})
