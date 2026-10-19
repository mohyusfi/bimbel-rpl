import * as React from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Dialog } from '@base-ui/react/dialog'
import {
  Menu,
  X,
  Bell,
  Globe,
  Clock,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRightLeft,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { SidebarBrand } from './SidebarBrand'
import { useAdminNotifications, useAdminMutations } from '~/hooks/use-admin-data'
import type { AdminNotification } from '~/lib/admin-store'

export interface DashboardNavItem {
  label: string
  href: string
  exact?: boolean
  icon: React.ComponentType<{ className?: string }>
  badgeCount?: number
  category?: string
}

export interface DashboardNavGroup {
  title: string
  items: DashboardNavItem[]
}

export interface DashboardShellProps {
  role: 'admin' | 'tutor' | 'student' | 'parent'
  portalName: string
  navGroups: DashboardNavGroup[]
  currentUser: {
    name: string
    roleTitle: string
    initials: string
  }
  topSlot?: React.ReactNode
  children: React.ReactNode
}

export function DashboardShell({
  role,
  portalName,
  navGroups,
  currentUser,
  topSlot,
  children,
}: DashboardShellProps) {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('tc_sidebar_collapsed') === 'true'
      } catch {
        return false
      }
    }
    return false
  })
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = React.useState(false)
  const [notifFilter, setNotifFilter] = React.useState<string>('ALL')

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('tc_sidebar_collapsed', String(next))
        } catch {
          // Ignore storage access restrictions
        }
      }
      return next
    })
  }, [])

  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: notifications = [] } = useAdminNotifications()
  const { markAllNotificationsRead, markNotificationRead } = useAdminMutations()

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length

  const allItems = React.useMemo(
    () => navGroups.flatMap((g) => g.items),
    [navGroups]
  )

  const isNavActive = (item: DashboardNavItem) => {
    if (item.exact) {
      return pathname === item.href || pathname === `${item.href}/`
    }
    return pathname.startsWith(item.href)
  }

  const activeItem =
    allItems.find((item) => isNavActive(item)) || allItems[0] || {
      label: 'Beranda',
      category: 'Utama',
    }

  const filteredNotifications = notifications.filter((notif) => {
    if (notifFilter === 'UNREAD') return !notif.isRead
    if (notifFilter === 'registration') return notif.type === 'registration'
    if (notifFilter === 'payment') return notif.type === 'payment'
    return true
  })

  return (
    <div className="min-h-screen bg-[#EEEEEE] text-[#000000] flex flex-col lg:flex-row font-sans print:hidden">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/55 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Desktop 264px (Collapsible) & Mobile Slide Drawer */}
      <aside
        aria-hidden={isSidebarCollapsed}
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-[#FFFFFF] border-r border-[#D2D2D2] flex flex-col justify-between shrink-0 transition-all duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen',
          isMobileMenuOpen ? 'translate-x-0 w-[264px] shadow-2xl' : '-translate-x-full w-[264px] lg:translate-x-0',
          isSidebarCollapsed
            ? 'lg:w-0 lg:border-r-0 lg:overflow-hidden lg:opacity-0 pointer-events-none lg:pointer-events-none'
            : 'lg:w-[264px] lg:opacity-100'
        )}
      >
        <div className="w-[264px] h-full flex flex-col justify-between shrink-0">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header Brand */}
            <div className="h-[60px] px-5 border-b border-[#D2D2D2] flex items-center justify-between shrink-0">
              <SidebarBrand role={role} portalName={portalName} />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#F6F6F6] rounded-[6px]"
                aria-label="Tutup menu navigasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          {/* Top Slot (e.g. Child Switcher on Parent Portal) */}
          {topSlot && (
            <div className="p-3 border-b border-[#D2D2D2] bg-[#F6F6F6]/50 shrink-0">
              {topSlot}
            </div>
          )}

          {/* Navigation Items */}
          <nav
            className="flex-1 px-3 py-4 space-y-5 overflow-y-auto"
            aria-label={`Navigasi ${portalName}`}
          >
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#555555] select-none">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const active = isNavActive(item)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      to={item.href as any}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'relative flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] transition-all select-none group',
                        active
                          ? 'bg-[#000000] text-[#FFFFFF] font-semibold'
                          : 'text-[#292524] font-medium hover:bg-[#F6F6F6] hover:text-[#000000]'
                      )}
                    >
                      {/* Crimson active indicator */}
                      {active && (
                        <span
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#CB2957]"
                          aria-hidden="true"
                        />
                      )}

                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            active
                              ? 'text-[#FFFFFF]'
                              : 'text-[#555555] group-hover:text-[#000000]'
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {Boolean(item.badgeCount && item.badgeCount > 0) && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full tabular-nums leading-none bg-[#CB2957] text-[#FFFFFF]">
                          {item.badgeCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="p-3.5 border-t border-[#D2D2D2] bg-[#F6F6F6]/70 shrink-0 space-y-2">
          <div className="flex items-center gap-3 px-2.5 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D2D2D2]">
            <div className="w-8 h-8 rounded-[6px] bg-[#000000] text-[#FFFFFF] flex items-center justify-center font-display font-bold text-xs shrink-0">
              {currentUser.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#000000] truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-[#555555] truncate mt-0.5 leading-tight">
                {currentUser.roleTitle}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#166534] shrink-0 select-none"
              title="Sesi Aktif"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
              <span>Aktif</span>
            </span>
          </div>

          <Link
            to="/masuk"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#555555] hover:text-[#000000] hover:bg-[#FFFFFF] border border-transparent hover:border-[#D2D2D2] rounded-[8px] transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Ganti Portal (Demo)</span>
          </Link>
        </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Topbar (60px) */}
        <header className="h-[60px] bg-[#FFFFFF] border-b border-[#D2D2D2] sticky top-0 z-30">
          <div className="h-full px-4 sm:px-6 lg:px-8 max-w-[1600px] w-full mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Mobile Drawer Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-[#292524] hover:text-[#000000] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[8px]"
                aria-label="Buka menu navigasi"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Desktop Collapsible Sidebar Toggle Button */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden lg:inline-flex items-center justify-center p-2 text-[#292524] hover:text-[#000000] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[8px] transition-colors cursor-pointer"
                aria-label={isSidebarCollapsed ? 'Tampilkan sidebar navigasi' : 'Sembunyikan sidebar navigasi'}
                title={isSidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeft className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>

            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs min-w-0"
            >
              <span className="text-[#555555] hidden sm:inline font-medium">
                {portalName}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#D2D2D2] hidden sm:inline shrink-0" />
              {activeItem.category && (
                <>
                  <span className="text-[#555555] hidden md:inline">
                    {activeItem.category}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#D2D2D2] hidden md:inline shrink-0" />
                </>
              )}
              <span className="font-semibold text-[#000000] truncate">
                {activeItem.label}
              </span>
            </nav>
          </div>

          {/* Right: WITA Timezone, Notifications, Public Site Link */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#555555] bg-[#F6F6F6] rounded-[8px] border border-[#D2D2D2]">
              <Clock className="w-3.5 h-3.5 text-[#292524]" />
              <span>WITA (UTC+8)</span>
            </div>

            <button
              type="button"
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#292524] hover:text-[#000000] bg-[#FFFFFF] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[8px] transition-colors cursor-pointer"
              aria-label="Buka notifikasi"
            >
              <Bell className="w-3.5 h-3.5 text-[#292524]" />
              <span className="hidden sm:inline">Notifikasi</span>
              {unreadNotifsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#CB2957] text-[#FFFFFF] rounded-full tabular-nums leading-none">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Slide-over Notification Drawer */}
            <Dialog.Root
              open={isNotifDrawerOpen}
              onOpenChange={(open) => !open && setIsNotifDrawerOpen(false)}
            >
              <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 bg-black/45 z-50 backdrop-blur-xs transition-opacity duration-300" />
                <Dialog.Viewport className="fixed inset-0 z-50 flex justify-end">
                  <Dialog.Popup className="w-full sm:max-w-md h-full bg-[#FFFFFF] border-l border-[#D2D2D2] shadow-2xl flex flex-col focus:outline-none transition-transform duration-300 ease-in-out">
                    <div className="px-5 py-4 border-b border-[#D2D2D2] bg-[#F6F6F6]/80 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                          Notifikasi Sistem
                        </Dialog.Title>
                        {unreadNotifsCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-[#CB2957] text-[#FFFFFF] rounded-full tabular-nums">
                            {unreadNotifsCount} baru
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {unreadNotifsCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllNotificationsRead()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#292524] bg-[#FFFFFF] border border-[#D2D2D2] hover:bg-[#000000] hover:text-[#FFFFFF] rounded-[6px] transition-colors cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Tandai Dibaca</span>
                          </button>
                        )}
                        <Dialog.Close
                          render={
                            <button
                              type="button"
                              className="p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#FFFFFF] border border-transparent hover:border-[#D2D2D2] rounded-[6px] transition-colors cursor-pointer"
                              aria-label="Tutup panel notifikasi"
                            />
                          }
                        >
                          <X className="w-4 h-4" />
                        </Dialog.Close>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-[#D2D2D2]">
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markNotificationRead(notif.id)
                              setIsNotifDrawerOpen(false)
                            }}
                            className={cn(
                              'p-4 text-xs cursor-pointer transition-colors hover:bg-[#F6F6F6] space-y-1',
                              !notif.isRead && 'bg-[#FBEAEF]/30 border-l-[3px] border-l-[#CB2957]'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn('text-sm', !notif.isRead ? 'font-bold text-[#000000]' : 'font-semibold text-[#292524]')}>
                                {notif.title}
                              </p>
                              <span className="text-[11px] text-[#555555] tabular-nums">
                                {notif.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-[#555555] leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center text-xs text-[#555555] space-y-2">
                          <Bell className="w-8 h-8 text-[#D2D2D2] mx-auto stroke-1" />
                          <p className="font-semibold text-[#000000]">Tidak ada notifikasi</p>
                        </div>
                      )}
                    </div>
                  </Dialog.Popup>
                </Dialog.Viewport>
              </Dialog.Portal>
            </Dialog.Root>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#555555]" />
              <span className="hidden sm:inline">Halaman Publik</span>
            </Link>
          </div>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
