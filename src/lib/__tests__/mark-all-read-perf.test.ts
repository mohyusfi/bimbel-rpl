import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { adminStore, type AdminNotification } from '~/lib/admin-store'
import { useRealtimeNotifications } from '~/hooks/use-realtime-notifications'
import { ADMIN_KEYS } from '~/hooks/use-admin-data'

vi.mock('~/server/functions/notification-inbox', () => ({
  markNotificationsReadFn: vi.fn().mockResolvedValue({ success: true, data: { count: 5 } }),
  getNotificationInboxFn: vi.fn().mockResolvedValue({ success: true, data: [] }),
}))

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

describe('markAllAsRead Performance & Optimistic Update Diagnosis', () => {
  beforeEach(() => {
    adminStore.getState().notifications = []
  })

  it('diagnoses store listener count during markAllAsRead', async () => {
    for (let i = 1; i <= 5; i++) {
      adminStore.addNotification({
        id: `notif-${i}`,
        userId: 'usr-perf-test',
        title: `Test Notif ${i}`,
        message: 'Deskripsi',
        type: 'general',
      })
    }

    const listenerSpy = vi.fn()
    const unsubscribe = adminStore.subscribe(listenerSpy)

    const queryClient = new QueryClient()
    queryClient.setQueryData<AdminNotification[]>(
      ADMIN_KEYS.notifications,
      [...adminStore.getState().notifications]
    )

    const hook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'usr-perf-test' }),
      queryClient
    )

    listenerSpy.mockClear()

    await hook.markAllAsRead()

    console.log(`[DIAGNOSIS] listenerSpy called count: ${listenerSpy.mock.calls.length}`)

    expect(listenerSpy.mock.calls.length).toBeLessThanOrEqual(1)

    unsubscribe()
  })

  it('updates cache optimistically without waiting for network refetch', async () => {
    for (let i = 1; i <= 3; i++) {
      adminStore.addNotification({
        id: `notif-opt-${i}`,
        userId: 'usr-opt-test',
        title: `Test Notif ${i}`,
        message: 'Deskripsi',
        type: 'general',
      })
    }

    const queryClient = new QueryClient()
    queryClient.setQueryData<AdminNotification[]>(
      ADMIN_KEYS.notifications,
      [...adminStore.getState().notifications]
    )

    const hook = renderHookInSSR(
      () => useRealtimeNotifications({ userId: 'usr-opt-test' }),
      queryClient
    )

    expect(hook.unreadCount).toBe(3)

    await hook.markAllAsRead()

    const cachedData = queryClient.getQueryData<AdminNotification[]>(ADMIN_KEYS.notifications)
    const allReadInCache = cachedData?.every((n) => n.isRead)

    console.log(`[DIAGNOSIS] allReadInCache immediately: ${allReadInCache}`)
    expect(allReadInCache).toBe(true)
  })
})
