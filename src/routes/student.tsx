import * as React from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  GraduationCap,
  Receipt,
  User,
} from 'lucide-react'
import { DashboardShell, type DashboardNavGroup } from '~/components/dashboard/DashboardShell'
import { useActiveSession } from '~/hooks/use-admin-data'
import { useAuth } from '~/hooks/use-auth'
import { createRouteGuard } from '~/lib/route-guard'

export const Route = createFileRoute('/student')({
  ssr: false,
  beforeLoad: createRouteGuard('student'),
  component: StudentLayout,
})

const STUDENT_NAV_GROUPS: DashboardNavGroup[] = [
  {
    title: 'Ruang Belajar',
    items: [
      {
        label: 'Beranda',
        href: '/student',
        exact: true,
        icon: LayoutDashboard,
        category: 'Ruang Belajar',
      },
      {
        label: 'Jadwal Bimbingan',
        href: '/student/jadwal',
        icon: Calendar,
        category: 'Ruang Belajar',
      },
      {
        label: 'Modul & Tugas',
        href: '/student/materi',
        icon: BookOpen,
        category: 'Ruang Belajar',
      },
    ],
  },
  {
    title: 'Capaian & Biaya',
    items: [
      {
        label: 'Nilai & Rapor',
        href: '/student/nilai',
        icon: GraduationCap,
        category: 'Capaian & Biaya',
      },
      {
        label: 'Tagihan SPP',
        href: '/student/tagihan',
        icon: Receipt,
        category: 'Capaian & Biaya',
      },
    ],
  },
  {
    title: 'Akun & Profil',
    items: [
      {
        label: 'Profil Saya',
        href: '/student/profil',
        icon: User,
        category: 'Akun',
      },
    ],
  },
]

function StudentLayout() {
  const { data: session } = useActiveSession()
  const { userDisplayName, userRoleTitle, userInitials, studentProfile } = useAuth()
  const student = studentProfile || session?.student

  const currentUser = {
    name: student?.name || userDisplayName || 'Fahri Ramadhan',
    roleTitle: student?.className || userRoleTitle || 'Kelas 12 — UTBK Intensif',
    initials: userInitials || 'FR',
  }

  return (
    <DashboardShell
      role="student"
      portalName="Portal Siswa"
      navGroups={STUDENT_NAV_GROUPS}
      currentUser={currentUser}
    >
      <Outlet />
    </DashboardShell>
  )
}
