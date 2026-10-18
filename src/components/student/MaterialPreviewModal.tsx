import * as React from 'react'
import {
  FileText,
  Download,
  CheckCircle2,
  BookOpen,
  Calendar,
  User,
  HardDrive,
  Check,
  Sparkles,
} from 'lucide-react'
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogCloseButton,
} from '~/components/ui/dialog'
import type { StudyMaterial } from '~/lib/mock-student-data'

interface MaterialPreviewModalProps {
  material: StudyMaterial | null
  isOpen: boolean
  onClose: () => void
}

type TabType = 'ringkasan' | 'cuplikan'

export function MaterialPreviewModal({
  material,
  isOpen,
  onClose,
}: MaterialPreviewModalProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('ringkasan')
  const [downloadSuccess, setDownloadSuccess] = React.useState(false)

  // Reset tab and feedback when a new material is opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('ringkasan')
      setDownloadSuccess(false)
    }
  }, [isOpen, material?.id])

  if (!material) return null

  const handleDownload = () => {
    setDownloadSuccess(true)
    // Create a mock simulated file download
    const link = document.createElement('a')
    link.href = '#'
    link.setAttribute('download', material.fileName)
    document.body.appendChild(link)
    setTimeout(() => {
      document.body.removeChild(link)
    }, 100)

    setTimeout(() => {
      setDownloadSuccess(false)
    }, 4000)
  }

  // Ensure 2 simulated pages for visualization
  const simulatedPages = material.preview.simulatedPages.length >= 2
    ? material.preview.simulatedPages.slice(0, 2)
    : [
        ...material.preview.simulatedPages,
        {
          pageNum: 2,
          title: 'Lembar Latihan Mandiri & Pembahasan Konseptual',
          content:
            'Bagian ini memuat instrumen latihan terstruktur untuk menguji pemahaman konsep fundamental siswa. Kerjakan tanpa melihat kunci terlebih dahulu dalam durasi 15 menit, lalu diskusikan pada sesi bimbingan bersama tutor pendamping di kelas Tadulako Cendekia...',
        },
      ]

  return (
    <DialogRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 bg-white border border-[#D2D2D2] rounded-[14px] shadow-2xl overflow-hidden">
        {/* Header Section */}
        <DialogHeader className="p-5 sm:p-6 border-b border-[#D2D2D2] bg-[#F6F6F6] flex-shrink-0">
          <div className="flex-1 pr-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#000000] text-white">
                {material.subject}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#555555]">
                <HardDrive className="w-3.5 h-3.5" />
                {material.size}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#555555]">
                <Calendar className="w-3.5 h-3.5" />
                {material.uploadDate}
              </span>
            </div>

            <DialogTitle className="text-lg sm:text-xl font-bold font-archivo text-[#000000] tracking-tight leading-snug">
              {material.title}
            </DialogTitle>

            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#555555]">
              <User className="w-3.5 h-3.5 text-[#CB2957]" />
              <span>Diunggah oleh:</span>
              <span className="font-semibold text-[#000000]">{material.uploadedBy}</span>
            </div>
          </div>
          <DialogCloseButton className="text-[#555555] hover:text-[#000000] hover:bg-[#E3E3E3] rounded-[6px]" />
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-[#D2D2D2] bg-white px-5 sm:px-6 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ringkasan')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ringkasan'
                ? 'border-[#CB2957] text-[#CB2957]'
                : 'border-transparent text-[#555555] hover:text-[#000000]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ringkasan Intisari</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cuplikan')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'cuplikan'
                ? 'border-[#CB2957] text-[#CB2957]'
                : 'border-transparent text-[#555555] hover:text-[#000000]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Cuplikan Dokumen PDF (2 Halaman)</span>
          </button>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-[8px] bg-white border-2 border-black text-black flex items-center justify-between text-xs animate-in fade-in duration-200 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-black" />
              <span className="font-medium">
                Unduhan modul <strong>{material.fileName}</strong> berhasil diproses! Berkas tersimpan di perangkat Anda.
              </span>
            </div>
          </div>
        )}

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#EEEEEE] space-y-6">
          {activeTab === 'ringkasan' ? (
            <div className="space-y-5">
              {/* Summary Card */}
              <div className="bg-white p-5 rounded-[10px] border border-[#D2D2D2] shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-[#000000]">
                  <FileText className="w-4 h-4 text-[#CB2957]" />
                  <h3 className="font-archivo font-bold text-sm text-[#000000] uppercase tracking-wider">
                    Deskripsi &amp; Cakupan Materi
                  </h3>
                </div>
                <p className="text-sm text-[#333333] leading-relaxed font-instrument">
                  {material.preview.summary}
                </p>
              </div>

              {/* Key Points */}
              <div className="bg-white p-5 rounded-[10px] border border-[#D2D2D2] shadow-xs">
                <h3 className="font-archivo font-bold text-sm text-[#000000] uppercase tracking-wider mb-3">
                  Poin Kunci &amp; Sasaran Belajar
                </h3>
                <ul className="space-y-2.5">
                  {material.preview.keyPoints.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-2.5 rounded-[8px] bg-[#F6F6F6] border border-[#E0E0E0]"
                    >
                      <div className="w-5 h-5 rounded-[4px] bg-neutral-100 text-black border border-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span className="text-xs sm:text-sm text-[#111111] font-instrument leading-snug">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Document Meta Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-[8px] border border-[#D2D2D2]">
                  <span className="text-[11px] text-[#555555] block">Format Berkas</span>
                  <span className="text-xs font-bold text-[#000000] mt-0.5 block">
                    Dokumen PDF Standar (.pdf)
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-[8px] border border-[#D2D2D2]">
                  <span className="text-[11px] text-[#555555] block">Akses Pembelajaran</span>
                  <span className="text-xs font-bold text-[#000000] mt-0.5 block">
                    Siswa Aktif Bimbingan
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-[8px] border border-[#D2D2D2]">
                  <span className="text-[11px] text-[#555555] block">Distribusi Resmi</span>
                  <span className="text-xs font-bold text-[#000000] mt-0.5 block">
                    Bimbel Tadulako Cendekia
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center pb-1">
                <p className="text-xs text-[#555555]">
                  Menampilkan simulasi visual 2 halaman pertama dari modul pembelajaran resmi Bimbel Tadulako Cendekia.
                </p>
              </div>

              {/* 2 Simulated Pages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {simulatedPages.map((page) => (
                  <div
                    key={page.pageNum}
                    className="relative bg-white border border-[#D2D2D2] rounded-[8px] shadow-md p-6 sm:p-7 min-h-[460px] flex flex-col justify-between overflow-hidden select-none"
                  >
                    {/* Watermark subtle in center */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                      <span className="text-4xl sm:text-5xl font-black font-archivo tracking-widest text-[#000000] -rotate-25 whitespace-nowrap">
                        Bimbel Tadulako Cendekia
                      </span>
                    </div>

                    {/* Page Header */}
                    <div className="border-b border-[#000000] pb-3 mb-4">
                      <div className="flex items-center justify-between text-[10px] text-[#555555] font-semibold tracking-wider uppercase">
                        <span>Bimbel Tadulako Cendekia</span>
                        <span className="text-[#CB2957]">{material.subject}</span>
                      </div>
                      <p className="text-[11px] font-bold text-[#000000] truncate mt-1">
                        {material.title}
                      </p>
                    </div>

                    {/* Page Body */}
                    <div className="flex-1 space-y-3">
                      <h4 className="font-archivo font-bold text-xs sm:text-sm text-[#000000] leading-snug">
                        {page.title}
                      </h4>
                      <p className="text-xs text-[#333333] leading-relaxed font-instrument text-justify">
                        {page.content}
                      </p>

                      <div className="mt-4 p-3 bg-[#F6F6F6] rounded-[6px] border border-[#E0E0E0] text-[11px] text-[#555555] font-mono leading-relaxed">
                        // Cuplikan Soal Mandiri &amp; Catatan Tutor //
                        <br />
                        Kunci penyelesaian bertahap tersedia pada halaman lampiran lengkap di dalam dokumen asli.
                      </div>
                    </div>

                    {/* Page Footer */}
                    <div className="border-t border-[#D2D2D2] pt-3 mt-6 flex items-center justify-between text-[10px] text-[#555555]">
                      <span>Dokumen Hak Cipta Siswa Tadulako</span>
                      <span className="font-semibold text-[#000000]">
                        Hal. {page.pageNum} dari 2 (Sampel)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <DialogFooter className="p-4 sm:p-5 border-t border-[#D2D2D2] bg-[#F6F6F6] flex-shrink-0 flex items-center justify-between gap-3">
          <div className="text-xs text-[#555555] hidden sm:block">
            Ukuran file: <span className="font-semibold text-[#000000]">{material.size}</span> · Standar format PDF A4
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#000000] bg-white border border-[#D2D2D2] rounded-[8px] hover:bg-[#E3E3E3] transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#CB2957] hover:bg-[#B3214B] rounded-[8px] transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Modul Lengkap (.pdf)</span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
