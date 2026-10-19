import * as React from 'react'
import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useTutorDashboardData } from '~/hooks/use-admin-data'
import { MaterialPreviewHeader } from '~/components/dashboard/MaterialPreviewHeader'
import { DocumentPreviewViewer } from '~/components/dashboard/DocumentPreviewViewer'

export const Route = createFileRoute('/tutor/preview/$materialId')({
  ssr: false,
  component: TutorMaterialPreviewPage,
})

function TutorMaterialPreviewPage() {
  const { materialId } = useParams({ from: '/tutor/preview/$materialId' })
  const { materials } = useTutorDashboardData()

  const material = React.useMemo(() => {
    return materials.find((m) => m.id === materialId) || null
  }, [materials, materialId])

  if (!material) {
    return (
      <div className="space-y-6">
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[12px] p-6 text-center space-y-4 max-w-lg mx-auto mt-12">
          <div className="w-12 h-12 rounded-full bg-[#901B14]/10 text-[#901B14] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#000000]">
              Modul Tidak Ditemukan
            </h2>
            <p className="text-xs text-[#555555] mt-1 leading-relaxed">
              Modul atau materi pembelajaran dengan identifikasi{' '}
              <code className="text-[#901B14] font-mono">{materialId}</code> tidak
              terdaftar di sistem.
            </p>
          </div>
          <Link
            to="/tutor/materi"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#000000] text-[#FFFFFF] text-xs font-semibold rounded-[8px] hover:bg-[#222222] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Modul & Tugas</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MaterialPreviewHeader
        material={material}
        backUrl="/tutor/materi"
        backLabel="Kembali ke Daftar Modul"
      />
      <DocumentPreviewViewer material={material} />
    </div>
  )
}
