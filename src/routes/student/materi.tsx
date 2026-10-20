import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Search,
  BookOpen,
  Download,
  Eye,
  FileText,
  Presentation,
  X,
  Sparkles,
} from 'lucide-react'
import { useStudentDashboardData } from '~/hooks/use-admin-data'
import type { LearningMaterial } from '~/lib/admin-store'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/student/materi')({
  ssr: false,
  component: StudentMateriPage,
})

const CATEGORIES = ['Semua', 'Modul Teori', 'Lembar Tugas', 'Bank Soal'] as const

function StudentMateriPage() {
  const { student, materials } = useStudentDashboardData()

  const [selectedCategory, setSelectedCategory] = React.useState<string>('Semua')
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [downloadNotification, setDownloadNotification] = React.useState<string | null>(null)

  // Filtered materials
  const filteredMaterials = materials.filter((mat) => {
    const matchesCategory =
      selectedCategory === 'Semua' || mat.category === selectedCategory

    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      mat.title.toLowerCase().includes(query) ||
      mat.subjectName.toLowerCase().includes(query) ||
      mat.description.toLowerCase().includes(query) ||
      mat.tutorName.toLowerCase().includes(query)

    return matchesCategory && matchesSearch
  })

  const handleDownloadDirect = (material: LearningMaterial) => {
    setDownloadNotification(`Berkas "${material.title}" sedang diunduh.`)
    const link = document.createElement('a')
    link.href = material.fileUrl
    link.setAttribute('download', material.title)
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      document.body.removeChild(link)
    }, 100)
    setTimeout(() => {
      setDownloadNotification(null)
    }, 3500)
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D2D2D2]/60">
        <div>
          <span className="text-xs font-semibold tracking-wider text-[#555555] uppercase block mb-1">
            Pustaka Pembelajaran
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#000000]">
            Modul & Lembar Tugas
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1 leading-relaxed">
            Unduh materi bimbingan, rangkuman teori, dan bank soal latihan kelas {student?.className || 'UTBK Intensif A'}.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] text-xs">
            <BookOpen className="w-3.5 h-3.5 text-[#CB2957]" />
            <span className="font-semibold text-[#000000]">{materials.length} Dokumen Tersedia</span>
          </div>
        </div>
      </div>

      {/* Download Feedback Banner */}
      {downloadNotification && (
        <div className="p-3 bg-[#FFFFFF] border-l-4 border-l-[#CB2957] border border-[#D2D2D2] rounded-[10px] text-xs font-semibold text-[#000000] flex items-center justify-between shadow-none">
          <span>{downloadNotification}</span>
          <button
            type="button"
            onClick={() => setDownloadNotification(null)}
            className="text-[#555555] hover:text-[#000000] ml-4 cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Search & Category Filter Toolbar */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul modul, mapel, atau tutor..."
            className="w-full h-10 pl-10 pr-8 text-[13px] bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[10px] focus:outline-none focus:border-[#000000] transition-all placeholder:text-[#555555]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#555555] hover:text-[#000000] rounded-[4px] cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors cursor-pointer',
                  isActive
                    ? 'bg-[#000000] text-[#FFFFFF] border border-[#000000]'
                    : 'bg-[#FFFFFF] text-[#292524] border border-[#D2D2D2] hover:border-[#000000]'
                )}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Grid of Module Cards */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between hover:border-[#000000] transition-colors"
            >
              <div>
                {/* Top: Category & Filetype */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#CB2957]">
                    {mat.category}
                  </span>
                  <span className="font-mono text-[11px] text-[#555555]">
                    {mat.fileType}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="font-bold text-base text-[#000000] mt-2 line-clamp-2 leading-snug">
                  {mat.title}
                </h3>
                <p className="text-xs text-[#555555] mt-1.5 line-clamp-2 leading-relaxed">
                  {mat.description}
                </p>
              </div>

              <div>
                {/* Metadata */}
                <div className="mt-4 pt-3 border-t border-[#D2D2D2]/60 text-xs text-[#555555] space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Mata pelajaran:</span>
                    <span className="font-medium text-[#292524]">{mat.subjectName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tutor pengajar:</span>
                    <span className="text-[#292524]">{mat.tutorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ukuran berkas:</span>
                    <span className="tabular-nums font-mono text-[#555555]">{mat.fileSize} · {mat.uploadedAt}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-2">
                  <Link
                    to="/student/preview/$materialId"
                    params={{ materialId: mat.id }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau Modul</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDownloadDirect(mat)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-12 text-center text-xs text-[#555555] space-y-2">
          <BookOpen className="w-8 h-8 text-[#D2D2D2] mx-auto stroke-1" />
          <p className="font-semibold text-sm text-[#000000]">Tidak ada materi yang cocok</p>
          <p className="text-xs text-[#555555] max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau pilih kategori materi lainnya.
          </p>
        </div>
      )}
    </div>
  )
}
