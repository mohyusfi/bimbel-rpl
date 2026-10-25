import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { adminStore } from '../admin-store'
import { ADMIN_KEYS } from '../../hooks/use-admin-data'
import { useRealtimeNotifications } from '../../hooks/use-realtime-notifications'

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

describe('Notification Role & User Isolation (TDD Seam)', () => {
  beforeEach(() => {
    adminStore.resetToDefault()
    vi.restoreAllMocks()
  })

  it('1. Admin hanya menerima 1 notifikasi (bukan dobel) saat pengumuman diterbitkan untuk Semua', () => {
    const ann = adminStore.addAnnouncement({
      title: 'Simulasi UTBK Akbar 2026',
      content: 'Wajib diikuti oleh seluruh siswa.',
      targetAudience: 'Semua',
      isPinned: false,
    })

    const queryClient = new QueryClient()
    queryClient.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const adminHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'admin-1', role: 'admin' }),
      queryClient
    )

    // Filter notifikasi pengumuman ini di lonceng Admin
    const adminMatching = adminHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )

    // Harus tepat 1 notifikasi, tidak boleh dobel dengan notifikasi siswa/wali
    expect(adminMatching.length).toBe(1)
  })

  it('2. Siswa dan Orang Tua masing-masing menerima tepat 1 notifikasi mandiri', () => {
    const ann = adminStore.addAnnouncement({
      title: 'Sosialisasi CBT Siswa & Ortu',
      content: 'Sosialisasi aplikasi ujian berbasis komputer.',
      targetAudience: 'Semua',
      isPinned: false,
    })

    const queryClient = new QueryClient()
    queryClient.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const studentHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      queryClient
    )

    const studentMatching = studentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    expect(studentMatching.length).toBe(1)

    const parentHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'par-1', role: 'parent' }),
      queryClient
    )

    const parentMatching = parentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    expect(parentMatching.length).toBe(1)
  })

  it('3. Menandai notifikasi dibaca di Admin TIDAK mempengaruhi status notifikasi di Siswa atau Orang Tua', () => {
    const ann = adminStore.addAnnouncement({
      title: 'Pemberitahuan Libur Bersama',
      content: 'Kegiatan belajar diliburkan.',
      targetAudience: 'Semua',
      isPinned: false,
    })

    const queryClient = new QueryClient()
    queryClient.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const adminHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'admin-1', role: 'admin' }),
      queryClient
    )
    const studentHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      queryClient
    )
    const parentHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'par-1', role: 'parent' }),
      queryClient
    )

    // Sebelum dibaca oleh admin: semua belum dibaca
    const adminNotif = adminHook.notifications.find(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const studentNotifBefore = studentHook.notifications.find(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const parentNotifBefore = parentHook.notifications.find(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )

    expect(adminNotif?.isRead).toBe(false)
    expect(studentNotifBefore?.isRead).toBe(false)
    expect(parentNotifBefore?.isRead).toBe(false)

    // Admin membaca notifikasinya
    adminHook.markAsRead(adminNotif!.id)

    // Sinkronkan data store terbaru
    queryClient.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    // Render ulang hook untuk setiap role
    const adminHookAfter = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'admin-1', role: 'admin' }),
      queryClient
    )
    const studentHookAfter = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      queryClient
    )
    const parentHookAfter = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'par-1', role: 'parent' }),
      queryClient
    )

    const adminNotifAfter = adminHookAfter.notifications.find(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const studentNotifAfter = studentHookAfter.notifications.find(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const parentNotifAfter = parentHookAfter.notifications.find(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )

    // Notifikasi Admin sudah dibaca
    expect(adminNotifAfter?.isRead).toBe(true)

    // Notifikasi Siswa dan Orang Tua TETAP BELUM DIBACA
    expect(studentNotifAfter?.isRead).toBe(false)
    expect(parentNotifAfter?.isRead).toBe(false)
  })

  it('4. markAllAsRead di portal Siswa hanya menandai notifikasi Siswa, tidak menyentuh peran lain', () => {
    const ann = adminStore.addAnnouncement({
      title: 'Materi Tambahan Matematika',
      content: 'Silakan pelajari bab kalkulus.',
      targetAudience: 'Semua',
      isPinned: false,
    })

    const queryClient = new QueryClient()
    queryClient.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const studentHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      queryClient
    )

    // Siswa menandai semua notifikasinya dibaca
    studentHook.markAllAsRead()

    // Sinkronkan state
    queryClient.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const studentHookAfter = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      queryClient
    )
    const parentHookAfter = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'par-1', role: 'parent' }),
      queryClient
    )

    const studentNotif = studentHookAfter.notifications.find(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const parentNotif = parentHookAfter.notifications.find(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )

    expect(studentNotif?.isRead).toBe(true)
    expect(parentNotif?.isRead).toBe(false)
  })

  it('5. Pengumuman khusus Siswa muncul di drawer Siswa, namun TIDAK muncul di Admin, Orang Tua, atau Tutor', () => {
    const ann = adminStore.addAnnouncement({
      title: 'Persiapan Try Out Akbar SNBT',
      content: 'Unduh kartu peserta ujian di portal siswa.',
      targetAudience: 'Siswa',
      isPinned: false,
    })

    const queryClient = new QueryClient()
    queryClient.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const studentHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      queryClient
    )
    const adminHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'admin-1', role: 'admin' }),
      queryClient
    )
    const parentHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'par-1', role: 'parent' }),
      queryClient
    )
    const tutorHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'tut-1', role: 'tutor' }),
      queryClient
    )

    const studentNotifs = studentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const adminNotifs = adminHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const parentNotifs = parentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const tutorNotifs = tutorHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )

    // Siswa menerima tepat 1 notifikasi
    expect(studentNotifs.length).toBe(1)
    expect(studentNotifs[0].title).toBe('Persiapan Try Out Akbar SNBT')

    // Admin, Orang Tua, dan Tutor TIDAK menerima notifikasi ini sama sekali
    expect(adminNotifs.length).toBe(0)
    expect(parentNotifs.length).toBe(0)
    expect(tutorNotifs.length).toBe(0)
  })

  it('6. Pengumuman khusus Orang Tua muncul di drawer Orang Tua, namun tidak di Siswa atau Admin', () => {
    const ann = adminStore.addAnnouncement({
      title: 'Undangan Rapat Evaluasi Pembelajaran Semester',
      content: 'Diharapkan kehadiran Bapak/Ibu wali siswa di aula bimbel.',
      targetAudience: 'Orang Tua',
      isPinned: false,
    })

    const queryClient = new QueryClient()
    queryClient.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const parentHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'par-1', role: 'parent' }),
      queryClient
    )
    const studentHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      queryClient
    )
    const adminHook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'admin-1', role: 'admin' }),
      queryClient
    )

    const parentNotifs = parentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const studentNotifs = studentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const adminNotifs = adminHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )

    expect(parentNotifs.length).toBe(1)
    expect(studentNotifs.length).toBe(0)
    expect(adminNotifs.length).toBe(0)
  })
})
