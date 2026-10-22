import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Download,
  FileText,
  Presentation,
  ExternalLink,
  Check,
  User,
  GraduationCap,
  HardDrive,
} from 'lucide-react'
import type { LearningMaterial } from '~/lib/admin-store'
import { downloadMaterialFile } from '~/lib/download-material'

interface MaterialPreviewHeaderProps {
  material: LearningMaterial
  backUrl: string
  backLabel?: string
}

export function MaterialPreviewHeader({
  material,
  backUrl,
  backLabel = 'Kembali ke Daftar Modul',
}: MaterialPreviewHeaderProps) {
  const [downloadSuccess, setDownloadSuccess] = React.useState(false)

  const handleDownload = async () => {
    setDownloadSuccess(true)
    try {
      await downloadMaterialFile(material)
    } finally {
      setTimeout(() => {
        setDownloadSuccess(false)
      }, 3000)
    }
  }

  const isPdf = material.fileType === 'PDF'

  return (
    <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[12px] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Bar: Navigasi & Aksi Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D2D2D2]/60">
        <Link
          to={backUrl}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#555555] hover:text-[#000000] transition-colors self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </Link>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {material.fileUrl && material.fileUrl !== '#' && (
            <a
              href={material.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[8px] transition-colors"
              title="Buka dokumen pada tab terpisah"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Tab Baru</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#222222] rounded-[8px] transition-colors cursor-pointer"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#BBF7D0]" />
                <span>Berhasil Mengunduh</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Berkas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Metadata Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1 font-mono font-semibold text-[11px] text-[#000000]">
              {isPdf ? (
                <FileText className="w-3.5 h-3.5 text-[#901B14]" />
              ) : (
                <Presentation className="w-3.5 h-3.5 text-[#CB2957]" />
              )}
              <span>{material.fileType}</span>
            </span>

            <span className="text-[#D2D2D2]">·</span>

            <span className="font-medium text-[#555555]">
              {material.category}
            </span>
          </div>

          <h1 className="font-display font-bold text-lg sm:text-xl text-[#000000] tracking-tight">
            {material.title}
          </h1>

          {material.description && (
            <p className="text-xs text-[#555555] max-w-3xl leading-relaxed">
              {material.description}
            </p>
          )}
        </div>

        {/* Sub-strip detail */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 text-xs text-[#555555] shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#D2D2D2]/40">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#555555] block">
              Pengampu
            </span>
            <span className="font-medium text-[#000000] block truncate">
              {material.tutorName}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#555555] block">
              Kelas & Mapel
            </span>
            <span className="font-medium text-[#000000] block truncate">
              {material.className} · {material.subjectName}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#555555] block">
              Ukuran
            </span>
            <span className="font-medium text-[#000000] block">
              {material.fileSize}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
