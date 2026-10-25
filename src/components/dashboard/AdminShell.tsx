import * as React from 'react'
import {
  LayoutDashboard,
  UserCheck,
  Calendar,
  Users,
  GraduationCap,
  Building2,
  CreditCard,
  Megaphone,
  ShieldAlert,
  User,
} from 'lucide-react'
import { useAdminSummary } from '~/hooks/use-admin-data'
import { useAuth } from '~/hooks/use-auth'
import { DashboardShell, type DashboardNavGroup } from './DashboardShell'

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const { pendingRegistrationsCount, pendingInvoicesCount } = useAdminSummary()
  const { userDisplayName, userRoleTitle, userInitials, isSuperAdmin } = useAuth()

  const navGroups: DashboardNavGroup[] = [
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
          badgeCount: pendingRegistrationsCount,
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
          badgeCount: pendingInvoicesCount,
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

  // Menu khusus Pimpinan Lembaga / Super Admin
  if (isSuperAdmin) {
    navGroups.push({
      title: 'Sistem & Kepegawaian',
      items: [
        {
          label: 'Kelola Staf Admin',
          href: '/admin/staf',
          icon: ShieldAlert,
          category: 'Sistem',
        },
      ],
    })
  } else {
    // Menu Profil khusus Staf TU biasa (Super Admin dikecualikan sesuai PRD)
    navGroups.push({
      title: 'Akun & Profil',
      items: [
        {
          label: 'Profil Saya',
          href: '/admin/profil',
          icon: User,
          category: 'Akun',
        },
      ],
    })
  }

  return (
    <DashboardShell
      role="admin"
      portalName="Portal Administrasi"
      navGroups={navGroups}
      currentUser={{
        name: userDisplayName || 'Hj. Nuraini, S.Pd',
        roleTitle: userRoleTitle || 'Kepala Tata Usaha',
        initials: userInitials || 'NU',
      }}
    >
      {children}
    </DashboardShell>
  )
}
