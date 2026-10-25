/**
 * Regression test: Notifikasi Tagihan SPP harus muncul TEPAT SATU KALI di
 * portal masing-masing (admin, siswa, wali) dan tidak saling bocor.
 *
 * Bug (sebelum perbaikan):
 * - Admin membuat tagihan -> muncul 3x di siswa dan 3x di admin.
 * - Portal wali tidak menerima notifikasi sama sekali.
 *
 * Akar masalah:
 * 1. Filter peran mengabaikan `metadata.targetRoles`, sehingga salinan
 *    admin/siswa/wali (yang masing-masing menyimpan `metadata.studentId`)
 *    saling bocor. Cabang `role === 'admin'` meloloskan semua baris.
 * 2. Sumber store (realtime) dan kotak masuk database tidak di-dedup per
 *    `invoiceId`, sehingga satu peristiwa tercatat dua kali.
 * 3. `recordInvoiceNotifications` dipanggil dari beberapa lokasi dengan id
 *    non-deterministik sehingga penulisan berulang menumpuk.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { adminStore, type AdminNotification } from '../admin-store'
import { ADMIN_KEYS } from '../../hooks/use-admin-data'
import {
  useRealtimeNotifications,
  mergeNotificationSources,
} from '../../hooks/use-realtime-notifications'

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

const INVOICE_PAYLOAD = {
  id: 'INV-202611-9999',
  studentId: 'stu-1',
  studentName: 'Fahri Ramadhan',
  programName: 'Reguler SMA - Semester Genap',
  amount: 750000,
  dueDate: '2026-11-10',
  invoiceNumber: 'INV-202611-9999',
}

function visibleBilling(hook: { notifications: AdminNotification[] }) {
  return hook.notifications.filter((n) => n.type === 'billing')
}

describe('Regresi: Notifikasi Tagihan SPP tidak duplikat & tidak bocor antar peran', () => {
  beforeEach(() => {
    adminStore.resetToDefault()
  })

  it('penulisan berulang hanya menghasilkan satu notifikasi per peran (idempotent)', () => {
    adminStore.recordInvoiceNotifications(INVOICE_PAYLOAD)
    adminStore.recordInvoiceNotifications(INVOICE_PAYLOAD)
    adminStore.recordInvoiceNotifications({ ...INVOICE_PAYLOAD, studentId: 'd992d9fc-6f5b-434f-998b-358e54a754b7' })

    const billing = adminStore.getState().notifications.filter((n) => n.type === 'billing')
    expect(billing).toHaveLength(3)

    const roles = billing.map((n) => (n.metadata?.targetRoles as string[])?.join(',')).sort()
    expect(roles).toEqual(['admin', 'parent', 'student'])
  })

  it('admin/siswa/wali masing-masing melihat tepat satu notifikasi tagihan', () => {
    adminStore.recordInvoiceNotifications(INVOICE_PAYLOAD)
    adminStore.recordInvoiceNotifications(INVOICE_PAYLOAD)

    const queryClient = new QueryClient()
    queryClient.setQueryData(ADMIN_KEYS.notifications, adminStore.getState().notifications)

    const admin = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'admin-1', role: 'admin' }),
      queryClient
    )
    const student = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'stu-1', role: 'student' }),
      queryClient
    )
    const parent = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'par-1', role: 'parent' }),
      queryClient
    )

    expect(visibleBilling(admin)).toHaveLength(1)
    expect(visibleBilling(student)).toHaveLength(1)
    expect(visibleBilling(parent)).toHaveLength(1)

    expect(visibleBilling(admin)[0].title).toBe('Tagihan SPP Diterbitkan')
    expect(visibleBilling(student)[0].title).toBe('Tagihan SPP Baru')
    expect(visibleBilling(parent)[0].title).toBe('Tagihan SPP Putra/Putri')
  })

  it('mergeNotificationSources menyatukan baris store dan baris kotak masuk database untuk invoice+peran yang sama', () => {
    adminStore.recordInvoiceNotifications(INVOICE_PAYLOAD)
    const live = adminStore.getState().notifications.filter((n) => n.type === 'billing')

    const studentLive = live.find((n) =>
      (n.metadata?.targetRoles as string[])?.includes('student')
    )!
    const parentLive = live.find((n) =>
      (n.metadata?.targetRoles as string[])?.includes('parent')
    )!

    // Baris kotak masuk database: id UUID berbeda, peristiwa sama.
    const inbox: AdminNotification[] = [
      {
        ...studentLive,
        id: '11111111-1111-1111-1111-111111111111',
        metadata: { ...studentLive.metadata, targetRoles: ['student'] },
      } as AdminNotification,
      {
        ...parentLive,
        id: '22222222-2222-2222-2222-222222222222',
        metadata: { ...parentLive.metadata, targetRoles: ['parent'] },
      } as AdminNotification,
    ]

    const merged = mergeNotificationSources(inbox, live)
    const billing = merged.filter((n) => n.type === 'billing')

    // admin + siswa + wali = 3, bukan 5
    expect(billing).toHaveLength(3)

    const studentRows = billing.filter((n) =>
      (n.metadata?.targetRoles as string[])?.includes('student')
    )
    expect(studentRows).toHaveLength(1)
    // Baris kotak masuk (persisten) yang dipertahankan.
    expect(studentRows[0].id).toBe('11111111-1111-1111-1111-111111111111')
  })
})
