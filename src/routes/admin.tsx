import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AdminShell } from '~/components/dashboard/AdminShell'

export const Route = createFileRoute('/admin')({
  ssr: false,
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
}
