import { createFileRoute } from '@tanstack/react-router'
import { RuanganView } from '~/components/admin/RuanganView'

export const Route = createFileRoute('/admin/ruangan')({
  ssr: false,
  component: RuanganView,
})
