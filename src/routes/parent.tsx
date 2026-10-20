import * as React from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import {
  LayoutDashboard,
  CalendarCheck,
  GraduationCap,
  CreditCard,
  Users,
  User,
  Check,
} from 'lucide-react'
import { DashboardShell, type DashboardNavGroup } from '~/components/dashboard/DashboardShell'
import { useParentDashboardData, useBimbelMutations } from '~/hooks/use-admin-data'
import { useAuth } from '~/hooks/use-auth'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/parent')({
  ssr: false,
  component: ParentLayout,
})

const NAV_GROUPS: DashboardNavGroup[] = [
  {
    title: 'Pemantauan',
    items: [
      {
        label: 'Ringkasan Anak',
        href: '/parent',
        exact: true,
        icon: LayoutDashboard,
      },
      {
        label: 'Riwayat Kehadiran',
        href: '/parent/kehadiran',
        icon: CalendarCheck,
      },
      {
        label: 'Rapor & Catatan Tutor',
        href: '/parent/rapor',
        icon: GraduationCap,
      },
    ],
  },
  {
    title: 'Administrasi',
    items: [
      {
        label: 'Tagihan & SPP',
        href: '/parent/tagihan',
        icon: CreditCard,
      },
    ],
  },
]

function ParentLayout() {
  const { parent, children, selectedChild } = useParentDashboardData()
  const { setSelectedChildId } = useBimbelMutations()
  const auth = useAuth()

  const currentParentName = auth.userDisplayName || parent?.name || 'Ir. H. Ahmad Dahlan'
  const currentParentInitials = auth.userInitials || 'AD'

  const currentChildId = selectedChild?.id || children[0]?.id || 'stu-1'

  const topSlot = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#555555] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#555555]" />
          <span>Pilih Profil Anak</span>
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {children.map((child) => {
          const isSelected = currentChildId === child.id

          return (
            <button
              key={child.id}
              type="button"
              onClick={() => setSelectedChildId(child.id)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-all text-left cursor-pointer border shadow-none',
                isSelected
                  ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                  : 'bg-[#FFFFFF] text-[#292524] border-[#D2D2D2] hover:bg-[#F6F6F6] hover:text-[#000000]'
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold',
                    isSelected
                      ? 'bg-[#CB2957] text-[#FFFFFF]'
                      : 'bg-[#F6F6F6] text-[#555555] border border-[#D2D2D2]'
                  )}
                >
                  <User className="w-3 h-3" />
                </div>
                <div className="truncate">
                  <p className="font-semibold leading-tight truncate">{child.name}</p>
                  <p
                    className={cn(
                      'text-[10px] leading-tight truncate mt-0.5',
                      isSelected ? 'text-[#EEEEEE]' : 'text-[#555555]'
                    )}
                  >
                    {child.className || child.packageCode}
                  </p>
                </div>
              </div>
              {isSelected && (
                <Check className="w-3.5 h-3.5 text-[#CB2957] shrink-0 ml-1.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <DashboardShell
      role="parent"
      portalName="Portal Orang Tua / Wali"
      navGroups={NAV_GROUPS}
      currentUser={{
        name: currentParentName,
        roleTitle: `Wali Murid (${children.length} Siswa)`,
        initials: currentParentInitials,
      }}
      topSlot={topSlot}
    >
      {/* Top persistent child switcher bar across content */}
      <div className="w-full bg-[#FFFFFF] border-b border-[#D2D2D2]">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#555555] font-medium">Memantau Data:</span>
            <span className="font-bold text-[#000000] font-display">{selectedChild?.name}</span>
            <span className="text-[#555555]">({selectedChild?.className || 'Kelas Siswa'})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#555555] mr-1 hidden sm:inline">Pindah Anak:</span>
            {children.map((child) => {
              const isSelected = currentChildId === child.id
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-colors cursor-pointer border shadow-none',
                    isSelected
                      ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                      : 'bg-[#F6F6F6] text-[#292524] border-[#D2D2D2] hover:bg-[#EAEAEA]'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-[#FFFFFF]" />}
                  <span>{child.name.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <Outlet />
    </DashboardShell>
  )
}
