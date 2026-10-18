import * as React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu, ChevronRight, Clock } from 'lucide-react'

export interface StudentHeaderProps {
  onToggleSidebar: () => void
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/student/jadwal')) return 'Jadwal Les Bimbingan'
  if (pathname.startsWith('/student/materi')) return 'Modul Belajar'
  if (pathname.startsWith('/student/nilai')) return 'Nilai & Rapor'
  if (pathname.startsWith('/student/tagihan')) return 'Tagihan SPP'
  return 'Beranda'
}

export function StudentHeader({ onToggleSidebar }: StudentHeaderProps) {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <header className="app-topbar !flex items-center justify-between !h-16 !p-0 px-4 sm:px-8 bg-white border-b border-[#D2D2D2] sticky top-0 z-40 shrink-0">
      {/* Sisi Kiri: Tombol Hamburger (Mobile/Tablet saja) + Breadcrumb Rute Aktif */}
      <div className="topbar-left flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:!hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-white text-neutral-800 border border-[#D2D2D2] hover:bg-neutral-100 hover:text-black transition-colors"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="w-4 h-4 text-neutral-700" />
          <span>Menu</span>
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <Link
            to="/student"
            className="text-neutral-500 hover:text-black transition-colors font-medium hidden sm:inline"
          >
            Portal Siswa
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline" />
          <span className="text-black font-semibold text-sm sm:text-xs">
            {pageTitle}
          </span>
        </nav>
      </div>

      {/* Sisi Kanan: Pill Zona Waktu WITA (Keterangan akun dihilangkan karena sudah ada di sidebar) */}
      <div className="topbar-right flex items-center gap-2.5">
        <span className="timezone-pill">
          <Clock className="lucide" />
          <span className="tz-label-long">Zona WITA (Palu)</span>
          <span className="tz-label-short">WITA</span>
        </span>
      </div>
    </header>
  )
}
