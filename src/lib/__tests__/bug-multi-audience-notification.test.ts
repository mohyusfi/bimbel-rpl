/**
 * Regression test: Notifikasi pengumuman harus muncul di semua role
 * yang dipilih sebagai audiens, bukan hanya admin dan siswa.
 *
 * Bug: Saat admin membuat pengumuman untuk Siswa + Tutor + Orang Tua,
 * notifikasi hanya muncul di admin dan siswa. Tutor dan orang tua tidak menerima.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { adminStore } from '../admin-store'
import { ADMIN_KEYS } from '../../hooks/use-admin-data'
import { useRealtimeNotifications } from '../../hooks/use-realtime-notifications'

function renderHookSSR<T>(hookFn: () => T, queryClient: QueryClient): T {
  let result!: T
  function Harness() {
    result = hookFn()
    return React.createElement('div', null, null)
  }
  renderToString(
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(Harness)
    )
  )
  return result
}

describe('Bug: Pengumuman tidak muncul di semua audiens yang dipilih', () => {
  beforeEach(() => {
    adminStore.resetToDefault()
  })

  it('RED: Pengumuman targetAudience=Siswa harus muncul di siswa, bukan tutor/parent', () => {
    const ann = adminStore.addAnnouncement({
      title: 'PENGUMUMAN: SPP akan dinaikkan dalam waktu dekat',
      content: 'Harap persiapkan pembayaran SPP yang akan disesuaikan.',
      targetAudience: 'Siswa',
      isPinned: false,
    })

    const qc = new QueryClient()
    qc.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const studentHook = renderHookSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      qc
    )
    const tutorHook = renderHookSSR(
      () => useRealtimeNotifications({ userId: 'tut-1', role: 'tutor' }),
      qc
    )
    const parentHook = renderHookSSR(
      () => useRealtimeNotifications({ userId: 'par-1', role: 'parent' }),
      qc
    )
    const adminHook = renderHookSSR(
      () => useRealtimeNotifications({ userId: 'admin-1', role: 'admin' }),
      qc
    )

    const studentNotifs = studentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const tutorNotifs = tutorHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const parentNotifs = parentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const adminNotifs = adminHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )

    // Siswa harus menerima (targetAudience = Siswa)
    expect(studentNotifs.length).toBeGreaterThan(0)

    // Admin TIDAK menerima (targetAudience bukan Semua)
    expect(adminNotifs.length).toBe(0)

    // Tutor TIDAK menerima (targetAudience = Siswa, bukan Tutor)
    expect(tutorNotifs.length).toBe(0)

    // Orang Tua TIDAK menerima (targetAudience = Siswa, bukan Orang Tua)
    expect(parentNotifs.length).toBe(0)
  })

  it('RED: Pengumuman targetAudience=Tutor harus muncul di tutor saja', () => {
    const ann = adminStore.addAnnouncement({
      title: 'PENGUMUMAN: SPP akan dinaikkan dalam waktu dekat',
      content: 'Harap persiapkan pembayaran SPP yang akan disesuaikan.',
      targetAudience: 'Tutor',
      isPinned: false,
    })

    const qc = new QueryClient()
    qc.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const studentHook = renderHookSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      qc
    )
    const tutorHook = renderHookSSR(
      () => useRealtimeNotifications({ userId: 'tut-1', role: 'tutor' }),
      qc
    )
    const parentHook = renderHookSSR(
      () => useRealtimeNotifications({ userId: 'par-1', role: 'parent' }),
      qc
    )

    const studentNotifs = studentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const tutorNotifs = tutorHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const parentNotifs = parentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )

    // Tutor harus menerima
    expect(tutorNotifs.length).toBeGreaterThan(0)

    // Siswa dan Orang Tua TIDAK menerima
    expect(studentNotifs.length).toBe(0)
    expect(parentNotifs.length).toBe(0)
  })

  it('RED: Pengumuman targetAudience=Orang Tua harus muncul di parent saja', () => {
    const ann = adminStore.addAnnouncement({
      title: 'PENGUMUMAN: SPP akan dinaikkan dalam waktu dekat',
      content: 'Harap persiapkan pembayaran SPP yang akan disesuaikan.',
      targetAudience: 'Orang Tua',
      isPinned: false,
    })

    const qc = new QueryClient()
    qc.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const studentHook = renderHookSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      qc
    )
    const tutorHook = renderHookSSR(
      () => useRealtimeNotifications({ userId: 'tut-1', role: 'tutor' }),
      qc
    )
    const parentHook = renderHookSSR(
      () => useRealtimeNotifications({ userId: 'par-1', role: 'parent' }),
      qc
    )

    const studentNotifs = studentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const tutorNotifs = tutorHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )
    const parentNotifs = parentHook.notifications.filter(
      (n) => n.metadata?.announcementId === ann.id || n.id.includes(ann.id)
    )

    // Orang Tua harus menerima
    expect(parentNotifs.length).toBeGreaterThan(0)

    // Siswa dan Tutor TIDAK menerima
    expect(studentNotifs.length).toBe(0)
    expect(tutorNotifs.length).toBe(0)
  })
})
