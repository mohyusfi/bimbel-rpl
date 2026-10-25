import { describe, it, expect, beforeEach } from 'vitest'
import {
  adminStore,
  type AdminNotification,
  type Announcement,
  type AttendanceEntry,
} from '../admin-store'
import {
  notifications,
  profiles,
  notificationsRelations,
  profilesRelations,
  type Notification as DrizzleNotification,
  type NewNotification,
} from '../../db/schema'

describe('Tiket 07 — Notifikasi Waktu-Nyata (Supabase Realtime) & Broadcast Bimbel', () => {
  beforeEach(() => {
    adminStore.resetToDefault()
  })

  describe('1. Skema Database Drizzle & Type-Safety Notifikasi', () => {
    it('memastikan tabel Drizzle "notifications" memiliki struktur kolom dan tipe data yang benar', () => {
      expect(notifications).toBeDefined()
      expect(notifications.id).toBeDefined()
      expect(notifications.userId).toBeDefined()
      expect(notifications.title).toBeDefined()
      expect(notifications.message).toBeDefined()
      expect(notifications.type).toBeDefined()
      expect(notifications.isRead).toBeDefined()
      expect(notifications.linkUrl).toBeDefined()
      expect(notifications.metadata).toBeDefined()
      expect(notifications.createdAt).toBeDefined()
    })

    it('memastikan relasi Drizzle notificationsRelations terhubung dengan profiles', () => {
      expect(notificationsRelations).toBeDefined()
      expect(profilesRelations).toBeDefined()
    })

    it('mendukung deklarasi tipe TypeScript Notification dan NewNotification', () => {
      const mockNotif: DrizzleNotification = {
        id: '11111111-2222-3333-4444-555555555555',
        userId: '22222222-3333-4444-5555-666666666666',
        title: 'Judul Notifikasi',
        message: 'Pesan isi notifikasi bimbel',
        type: 'attendance',
        isRead: false,
        linkUrl: '/student/presensi',
        metadata: { key: 'value' },
        createdAt: new Date(),
      }

      const mockNewNotif: NewNotification = {
        userId: '22222222-3333-4444-5555-666666666666',
        title: 'Notifikasi Baru',
        message: 'Isi notifikasi',
        type: 'billing',
      }

      expect(mockNotif.type).toBe('attendance')
      expect(mockNewNotif.type).toBe('billing')
    })
  })

  describe('2. Store Method: addNotification', () => {
    it('menambahkan notifikasi baru ke antrean dengan id otomatis dan timestamp "Baru saja"', () => {
      const initialCount = adminStore.getState().notifications.length

      const added = adminStore.addNotification({
        userId: 'stu-1',
        title: 'Pemberitahuan Khusus',
        message: 'Bimbingan tambahan akan diadakan Sabtu ini.',
        type: 'general',
        linkUrl: '/jadwal',
        metadata: { source: 'tutor' },
      })

      expect(added.id).toBeDefined()
      expect(added.title).toBe('Pemberitahuan Khusus')
      expect(added.isRead).toBe(false)
      expect(added.timestamp).toBe('Baru saja')
      expect(added.userId).toBe('stu-1')
      expect(added.linkUrl).toBe('/jadwal')
      expect(added.metadata?.source).toBe('tutor')

      const stateNotifs = adminStore.getState().notifications
      expect(stateNotifs.length).toBe(initialCount + 1)
      expect(stateNotifs[0].id).toBe(added.id)
    })
  })

  describe('3. Store Method: broadcastAnnouncement', () => {
    it('menyiarkan pengumuman kepada target "Semua" ke seluruh siswa aktif, orang tua, dan tutor', () => {
      const activeStudents = adminStore.getState().students.filter((s) => s.status === 'aktif')
      const parents = adminStore.getState().parents
      const activeTutors = adminStore.getState().tutors.filter((t) => t.status === 'aktif')

      const initialCount = adminStore.getState().notifications.length

      const announcement: Announcement = {
        id: 'ann-test-semua',
        title: 'Libur Nasional Hari Raya',
        content: 'Seluruh kegiatan bimbingan belajar tatap muka diliburkan selama 2 hari.',
        targetAudience: 'Semua',
        publishedDate: '20 Oktober 2026',
        author: 'Tata Usaha',
        isPinned: true,
      }

      const broadcasted = adminStore.broadcastAnnouncement(announcement)
      expect(broadcasted.length).toBeGreaterThan(0)

      const afterNotifs = adminStore.getState().notifications
      expect(afterNotifs.length).toBeGreaterThan(initialCount)

      // Pastikan ada notifikasi untuk siswa aktif
      activeStudents.forEach((student) => {
        const found = afterNotifs.find((n) => n.userId === student.id && n.metadata?.announcementId === announcement.id)
        expect(found).toBeDefined()
        expect(found?.type).toBe('announcement')
      })

      // Pastikan ada notifikasi untuk orang tua
      parents.forEach((parent) => {
        const found = afterNotifs.find((n) => n.userId === parent.id && n.metadata?.announcementId === announcement.id)
        expect(found).toBeDefined()
        expect(found?.type).toBe('announcement')
      })

      // Pastikan ada notifikasi untuk tutor aktif
      activeTutors.forEach((tutor) => {
        const found = afterNotifs.find((n) => n.userId === tutor.id && n.metadata?.announcementId === announcement.id)
        expect(found).toBeDefined()
        expect(found?.type).toBe('announcement')
      })
    })

    it('menyiarkan pengumuman spesifik kepada target "Siswa" hanya ditujukan ke siswa aktif', () => {
      const announcement: Announcement = {
        id: 'ann-test-siswa',
        title: 'Try Out Akbar SNBT 2026',
        content: 'Try out perdana dimulai akhir pekan ini pukul 08:00 WITA.',
        targetAudience: 'Siswa',
        publishedDate: '20 Oktober 2026',
        author: 'Koordinator Akademik',
        isPinned: false,
      }

      adminStore.broadcastAnnouncement(announcement)
      const afterNotifs = adminStore.getState().notifications

      const targetNotifs = afterNotifs.filter((n) => n.metadata?.announcementId === 'ann-test-siswa')
      // Tidak boleh ada notifikasi untuk orang tua atau tutor
      const forTutors = targetNotifs.filter((n) => n.metadata?.recipientRole === 'tutor')
      const forParents = targetNotifs.filter((n) => n.metadata?.recipientRole === 'parent')
      expect(forTutors.length).toBe(0)
      expect(forParents.length).toBe(0)

      // Harus ada notifikasi untuk siswa
      const forStudents = targetNotifs.filter((n) => n.metadata?.recipientRole === 'student')
      expect(forStudents.length).toBeGreaterThan(0)
    })

    it('addAnnouncement secara otomatis mengeksekusi broadcastAnnouncement', () => {
      const newAnn = adminStore.addAnnouncement({
        title: 'Pengumuman Otomatis',
        content: 'Isi pengumuman yang otomatis disiarkan ke pengguna.',
        targetAudience: 'Orang Tua',
        isPinned: false,
      })

      const afterNotifs = adminStore.getState().notifications
      const matched = afterNotifs.find((n) => n.metadata?.announcementId === newAnn.id)
      expect(matched).toBeDefined()
      expect(matched?.type).toBe('announcement')
    })
  })

  describe('4. Event Trigger Presensi', () => {
    it('otomatis mendispatch notifikasi type "attendance" ke orang tua saat presensi disimpan', () => {
      const schedule = adminStore.getState().schedules[0]
      const session = adminStore.createSessionFromSchedule(schedule.id, '2026-11-20')

      const initialCount = adminStore.getState().notifications.length

      const entries: AttendanceEntry[] = [
        {
          studentId: 'stu-1',
          studentName: 'Fahri Ramadhan',
          nis: 'TC-2026-001',
          status: 'alpa',
          note: 'Tanpa keterangan',
        },
      ]

      adminStore.saveSessionAttendance(session.id, 'Materi Trigonometri', entries)

      const afterNotifs = adminStore.getState().notifications
      expect(afterNotifs.length).toBe(initialCount + 1)

      const latest = afterNotifs[0]
      expect(latest.type).toBe('attendance')
      expect(latest.title).toContain('Alpa')
      expect(latest.message).toContain('Fahri Ramadhan')
      expect(latest.message).toContain('Alpa')
      expect(latest.userId).toBe('par-1')
      expect(latest.metadata?.targetRoles).toContain('parent')
    })
  })

  describe('5. Event Trigger Verifikasi & Penolakan Tagihan SPP', () => {
    it('otomatis mendispatch notifikasi type "billing" saat pembayaran invoice diverifikasi Lunas', () => {
      const invoice = adminStore.getState().invoices.find((i) => i.status === 'menunggu')
      expect(invoice).toBeDefined()

      const initialCount = adminStore.getState().notifications.length
      const success = adminStore.verifyInvoice(invoice!.id)
      expect(success).toBe(true)

      const afterNotifs = adminStore.getState().notifications
      expect(afterNotifs.length).toBe(initialCount + 1)

      const latest = afterNotifs[0]
      expect(latest.type).toBe('billing')
      expect(latest.title).toContain('Terverifikasi Lunas')
      expect(latest.message).toContain('Pembayaran SPP')
      expect(latest.message).toContain('Terverifikasi Lunas')
      expect(latest.metadata?.invoiceId).toBe(invoice!.id)
    })

    it('otomatis mendispatch notifikasi type "billing" saat bukti pembayaran invoice ditolak', () => {
      const invoice = adminStore.getState().invoices.find((i) => i.status === 'menunggu')
      expect(invoice).toBeDefined()

      const initialCount = adminStore.getState().notifications.length
      const success = adminStore.rejectInvoice(invoice!.id, 'Struk transfer tidak terbaca jelas.')
      expect(success).toBe(true)

      const afterNotifs = adminStore.getState().notifications
      expect(afterNotifs.length).toBe(initialCount + 1)

      const latest = afterNotifs[0]
      expect(latest.type).toBe('billing')
      expect(latest.title).toBe('Bukti Pembayaran SPP Ditolak')
      expect(latest.message).toContain('Bukti Pembayaran SPP Ditolak')
      expect(latest.message).toContain('Struk transfer tidak terbaca jelas.')
      expect(latest.metadata?.rejectedReason).toBe('Struk transfer tidak terbaca jelas.')
    })
  })

  describe('6. Event Trigger Penambahan Nilai Evaluasi (addGradeRecord)', () => {
    it('memastikan notifikasi nilai rapor menggunakan type "academic"', () => {
      const initialCount = adminStore.getState().notifications.length

      adminStore.addGradeRecord({
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        classId: 'cls-1',
        className: 'UTBK Intensif A',
        subjectName: 'Fisika UTBK',
        assessmentTitle: 'Try Out Mandiri 1',
        category: 'Try Out',
        score: 88,
        tutorId: 'tut-1',
        tutorName: 'Kak Dian Pratiwi, S.Si',
        tutorFeedback: 'Penguasaan konsep kinematika sangat baik.',
      })

      const afterNotifs = adminStore.getState().notifications
      expect(afterNotifs.length).toBe(initialCount + 1)

      const latest = afterNotifs[0]
      expect(latest.type).toBe('academic')
      expect(latest.title).toBe('Nilai Evaluasi Rapor Baru')
      expect(latest.message).toContain('Try Out Mandiri 1')
      expect(latest.message).toContain('88/100')
      expect(latest.userId).toBe('stu-1')
    })
  })

  describe('7. Store Method: markNotificationRead & markAllNotificationsRead', () => {
    it('markNotificationRead menandai satu notifikasi tertentu sebagai sudah dibaca', () => {
      const targetNotif = adminStore.getState().notifications[0]
      expect(targetNotif).toBeDefined()

      adminStore.markNotificationRead(targetNotif.id)

      const updated = adminStore.getState().notifications.find((n) => n.id === targetNotif.id)
      expect(updated?.isRead).toBe(true)
    })

    it('markAllNotificationsRead tanpa argumen menandai seluruh notifikasi sebagai sudah dibaca', () => {
      adminStore.markAllNotificationsRead()

      const notifs = adminStore.getState().notifications
      expect(notifs.every((n) => n.isRead)).toBe(true)
    })

    it('markAllNotificationsRead dengan userId hanya menandai notifikasi milik pengguna bersangkutan', () => {
      // Tambah notifikasi untuk stu-1 dan stu-2
      const notifStu1 = adminStore.addNotification({
        userId: 'stu-1',
        title: 'Notif Stu 1',
        message: 'Pesan untuk stu 1',
        type: 'general',
      })

      const notifStu2 = adminStore.addNotification({
        userId: 'stu-2',
        title: 'Notif Stu 2',
        message: 'Pesan untuk stu 2',
        type: 'general',
      })

      expect(notifStu1.isRead).toBe(false)
      expect(notifStu2.isRead).toBe(false)

      // Tandai hanya untuk stu-1
      adminStore.markAllNotificationsRead('stu-1')

      const found1 = adminStore.getState().notifications.find((n) => n.id === notifStu1.id)
      const found2 = adminStore.getState().notifications.find((n) => n.id === notifStu2.id)

      expect(found1?.isRead).toBe(true)
      expect(found2?.isRead).toBe(false)
    })
  })
})
