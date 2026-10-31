import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
  useRouterState: () => '/admin',
}))

vi.mock('~/hooks/use-auth', () => ({
  useAuth: () => ({
    profile: null,
    user: null,
    studentProfile: null,
    parentProfile: null,
    children: [],
    isSuperAdmin: false,
  }),
}))

vi.mock('~/hooks/use-realtime-notifications', () => ({
  useRealtimeNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    refreshNotifications: vi.fn(),
  }),
}))

vi.mock('~/lib/auth-store', () => ({
  authStore: {
    syncAccountStatus: vi.fn().mockResolvedValue('aktif'),
    clearSession: vi.fn(),
  },
}))

import { DashboardShell } from '../DashboardShell'

describe('DashboardShell Layout Max-Width Suite', () => {
  it('membungkus children di dalam container max-w-[1240px] mx-auto di dalam elemen main', () => {
    const html = renderToString(
      <DashboardShell
        role="admin"
        portalName="Portal Administrasi"
        navGroups={[]}
        currentUser={{
          name: 'Admin Test',
          roleTitle: 'Staf Administrasi',
          initials: 'AT',
        }}
      >
        <div data-testid="dashboard-content">Konten Dashboard Uji</div>
      </DashboardShell>
    )

    // Memastikan elemen main ada
    expect(html).toContain('<main')

    // Memastikan ada pembatas max-w-[1240px] dan mx-auto
    expect(html).toContain('max-w-[1240px]')
    expect(html).toContain('mx-auto')

    // Memastikan konten children dirender di dalamnya
    expect(html).toContain('Konten Dashboard Uji')
  })
})
