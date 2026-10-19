import { createFileRoute, Outlet } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  FileText,
  GraduationCap,
} from 'lucide-react'
import { DashboardShell } from '~/components/dashboard/DashboardShell'
import { useActiveSession } from '~/hooks/use-admin-data'

export const Route = createFileRoute('/tutor')({
  ssr: false,
  component: TutorLayout,
})

function TutorLayout() {
  const { data: session } = useActiveSession()
  const tutor = session?.tutor || {
    name: 'Kak Dian Pratiwi, S.Si',
    specialization: 'Fisika & UTBK',
  }

  const navGroups = [
    {
      title: 'Mengajar',
      items: [
        {
          label: 'Ringkasan',
          href: '/tutor',
          exact: true,
          icon: LayoutDashboard,
        },
        {
          label: 'Jadwal Mengajar',
          href: '/tutor/jadwal',
          icon: Calendar,
        },
        {
          label: 'Presensi Sesi',
          href: '/tutor/presensi',
          icon: ClipboardCheck,
        },
      ],
    },
    {
      title: 'Akademik',
      items: [
        {
          label: 'Modul & Tugas',
          href: '/tutor/materi',
          icon: FileText,
        },
        {
          label: 'Nilai & Evaluasi',
          href: '/tutor/nilai',
          icon: GraduationCap,
        },
      ],
    },
  ]

  const currentUser = {
    name: tutor.name || 'Kak Dian Pratiwi, S.Si',
    roleTitle: `Tutor ${tutor.subjects?.[0] || 'Fisika UTBK'}`,
    initials: 'DP',
  }

  return (
    <DashboardShell
      role="tutor"
      portalName="Portal Pengajar"
      navGroups={navGroups}
      currentUser={currentUser}
    >
      <Outlet />
    </DashboardShell>
  )
}
