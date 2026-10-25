import * as React from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Dialog } from '@base-ui/react/dialog'
import {
  Menu,
  X,
  Bell,
  Clock,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRightLeft,
  PanelLeft,
  PanelLeftClose,
  LogOut,
  UserX,
  Calendar,
  CreditCard,
  Receipt,
  GraduationCap,
  Megaphone,
  UserCheck,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { SidebarBrand } from './SidebarBrand'
import { authStore } from '~/lib/auth-store'
import { useAuth } from '~/hooks/use-auth'
import { useRealtimeNotifications } from '~/hooks/use-realtime-notifications'
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

function getNotificationIcon(type: string) {
  switch (type) {
    case 'attendance':
      return <UserX className="w-4 h-4 text-[#A81E46]" />
    case 'schedule':
      return <Calendar className="w-4 h-4 text-[#292524]" />
    case 'billing':
      return <CreditCard className="w-4 h-4 text-[#2563EB]" />
    case 'payment':
      return <Receipt className="w-4 h-4 text-[#2563EB]" />
    case 'academic':
      return <GraduationCap className="w-4 h-4 text-[#16A34A]" />
    case 'announcement':
      return <Megaphone className="w-4 h-4 text-[#D97706]" />
    case 'registration':
      return <UserCheck className="w-4 h-4 text-[#0284C7]" />
    default:
      return <Bell className="w-4 h-4 text-[#555555]" />
  }
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
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false)

  const handleLogout = React.useCallback(() => {
    authStore.logout()
    setIsLogoutConfirmOpen(false)
    navigate({ to: '/masuk' as any })
  }, [navigate])

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
  const { profile, user, studentProfile, parentProfile, children: authChildren } = useAuth()

  const currentUserId =
    role === 'student'
      ? studentProfile?.id || profile?.id || user?.id
      : role === 'parent'
      ? parentProfile?.id || profile?.id || user?.id
      : profile?.id || user?.id

  const allUserIds = React.useMemo(() => {
    const ids = new Set<string>()
    if (user?.id) ids.add(user.id)
    if (profile?.id) ids.add(profile.id)
    if (studentProfile?.id) ids.add(studentProfile.id)
    if (parentProfile?.id) ids.add(parentProfile.id)
    if (authChildren && role === 'parent') {
      authChildren.forEach((c) => ids.add(c.id))
    }
    return Array.from(ids)
  }, [user?.id, profile?.id, studentProfile?.id, parentProfile?.id, authChildren, role])

  const childIds = React.useMemo(() => {
    if (role !== 'parent') return undefined
    const ids: string[] = []
    if (parentProfile?.studentIds) ids.push(...parentProfile.studentIds)
    if (authChildren) ids.push(...authChildren.map((c) => c.id))
    return Array.from(new Set(ids))
  }, [role, parentProfile, authChildren])

  const {
    notifications,
    unreadCount: unreadNotifsCount,
    markAsRead,
    markAllAsRead,
  } = useRealtimeNotifications({
    userId: currentUserId,
    role,
    childIds,
    relevantUserIds: allUserIds,
  })

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

  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((notif) => {
      if (notifFilter === 'UNREAD') return !notif.isRead
      if (notifFilter === 'attendance')
        return notif.type === 'attendance' || notif.type === 'schedule'
      if (notifFilter === 'billing')
        return notif.type === 'billing' || notif.type === 'payment'
      if (notifFilter === 'academic') return notif.type === 'academic'
      if (notifFilter === 'announcement') return notif.type === 'announcement'
      return true
    })
  }, [notifications, notifFilter])

  const handleNotificationClick = (notif: AdminNotification) => {
    markAsRead(notif.id)
    setIsNotifDrawerOpen(false)
    if (notif.linkUrl) {
      navigate({ to: notif.linkUrl as any })
    }
  }

  return (
    <div className="min-h-screen bg-[#E3E3E3] flex justify-center print:bg-transparent">
      <div className="w-full max-w-[1920px] min-h-screen bg-[#EEEEEE] text-[#000000] flex flex-col lg:flex-row font-sans print:hidden border-x border-[#D2D2D2] shadow-xs relative">
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

          <div className="grid grid-cols-2 gap-1.5">
            <Link
              to="/masuk"
              onClick={() => authStore.clearSession()}
              className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#555555] hover:text-[#000000] hover:bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] transition-colors"
              title="Ganti Portal Role (Demo)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Ganti Role</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#901B14] hover:text-[#FFFFFF] hover:bg-[#901B14] border border-[#D2D2D2] hover:border-[#901B14] rounded-[8px] transition-colors cursor-pointer"
              title="Keluar dari Akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Topbar (60px) */}
        <header className="h-[60px] bg-[#FFFFFF] border-b border-[#D2D2D2] sticky top-0 z-30">
          <div className="h-full px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between gap-4">
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
                            onClick={() => markAllAsRead()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#292524] bg-[#FFFFFF] border border-[#D2D2D2] hover:bg-[#000000] hover:text-[#FFFFFF] rounded-[6px] transition-colors cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Tandai Semua Dibaca</span>
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

                    {/* Filter Tabs: 'Semua', 'Belum Dibaca', 'Presensi', 'SPP', 'Akademik', 'Pengumuman' */}
                    <div className="px-5 py-2 border-b border-[#D2D2D2] bg-[#FFFFFF] flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
                      {[
                        { id: 'ALL', label: 'Semua' },
                        { id: 'UNREAD', label: 'Belum Dibaca' },
                        { id: 'attendance', label: 'Presensi' },
                        { id: 'billing', label: 'SPP' },
                        { id: 'academic', label: 'Akademik' },
                        { id: 'announcement', label: 'Pengumuman' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setNotifFilter(tab.id)}
                          className={cn(
                            'px-2.5 py-1 text-xs font-medium rounded-[6px] whitespace-nowrap transition-colors cursor-pointer',
                            notifFilter === tab.id
                              ? 'bg-[#000000] text-[#FFFFFF] font-semibold'
                              : 'text-[#555555] hover:text-[#000000] hover:bg-[#F6F6F6]'
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-[#D2D2D2]">
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={cn(
                              'p-4 text-xs cursor-pointer transition-colors hover:bg-[#F6F6F6] flex items-start gap-3',
                              !notif.isRead &&
                                'bg-[#FBEAEF]/30 border-l-[3px] border-l-[#CB2957]'
                            )}
                          >
                            <div className="shrink-0 mt-0.5">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={cn(
                                    'text-xs leading-snug',
                                    !notif.isRead
                                      ? 'font-bold text-[#000000]'
                                      : 'font-semibold text-[#292524]'
                                  )}
                                >
                                  {notif.title}
                                </p>
                                <span className="text-[11px] text-[#555555] tabular-nums shrink-0 font-mono">
                                  {notif.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-[#555555] leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
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

            {/* Modal Dialog Konfirmasi Logout */}
            <Dialog.Root
              open={isLogoutConfirmOpen}
              onOpenChange={(open) => !open && setIsLogoutConfirmOpen(false)}
            >
              <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
                <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
                  <Dialog.Popup className="w-full max-w-sm bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                      <Dialog.Title className="font-display font-bold text-base text-[#000000] flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-[#901B14]" />
                        <span>Konfirmasi Keluar</span>
                      </Dialog.Title>
                      <Dialog.Close
                        render={
                          <button
                            type="button"
                            className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] cursor-pointer"
                            onClick={() => setIsLogoutConfirmOpen(false)}
                            aria-label="Tutup dialog"
                          />
                        }
                      >
                        <X className="w-4 h-4" />
                      </Dialog.Close>
                    </div>

                    <div className="space-y-2 text-xs text-[#555555] leading-relaxed">
                      <p>
                        Apakah Anda yakin ingin mengakhiri sesi masuk untuk akun{' '}
                        <strong className="text-[#000000]">{currentUser.name}</strong>?
                      </p>
                      <p>
                        Anda akan dialihkan ke halaman masuk dan dapat masuk kembali kapan saja.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                      <button
                        type="button"
                        onClick={() => setIsLogoutConfirmOpen(false)}
                        className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#901B14] hover:bg-[#721510] rounded-[8px] transition-colors cursor-pointer"
                      >
                        Ya, Keluar
                      </button>
                    </div>
                  </Dialog.Popup>
                </Dialog.Viewport>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6">
          {children}
        </main>
      </div>
      </div>
    </div>
  )
}
