import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  TrendingUp,
  Receipt,
  LogOut,
  X,
  GraduationCap,
} from 'lucide-react'
import { STUDENT_PROFILE } from '~/lib/mock-student-data'
import { cn } from '~/lib/utils'

export interface StudentSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

interface NavItem {
  name: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Beranda',
    to: '/student',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: 'Jadwal Les',
    to: '/student/jadwal',
    icon: CalendarDays,
  },
  {
    name: 'Modul Belajar',
    to: '/student/materi',
    icon: BookOpen,
  },
  {
    name: 'Nilai & Rapor',
    to: '/student/nilai',
    icon: TrendingUp,
  },
  {
    name: 'Tagihan SPP',
    to: '/student/tagihan',
    icon: Receipt,
  },
]

export function StudentSidebar({ isOpen, onClose, className }: StudentSidebarProps) {
  return (
    <aside
      className={cn(
        'app-sidebar w-64 bg-white border-r border-[#D2D2D2] flex flex-col justify-between h-screen shrink-0 sticky top-0',
        className
      )}
    >
      {/* Zona 1: Header Logo Tadulako Cendekia */}
      <div>
        <div className="sidebar-header flex items-center justify-between">
          <Link
            to="/student"
            className="focus:outline-none rounded-md group block"
            onClick={onClose}
          >
            <div className="font-['Archivo'] font-black text-lg text-black tracking-tight leading-tight group-hover:text-[#CB2957] transition-colors">
              Tadulako Cendekia
            </div>
            <div className="text-[11px] font-semibold text-neutral-500 tracking-wide uppercase mt-0.5">
              Portal Siswa
            </div>
          </Link>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-md transition-colors"
              aria-label="Tutup menu navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Zona 2: Navigasi Menu Siswa */}
        <nav className="sidebar-nav" aria-label="Navigasi Utama Siswa">
          <div className="nav-section-title">Menu Siswa</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: !!item.exact }}
                onClick={onClose}
                className="sidebar-nav-item"
                activeProps={{
                  className: 'active',
                }}
              >
                <div className="sidebar-nav-item-left">
                  <Icon className="lucide" />
                  <span>{item.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Zona 3: Footer Profil Siswa + Tombol Keluar */}
      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="avatar">
            {STUDENT_PROFILE.avatar}
          </div>
          <div className="user-info">
            <span className="user-name">{STUDENT_PROFILE.name}</span>
            <span className="user-role-label">Siswa Bimbel ({STUDENT_PROFILE.grade})</span>
          </div>
        </div>

        <Link
          to="/"
          className="btn btn-outline btn-sm w-full mt-3 flex items-center justify-center gap-2"
          onClick={onClose}
        >
          <LogOut className="lucide" />
          <span>Keluar ke Beranda Utama</span>
        </Link>
      </div>
    </aside>
  )
}
