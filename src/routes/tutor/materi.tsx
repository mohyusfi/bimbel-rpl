import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Dialog } from '@base-ui/react/dialog'
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Download,
  BookOpen,
  Search,
  CheckCircle2,
  X,
  UploadCloud,
  Presentation,
  AlertCircle,
} from 'lucide-react'
import { useTutorDashboardData, useAdminMutations } from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { cn } from '~/lib/utils'
import { SearchableSelect } from '~/components/ui/searchable-select'
import type { LearningMaterial } from '~/lib/admin-store'

export const Route = createFileRoute('/tutor/materi')({
  ssr: false,
  component: TutorMateriPage,
})

const CATEGORIES = [
  'Semua Kategori',
  'Modul Teori',
  'Lembar Tugas',
  'Bank Soal',
  'Pembahasan Soal',
  'Kisi-kisi Ujian',
] as const

export function TutorMateriPage() {
  const { materials, classes, tutor } = useTutorDashboardData()
  const { addLearningMaterial, deleteLearningMaterial } = useAdminMutations()

  // Filter state
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Semua Kategori')
  const [selectedClassId, setSelectedClassId] = React.useState<string>('ALL')

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState<boolean>(false)
  const [materialToDelete, setMaterialToDelete] = React.useState<LearningMaterial | null>(null)

  // Upload Form State
  const [form, setForm] = React.useState({
    classId: classes[0]?.id || '',
    subjectName: tutor?.subjects?.[0] || 'Fisika UTBK',
    title: '',
    category: 'Modul Teori',
    fileType: 'PDF' as 'PDF' | 'PPTX',
    fileSize: '3.7 MB',
    fileUrl: '/MOH YUSFI LAKHAFIDUN MODUL 1.pdf',
    description: '',
  })
  const [fileError, setFileError] = React.useState<string | null>(null)

  const [uploadSuccess, setUploadSuccess] = React.useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)

  // Filter data
  const filteredMaterials = materials.filter((m) => {
    if (selectedCategory !== 'Semua Kategori' && m.category !== selectedCategory) {
      return false
    }
    if (selectedClassId !== 'ALL' && m.classId !== selectedClassId) {
      return false
    }
    return true
  })

  // Open upload modal
  const handleOpenUpload = () => {
    setFileError(null)
    setForm({
      classId: classes[0]?.id || '',
      subjectName: tutor?.subjects?.[0] || 'Fisika UTBK',
      title: '',
      category: 'Modul Teori',
      fileType: 'PDF',
      fileSize: '3.7 MB',
      fileUrl: '/MOH YUSFI LAKHAFIDUN MODUL 1.pdf',
      description: '',
    })
    setIsUploadModalOpen(true)
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError(null)

    const isPdfFile =
      file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
    const isPptxFile =
      file.name.toLowerCase().endsWith('.pptx') ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'

    if (!isPdfFile && !isPptxFile) {
      setFileError('Format berkas tidak didukung. Hanya berkas .pdf dan .pptx yang diizinkan.')
      return
    }

    const detectedType: 'PDF' | 'PPTX' = isPptxFile ? 'PPTX' : 'PDF'
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    const objectUrl = URL.createObjectURL(file)

    setForm((prev) => ({
      ...prev,
      title: prev.title.trim() ? prev.title : file.name,
      fileType: detectedType,
      fileSize: `${sizeMb} MB`,
      fileUrl: objectUrl,
    }))
  }

  // Handle upload submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    setIsSubmitting(true)
    try {
      const targetClass = classes.find((c) => c.id === form.classId)
      const finalFileUrl =
        form.fileUrl && form.fileUrl !== '#'
          ? form.fileUrl
          : form.fileType === 'PPTX'
            ? '/Arsitektur dan Integrasi REST API.pptx'
            : '/MOH YUSFI LAKHAFIDUN MODUL 1.pdf'

      await addLearningMaterial({
        classId: form.classId,
        className: targetClass?.name || 'Kelas Bimbingan',
        subjectName: form.subjectName,
        title: form.title.trim(),
        description: form.description.trim() || 'Modul ajar dan materi persiapan bimbingan.',
        category: form.category,
        tutorId: tutor?.id || 'tut-1',
        tutorName: tutor?.name || 'Kak Dian Pratiwi, S.Si',
        fileType: form.fileType,
        fileSize: form.fileSize || '3.7 MB',
        fileUrl: finalFileUrl,
      })

      setIsUploadModalOpen(false)
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!materialToDelete) return
    await deleteLearningMaterial(materialToDelete.id)
    setMaterialToDelete(null)
  }

  const columns: ColumnDef<LearningMaterial>[] = [
    {
      accessorKey: 'title',
      header: 'Judul & Deskripsi',
      cell: ({ row }) => (
        <div className="space-y-1 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-[#000000] block truncate">
              {row.original.title}
            </span>
          </div>
          <p className="text-[11px] text-[#555555] line-clamp-1 leading-relaxed">
            {row.original.description}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'className',
      header: 'Kelas & Mapel',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-medium text-xs text-[#000000] block">
            {row.original.className}
          </span>
          <span className="text-[11px] text-[#555555]">
            {row.original.subjectName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-[#292524]">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'fileType',
      header: 'Format & Ukuran',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-[#555555]">
          <span className="font-mono font-semibold text-[11px] text-[#000000]">
            {row.original.fileType}
          </span>
          <span className="text-[#D2D2D2]">·</span>
          <span className="tabular-nums text-[11px]">{row.original.fileSize}</span>
        </div>
      ),
    },
    {
      accessorKey: 'uploadedAt',
      header: 'Tanggal Unggah',
      cell: ({ row }) => (
        <span className="text-xs text-[#555555] font-medium whitespace-nowrap">
          {row.original.uploadedAt}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to="/tutor/preview/$materialId"
            params={{ materialId: row.original.id }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#000000] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[6px] transition-colors cursor-pointer"
            title="Pratinjau Materi"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Lihat</span>
          </Link>
          <button
            type="button"
            onClick={() => setMaterialToDelete(row.original)}
            className="p-1.5 text-[#555555] hover:text-[#901B14] hover:bg-[#901B14]/10 rounded-[6px] transition-colors cursor-pointer"
            title="Hapus Modul"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#555555]">
            PORTAL PENGAJAR
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#000000] tracking-tight mt-1">
            Modul & Tugas Pembelajaran
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1.5 leading-relaxed">
            Distribusikan modul materi bimbingan, bank soal ujian, dan lembar latihan untuk kelas yang Anda ampu.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenUpload}
          className="inline-flex items-center justify-center gap-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] font-semibold text-xs px-4 py-2.5 rounded-[8px] transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Unggah Modul / Tugas</span>
        </button>
      </div>

      {/* Success Banner */}
      {uploadSuccess && (
        <div className="p-4 bg-[#FFFFFF] border border-[#166534] rounded-[10px] flex items-center gap-2.5 text-xs text-[#166534]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">
            Modul materi baru berhasil diunggah dan langsung tersedia untuk siswa kelas!
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4">
        {/* Class Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#000000] shrink-0">Filter Kelas:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="h-8 px-2.5 border border-[#D2D2D2] rounded-[6px] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#000000]"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#000000] shrink-0">Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 px-2.5 border border-[#D2D2D2] rounded-[6px] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#000000]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-[#555555] tabular-nums font-medium">
          Menampilkan <span className="text-[#000000] font-semibold">{filteredMaterials.length}</span> modul
        </div>
      </div>

      {/* Materials DataTable */}
      <DataTable
        columns={columns}
        data={filteredMaterials}
        searchPlaceholder="Cari judul modul, materi, atau kelas..."
        renderMobileCard={(mat) => (
          <div className="p-4 space-y-3 bg-[#FFFFFF]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="font-semibold text-xs text-[#000000] block">
                  {mat.title}
                </span>
                <p className="text-[11px] text-[#555555] line-clamp-2">
                  {mat.description}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#555555] pt-0.5">
                  <span className="font-medium text-[#292524]">{mat.className}</span>
                  <span className="text-[#D2D2D2]">·</span>
                  <span>{mat.category}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-xs font-semibold text-[#000000] block">
                  {mat.fileType}
                </span>
                <span className="text-[11px] text-[#555555] tabular-nums">
                  {mat.fileSize}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#D2D2D2] flex items-center justify-between">
              <span className="text-[11px] text-[#555555]">{mat.uploadedAt}</span>
              <div className="flex items-center gap-1.5">
                <Link
                  to="/tutor/preview/$materialId"
                  params={{ materialId: mat.id }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#000000] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[6px]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMaterialToDelete(mat)}
                  className="p-1 text-[#555555] hover:text-[#901B14]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {/* Upload Dialog Modal */}
      <Dialog.Root
        open={isUploadModalOpen}
        onOpenChange={(open) => !open && setIsUploadModalOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/55 z-50 backdrop-blur-xs transition-opacity duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden focus:outline-none font-sans">
              {/* Header */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#D2D2D2] bg-[#F6F6F6] flex items-center justify-between">
                <div>
                  <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                    Unggah Modul / Tugas Baru
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-[#555555] mt-0.5">
                    Berkas akan langsung dapat diunduh oleh siswa pada kelas target
                  </Dialog.Description>
                </div>
                <Dialog.Close className="p-1.5 text-[#555555] hover:text-[#000000] rounded-[6px] hover:bg-[#EAEAEA] transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {/* Form Body */}
              <form onSubmit={handleUploadSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs">
                {/* Target Class */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Target Kelas / Rombel <span className="text-[#CB2957]">*</span>
                  </label>
                  <SearchableSelect
                    value={form.classId}
                    onChange={(val) => setForm({ ...form, classId: val })}
                    options={classes.map((c) => ({
                      value: c.id,
                      label: c.name,
                      sublabel: `(${c.studentCount} siswa)`,
                    }))}
                    placeholder="Pilih kelas..."
                    searchPlaceholder="Cari kelas..."
                  />
                </div>

                {/* Subject Name */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Mata Pelajaran <span className="text-[#CB2957]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subjectName}
                    onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                    placeholder="Contoh: Fisika UTBK"
                    className="w-full h-10 px-3 border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Judul Modul / Berkas <span className="text-[#CB2957]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Modul Pembahasan Gravitasi & Usaha Energi.pdf"
                    className="w-full h-10 px-3 border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                {/* File Picker Input */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Pilih Berkas (.pdf atau .pptx) <span className="text-[#CB2957]">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={handleFileInputChange}
                    className="w-full text-xs text-[#555555] file:mr-3 file:py-2 file:px-3 file:rounded-[6px] file:border-0 file:text-xs file:font-semibold file:bg-[#000000] file:text-[#FFFFFF] hover:file:bg-[#222222] file:cursor-pointer p-1.5 border border-[#D2D2D2] rounded-[8px] bg-[#FFFFFF] focus:outline-none cursor-pointer"
                  />
                  {fileError ? (
                    <p className="text-[11px] text-[#901B14] font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{fileError}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#555555]">
                      Mendukung format dokumen PDF (.pdf) atau slide presentasi (.pptx).
                    </p>
                  )}
                </div>

                {/* Category & Format */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Kategori <span className="text-[#CB2957]">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full h-10 px-3 border border-[#D2D2D2] rounded-[8px] bg-[#FFFFFF] focus:outline-none focus:border-[#000000]"
                    >
                      <option value="Modul Teori">Modul Teori</option>
                      <option value="Lembar Tugas">Lembar Tugas</option>
                      <option value="Bank Soal">Bank Soal</option>
                      <option value="Pembahasan Soal">Pembahasan Soal</option>
                      <option value="Kisi-kisi Ujian">Kisi-kisi Ujian</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Tipe Berkas <span className="text-[#CB2957]">*</span>
                    </label>
                    <select
                      value={form.fileType}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          fileType: e.target.value as 'PDF' | 'PPTX',
                        })
                      }
                      className="w-full h-10 px-3 border border-[#D2D2D2] rounded-[8px] bg-[#FFFFFF] focus:outline-none focus:border-[#000000]"
                    >
                      <option value="PDF">Dokumen PDF (.pdf)</option>
                      <option value="PPTX">Slide Presentasi (.pptx)</option>
                    </select>
                  </div>
                </div>

                {/* Estimated File Size / Duration */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Ukuran Berkas / Keterangan
                  </label>
                  <input
                    type="text"
                    value={form.fileSize}
                    onChange={(e) => setForm({ ...form, fileSize: e.target.value })}
                    placeholder="Contoh: 5.2 MB atau 28 menit"
                    className="w-full h-10 px-3 border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Deskripsi Ringkas / Petunjuk Belajar
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Tuliskan petunjuk pengerjaan atau ringkasan cakupan materi..."
                    className="w-full p-3 border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000] resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-[#D2D2D2] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 border border-[#D2D2D2] rounded-[8px] text-[#555555] hover:bg-[#F6F6F6] font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] disabled:opacity-50 font-semibold rounded-[8px] cursor-pointer"
                  >
                    {isSubmitting ? 'Mengunggah...' : 'Simpan Modul'}
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={!!materialToDelete}
        onOpenChange={(open) => !open && setMaterialToDelete(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/55 z-50 backdrop-blur-xs transition-opacity duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] shadow-2xl p-4 sm:p-6 space-y-4 focus:outline-none font-sans">
              <div className="space-y-1">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Hapus Modul Pembelajaran?
                </Dialog.Title>
                <Dialog.Description className="text-xs text-[#555555] leading-relaxed">
                  Apakah Anda yakin ingin menghapus modul{' '}
                  <span className="font-semibold text-[#000000]">
                    "{materialToDelete?.title}"
                  </span>
                  ? Siswa kelas tidak akan lagi dapat mengunduh berkas ini.
                </Dialog.Description>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMaterialToDelete(null)}
                  className="px-3.5 py-2 border border-[#D2D2D2] rounded-[8px] font-semibold text-[#555555] hover:bg-[#F6F6F6] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-[#901B14] hover:bg-[#721510] text-[#FFFFFF] font-semibold rounded-[8px] cursor-pointer"
                >
                  Hapus Berkas
                </button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
