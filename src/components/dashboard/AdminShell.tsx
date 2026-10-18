import * as React from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Dialog } from '@base-ui/react/dialog'
import type { AdminNotification } from '~/lib/admin-store'
import {
  LayoutDashboard,
  UserCheck,
  Calendar,
  Users,
  GraduationCap,
  Building2,
  CreditCard,
  Megaphone,
  Menu,
  X,
  Bell,
  Globe,
  Clock,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import {
  useAdminSummary,
  useAdminNotifications,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { SidebarBrand } from './SidebarBrand'

interface AdminShellProps {
  children: React.ReactNode
}

type AdminRoutePath =
  | '/admin'
  | '/admin/pendaftaran'
  | '/admin/jadwal'
  | '/admin/siswa'
  | '/admin/tutor'
  | '/admin/ruangan'
  | '/admin/pembayaran'
  | '/admin/pengumuman'

interface NavItem {
  label: string
  href: AdminRoutePath
  exact?: boolean
  icon: React.ComponentType<{ className?: string }>
  badgeKey?: 'registrations' | 'invoices'
  category: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Operasional Harian',
    items: [
      {
        label: 'Ringkasan',
        href: '/admin',
        exact: true,
        icon: LayoutDashboard,
        category: 'Operasional',
      },
      {
        label: 'Pendaftaran',
        href: '/admin/pendaftaran',
        icon: UserCheck,
        badgeKey: 'registrations',
        category: 'Operasional',
      },
    ],
  },
  {
    title: 'Akademik & Jadwal',
    items: [
      {
        label: 'Jadwal & Kelas',
        href: '/admin/jadwal',
        icon: Calendar,
        category: 'Akademik',
      },
      {
        label: 'Siswa & Wali',
        href: '/admin/siswa',
        icon: Users,
        category: 'Akademik',
      },
      {
        label: 'Tutor & Mapel',
        href: '/admin/tutor',
        icon: GraduationCap,
        category: 'Akademik',
      },
      {
        label: 'Ruangan & Paket',
        href: '/admin/ruangan',
        icon: Building2,
        category: 'Akademik',
      },
    ],
  },
  {
    title: 'Tata Usaha & Info',
    items: [
      {
        label: 'Pembayaran SPP',
        href: '/admin/pembayaran',
        icon: CreditCard,
        badgeKey: 'invoices',
        category: 'Tata Usaha',
      },
      {
        label: 'Pengumuman',
        href: '/admin/pengumuman',
        icon: Megaphone,
        category: 'Tata Usaha',
      },
    ],
  },
]

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

export function AdminShell({ children }: AdminShellProps) {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = React.useState(false)
  const [notifFilter, setNotifFilter] = React.useState<'ALL' | 'UNREAD' | 'registration' | 'payment'>('ALL')
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { pendingRegistrationsCount, pendingInvoicesCount } = useAdminSummary()
  const { data: notifications = [] } = useAdminNotifications()
  const { markAllNotificationsRead, markNotificationRead } = useAdminMutations()

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length

  const filteredNotifications = notifications.filter((notif) => {
    if (notifFilter === 'UNREAD') return !notif.isRead
    if (notifFilter === 'registration') return notif.type === 'registration'
    if (notifFilter === 'payment') return notif.type === 'payment'
    return true
  })

  const handleNotificationClick = (notif: AdminNotification) => {
    markNotificationRead(notif.id)
    setIsNotifDrawerOpen(false)

    if (notif.type === 'registration') {
      navigate({ to: '/admin/pendaftaran' })
    } else if (notif.type === 'payment') {
      navigate({ to: '/admin/pembayaran' })
    } else if (notif.type === 'schedule') {
      navigate({ to: '/admin/jadwal' })
    } else {
      navigate({ to: '/admin/pengumuman' })
    }
  }

  const getBadgeCount = (badgeKey?: 'registrations' | 'invoices') => {
    if (badgeKey === 'registrations') return pendingRegistrationsCount
    if (badgeKey === 'invoices') return pendingInvoicesCount
    return 0
  }

  const isNavActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href || pathname === `${item.href}/`
    }
    return pathname.startsWith(item.href)
  }

  const activeItem =
    ALL_NAV_ITEMS.find((item) => isNavActive(item)) || ALL_NAV_ITEMS[0]

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

      {/* Sidebar (Desktop 264px + Mobile/Tablet Drawer) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[264px] bg-[#FFFFFF] border-r border-[#D2D2D2] flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Top Section: Brand + Categorized Navigation */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sidebar Brand Header */}
          <div className="h-[60px] px-5 border-b border-[#D2D2D2] flex items-center justify-between shrink-0">
            <SidebarBrand />

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#F6F6F6] rounded-[6px]"
              aria-label="Tutup menu navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Categorized Navigation List */}
          <nav
            className="flex-1 px-3 py-4 space-y-5 overflow-y-auto"
            aria-label="Navigasi Portal Admin"
          >
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#555555] select-none">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const active = isNavActive(item)
                  const badgeCount = getBadgeCount(item.badgeKey)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'relative flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] transition-all select-none group',
                        active
                          ? 'bg-[#000000] text-[#FFFFFF] font-semibold shadow-xs'
                          : 'text-[#292524] font-medium hover:bg-[#F6F6F6] hover:text-[#000000]'
                      )}
                    >
                      {/* Crimson signature indicator bar on active item */}
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

                      {badgeCount > 0 && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full tabular-nums leading-none bg-[#CB2957] text-[#FFFFFF] shadow-xs">
                          {badgeCount}
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
        <div className="p-3.5 border-t border-[#D2D2D2] bg-[#F6F6F6]/70 shrink-0">
          <div className="flex items-center gap-3 px-2.5 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D2D2D2]">
            <div className="w-8 h-8 rounded-[6px] bg-[#000000] text-[#FFFFFF] flex items-center justify-center font-display font-bold text-xs shrink-0">
              NA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#000000] truncate leading-tight">
                Hj. Nuraini, S.Pd
              </p>
              <p className="text-[11px] text-[#555555] truncate mt-0.5 leading-tight">
                Kepala Tata Usaha
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
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Topbar (60px — Clean Breadcrumb without Duplicate Title) */}
        <header className="h-[60px] px-4 sm:px-6 lg:px-8 bg-[#FFFFFF] border-b border-[#D2D2D2] flex items-center justify-between gap-4 sticky top-0 z-30">
          {/* Left: Mobile Drawer Button & Contextual Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#292524] hover:text-[#000000] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[8px]"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-4 h-4" />
            </button>

            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs min-w-0"
            >
              <Link
                to="/admin"
                className="text-[#555555] hover:text-[#000000] font-medium hidden sm:inline transition-colors"
              >
                Portal Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#D2D2D2] hidden sm:inline shrink-0" />
              <span className="text-[#555555] hidden md:inline">
                {activeItem.category}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#D2D2D2] hidden md:inline shrink-0" />
              <span className="font-semibold text-[#000000] truncate">
                {activeItem.label}
              </span>
            </nav>
          </div>

          {/* Right: WITA Timezone Pill, Notifications & Public Site Link */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* WITA Timezone Indicator */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#555555] bg-[#F6F6F6] rounded-[8px] border border-[#D2D2D2]">
              <Clock className="w-3.5 h-3.5 text-[#292524]" />
              <span>WITA (UTC+8)</span>
            </div>

            {/* Notifications Button Trigger */}
            <button
              type="button"
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#292524] hover:text-[#000000] bg-[#FFFFFF] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[8px] transition-colors cursor-pointer"
              aria-label="Buka notifikasi operasional"
            >
              <Bell className="w-3.5 h-3.5 text-[#292524]" />
              <span className="hidden sm:inline">Notifikasi</span>
              {unreadNotifsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#CB2957] text-[#FFFFFF] rounded-full tabular-nums leading-none">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Slide-over Notification Drawer (Right Sheet) */}
            <Dialog.Root
              open={isNotifDrawerOpen}
              onOpenChange={(open) => !open && setIsNotifDrawerOpen(false)}
            >
              <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 bg-black/45 z-50 backdrop-blur-xs transition-opacity duration-300" />
                <Dialog.Viewport className="fixed inset-0 z-50 flex justify-end">
                  <Dialog.Popup className="w-full sm:max-w-md h-full bg-[#FFFFFF] border-l border-[#D2D2D2] shadow-2xl flex flex-col focus:outline-none transition-transform duration-300 ease-in-out">
                    {/* Header Drawer */}
                    <div className="px-5 py-4 border-b border-[#D2D2D2] bg-[#F6F6F6]/80 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                          Notifikasi Operasional
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#292524] bg-[#FFFFFF] border border-[#D2D2D2] hover:bg-[#000000] hover:text-[#FFFFFF] hover:border-[#000000] rounded-[6px] transition-colors cursor-pointer"
                            title="Tandai seluruh notifikasi telah dibaca"
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

                    {/* Filter Category Tabs Bar */}
                    <div className="px-4 py-2.5 border-b border-[#D2D2D2] bg-[#FFFFFF] flex items-center gap-1.5 overflow-x-auto shrink-0 select-none">
                      {[
                        { key: 'ALL', label: 'Semua' },
                        { key: 'UNREAD', label: `Belum Dibaca (${unreadNotifsCount})` },
                        { key: 'registration', label: 'Pendaftaran' },
                        { key: 'payment', label: 'Pembayaran' },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setNotifFilter(tab.key as any)}
                          className={cn(
                            'px-3 py-1.5 text-xs font-semibold rounded-[8px] whitespace-nowrap transition-colors cursor-pointer',
                            notifFilter === tab.key
                              ? 'bg-[#000000] text-[#FFFFFF] shadow-xs'
                              : 'bg-[#F6F6F6] text-[#555555] border border-[#D2D2D2]/60 hover:text-[#000000] hover:border-[#000000]'
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Notification Items List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-[#D2D2D2]">
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notif) => {
                          const isReg = notif.type === 'registration'
                          const isPay = notif.type === 'payment'
                          const isSched = notif.type === 'schedule'

                          return (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={cn(
                                'p-4 text-xs cursor-pointer transition-colors hover:bg-[#F6F6F6] flex items-start gap-3.5 relative group',
                                !notif.isRead && 'bg-[#FBEAEF]/30 border-l-[3px] border-l-[#CB2957]'
                              )}
                            >
                              {/* Category Icon Badge */}
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-0.5 transition-colors',
                                  isReg
                                    ? 'bg-[#FBEAEF] text-[#CB2957] border-[#CB2957]/20 group-hover:bg-[#CB2957] group-hover:text-[#FFFFFF]'
                                    : isPay
                                      ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] group-hover:bg-[#166534] group-hover:text-[#FFFFFF]'
                                      : isSched
                                        ? 'bg-[#F6F6F6] text-[#000000] border-[#D2D2D2] group-hover:bg-[#000000] group-hover:text-[#FFFFFF]'
                                        : 'bg-[#F6F6F6] text-[#555555] border-[#D2D2D2] group-hover:bg-[#000000] group-hover:text-[#FFFFFF]'
                                )}
                              >
                                {isReg && <UserCheck className="w-4 h-4" />}
                                {isPay && <CreditCard className="w-4 h-4" />}
                                {isSched && <Calendar className="w-4 h-4" />}
                                {!isReg && !isPay && !isSched && (
                                  <Megaphone className="w-4 h-4" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={cn(
                                      'text-sm leading-snug',
                                      !notif.isRead
                                        ? 'font-bold text-[#000000]'
                                        : 'font-semibold text-[#292524]'
                                    )}
                                  >
                                    {notif.title}
                                  </p>
                                  <span className="text-[11px] text-[#555555] shrink-0 tabular-nums">
                                    {notif.timestamp}
                                  </span>
                                </div>
                                <p className="text-xs text-[#555555] leading-relaxed">
                                  {notif.message}
                                </p>
                                <div className="pt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#CB2957] group-hover:underline">
                                  <span>Buka modul terkait</span>
                                  <ChevronRight className="w-3 h-3" />
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="p-12 text-center text-xs text-[#555555] space-y-2">
                          <Bell className="w-8 h-8 text-[#D2D2D2] mx-auto stroke-1" />
                          <p className="font-semibold text-[#000000]">
                            Tidak ada notifikasi
                          </p>
                          <p className="text-[#555555] max-w-[220px] mx-auto">
                            Seluruh notifikasi operasional pada filter ini telah selesai ditinjau.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="px-5 py-3 border-t border-[#D2D2D2] bg-[#F6F6F6]/60 flex items-center justify-between text-[11px] text-[#555555] shrink-0">
                      <span>Total: {notifications.length} notifikasi</span>
                      <span>Klik untuk menuju halaman terkait</span>
                    </div>
                  </Dialog.Popup>
                </Dialog.Viewport>
              </Dialog.Portal>
            </Dialog.Root>

            {/* Back to Public Website Link */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#555555]" />
              <span className="hidden sm:inline">Halaman Publik</span>
            </Link>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
