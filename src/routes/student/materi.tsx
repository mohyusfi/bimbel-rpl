import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Search,
  BookOpen,
  Download,
  Eye,
  User,
  Calendar,
  HardDrive,
  Filter,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react'
import { STUDY_MATERIALS, type StudyMaterial } from '~/lib/mock-student-data'
import { MaterialPreviewModal } from '~/components/student/MaterialPreviewModal'

export const Route = createFileRoute('/student/materi')({
  ssr: false,
  component: StudentMateriPage,
})

const CATEGORIES = ['Semua', 'Fisika', 'Matematika', 'Kimia', 'TPS UTBK'] as const

function StudentMateriPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Semua')
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [previewMaterial, setPreviewMaterial] = React.useState<StudyMaterial | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [downloadNotification, setDownloadNotification] = React.useState<string | null>(null)

  // Filtered materials
  const filteredMaterials = STUDY_MATERIALS.filter((mat) => {
    const matchesCategory =
      selectedCategory === 'Semua' ||
      mat.subject.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (selectedCategory === 'Matematika' && mat.subject.toLowerCase().includes('matematika'))

    const matchesSearch =
      mat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.preview.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  const handleOpenPreview = (material: StudyMaterial) => {
    setPreviewMaterial(material)
    setIsPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    setPreviewMaterial(null)
  }

  const handleDownloadDirect = (material: StudyMaterial) => {
    // Show download feedback
    setDownloadNotification(
      `Berkas "${material.fileName}" berhasil diproses untuk diunduh!`
    )
    const link = document.createElement('a')
    link.href = '#'
    link.setAttribute('download', material.fileName)
    document.body.appendChild(link)
    setTimeout(() => {
      document.body.removeChild(link)
    }, 100)

    setTimeout(() => {
      setDownloadNotification(null)
    }, 4000)
  }

  return (
    <>
      {/* 1. Editorial Page Header */}
      <div className="dash-page-header">
        <div className="dash-title-group">
          <h1>Katalog Modul &amp; Lembar Latihan</h1>
          <p>
            Akses materi bimbingan belajar resmi, pembahasan instan soal HOTS SNBT, dan modul persiapan ujian yang disusun eksklusif oleh tim tutor Tadulako Cendekia.
          </p>
        </div>
        <div>
          <span className="status-tag status-neutral">
            <BookOpen className="lucide" /> {STUDY_MATERIALS.length} Berkas PDF Tersedia
          </span>
        </div>
      </div>

      {/* Global Notification Banner */}
      {downloadNotification && (
        <div className="p-4 mb-6 rounded-xl bg-white border-l-4 border-l-[#CB2957] border border-[#D2D2D2] text-black flex items-center justify-between text-xs sm:text-sm shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#CB2957]" />
            <span className="font-semibold">{downloadNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadNotification(null)}
            className="text-neutral-500 hover:text-black font-semibold text-xs ml-3"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Container Card: Filter + Catalog Grid */}
      <div className="dash-card">
        <div className="dash-card-header flex flex-wrap items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Mapel:
            </span>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-[#D2D2D2]'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi, topik, atau tutor..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-neutral-50 border border-[#D2D2D2] rounded-md text-black placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                aria-label="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Materials Body */}
        <div className="dash-card-body">
          {filteredMaterials.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-neutral-400 mx-auto opacity-50" />
              <h3 className="font-bold text-base text-black">
                Tidak Ada Modul Ditemukan
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Tidak ada modul pembelajaran yang sesuai dengan kata kunci &quot;{searchQuery}&quot; atau kategori yang dipilih.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Semua')
                  setSearchQuery('')
                }}
                className="btn btn-primary btn-sm mt-2"
              >
                Bersihkan Filter Pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="bg-white border border-[#D2D2D2] rounded-xl p-5 shadow-xs hover:border-black transition-all flex flex-col justify-between"
                >
                  {/* Card Top */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="status-tag status-neutral">
                        <BookOpen className="w-3.5 h-3.5 text-[#CB2957]" />
                        {material.subject}
                      </span>

                      <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
                          {material.size}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-black leading-snug">
                        {material.title}
                      </h3>
                      <p className="text-xs text-neutral-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {material.preview.summary}
                      </p>
                    </div>

                    {/* Tutor & Date Meta */}
                    <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#CB2957]" />
                        <span className="font-medium text-black">{material.uploadedBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{material.uploadDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-4 border-t border-[#D2D2D2] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(material)}
                      className="btn btn-outline btn-sm"
                    >
                      <Eye className="lucide" />
                      <span>Lihat Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadDirect(material)}
                      className="btn btn-primary btn-sm"
                    >
                      <Download className="lucide" />
                      <span>Unduh Modul</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <MaterialPreviewModal
        material={previewMaterial}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
      />
    </>
  )
}
