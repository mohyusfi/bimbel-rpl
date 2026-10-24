import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Dialog } from '@base-ui/react/dialog'
import {
  GraduationCap,
  Plus,
  Edit2,
  CheckCircle2,
  X,
  Search,
  BookOpen,
  User,
  Award,
  TrendingUp,
} from 'lucide-react'
import { useTutorDashboardData, useAdminMutations } from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { cn } from '~/lib/utils'
import { SearchableSelect } from '~/components/ui/searchable-select'
import type { GradeRecord } from '~/lib/admin-store'

export const Route = createFileRoute('/tutor/nilai')({
  ssr: false,
  component: TutorNilaiPage,
})

const CATEGORIES = ['Semua Kategori', 'Try Out', 'Kuis', 'Tugas'] as const

function TutorNilaiPage() {
  const { grades, classes, students, tutor } = useTutorDashboardData()
  const { addGradeRecord, updateGradeRecord } = useAdminMutations()

  // Filter state
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Semua Kategori')
  const [selectedClassId, setSelectedClassId] = React.useState<string>('ALL')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState<boolean>(false)
  const [editingGrade, setEditingGrade] = React.useState<GradeRecord | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string>('')
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)

  // Add Form state
  const [formClassId, setFormClassId] = React.useState<string>(classes[0]?.id || '')
  const [formStudentId, setFormStudentId] = React.useState<string>('')
  const [formSubjectName, setFormSubjectName] = React.useState<string>(
    tutor?.subjects?.[0] || 'Fisika UTBK'
  )
  const [formAssessmentTitle, setFormAssessmentTitle] = React.useState<string>('')
  const [formCategory, setFormCategory] = React.useState<'Try Out' | 'Kuis' | 'Tugas'>('Try Out')
  const [formScore, setFormScore] = React.useState<number>(85)
  const [formFeedback, setFormFeedback] = React.useState<string>('')

  // Edit Form state
  const [editScore, setEditScore] = React.useState<number>(0)
  const [editFeedback, setEditFeedback] = React.useState<string>('')

  // Students available for selected class in add form
  const classStudents = students.filter((s) => s.classId === formClassId)

  // Sync form student when class changes
  React.useEffect(() => {
    if (classStudents.length > 0) {
      if (!classStudents.some((s) => s.id === formStudentId)) {
        setFormStudentId(classStudents[0].id)
      }
    } else {
      setFormStudentId('')
    }
  }, [formClassId, students, formStudentId])

  // Open add modal
  const handleOpenAdd = () => {
    const firstClassId = classes[0]?.id || ''
    setFormClassId(firstClassId)
    const firstClassStudents = students.filter((s) => s.classId === firstClassId)
    setFormStudentId(firstClassStudents[0]?.id || '')
    setFormSubjectName(tutor?.subjects?.[0] || 'Fisika UTBK')
    setFormAssessmentTitle('')
    setFormCategory('Try Out')
    setFormScore(85)
    setFormFeedback('')
    setIsAddModalOpen(true)
  }

  // Open edit modal
  const handleOpenEdit = (record: GradeRecord) => {
    setEditingGrade(record)
    setEditScore(record.score)
    setEditFeedback(record.tutorFeedback)
  }

  // Submit Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formAssessmentTitle.trim() || !formStudentId) return

    const studentObj = students.find((s) => s.id === formStudentId)
    const classObj = classes.find((c) => c.id === formClassId)

    if (!studentObj) return

    setIsSubmitting(true)
    try {
      await addGradeRecord({
        studentId: studentObj.id,
        studentName: studentObj.name,
        nis: studentObj.nis,
        classId: formClassId,
        className: classObj?.name || 'Kelas Bimbingan',
        subjectName: formSubjectName,
        assessmentTitle: formAssessmentTitle.trim(),
        category: formCategory,
        score: Number(formScore),
        tutorId: tutor?.id || 'tut-1',
        tutorName: tutor?.name || 'Kak Dian Pratiwi, S.Si',
        tutorFeedback: formFeedback.trim() || 'Pemahaman materi sudah baik.',
      })

      setIsAddModalOpen(false)
      setSuccessMessage('Nilai evaluasi baru berhasil disimpan dan masuk ke rapor siswa.')
      setTimeout(() => setSuccessMessage(''), 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGrade) return

    setIsSubmitting(true)
    try {
      await updateGradeRecord({
        id: editingGrade.id,
        updates: {
          score: Number(editScore),
          tutorFeedback: editFeedback.trim(),
        },
      })

      setEditingGrade(null)
      setSuccessMessage('Nilai dan catatan evaluasi berhasil diperbarui.')
      setTimeout(() => setSuccessMessage(''), 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered grades
  const filteredGrades = grades.filter((g) => {
    if (selectedCategory !== 'Semua Kategori' && g.category !== selectedCategory) {
      return false
    }
    if (selectedClassId !== 'ALL' && g.classId !== selectedClassId) {
      return false
    }
    return true
  })

  const columns: ColumnDef<GradeRecord>[] = [
    {
      accessorKey: 'studentName',
      header: 'Siswa',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-xs text-[#000000] block">
            {row.original.studentName}
          </span>
          <span className="font-mono text-[11px] text-[#555555]">
            {row.original.nis}
          </span>
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
      accessorKey: 'assessmentTitle',
      header: 'Asesmen & Kategori',
      cell: ({ row }) => (
        <div className="space-y-0.5 max-w-xs">
          <span className="font-semibold text-xs text-[#000000] block truncate">
            {row.original.assessmentTitle}
          </span>
          <span className="text-[11px] text-[#555555]">
            {row.original.category}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'score',
      header: () => <div className="text-right">Skor / Nilai</div>,
      cell: ({ row }) => {
        const score = row.original.score
        const avg = row.original.classAverage
        const isAboveAvg = score >= avg

        return (
          <div className="text-right space-y-0.5">
            <span className="font-display font-extrabold text-sm text-[#000000] tabular-nums block">
              {score}
              <span className="text-xs font-normal text-[#555555]">/100</span>
            </span>
            <span className="text-[10px] text-[#555555] tabular-nums block">
              Rata-rata: {avg}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'tutorFeedback',
      header: 'Catatan Evaluasi Tutor',
      cell: ({ row }) => (
        <p className="text-xs text-[#555555] max-w-xs line-clamp-2 leading-relaxed">
          {row.original.tutorFeedback}
        </p>
      ),
    },
    {
      accessorKey: 'assessmentDate',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-xs text-[#555555] whitespace-nowrap">
          {row.original.assessmentDate}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleOpenEdit(row.original)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#000000] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[6px] transition-colors cursor-pointer"
            title="Edit Nilai"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
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
            Nilai & Evaluasi Belajar
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1.5 leading-relaxed">
            Input capaian skor try out, kuis, dan tugas berkala lengkap dengan catatan rekomendasi kualitatif tutor.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] font-semibold text-xs px-4 py-2.5 rounded-[8px] transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Input Nilai Siswa</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-[#FFFFFF] border border-[#166534] rounded-[10px] flex items-center gap-2.5 text-xs text-[#166534]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
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
          Menampilkan <span className="text-[#000000] font-semibold">{filteredGrades.length}</span> rekap nilai
        </div>
      </div>

      {/* Grade DataTable */}
      <DataTable
        columns={columns}
        data={filteredGrades}
        searchPlaceholder="Cari siswa, NIS, atau judul asesmen..."
        renderMobileCard={(grd) => (
          <div className="p-4 space-y-3 bg-[#FFFFFF]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-[#000000] block">
                  {grd.studentName}
                </span>
                <span className="font-mono text-[11px] text-[#555555] block">
                  {grd.nis} · {grd.className}
                </span>
                <span className="text-xs text-[#292524] font-medium pt-1 block">
                  {grd.assessmentTitle}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="font-display font-extrabold text-base text-[#000000] tabular-nums block">
                  {grd.score}
                  <span className="text-xs font-normal text-[#555555]">/100</span>
                </span>
                <span className="text-[10px] text-[#555555] tabular-nums">
                  Rata-rata: {grd.classAverage}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#555555] line-clamp-2 leading-relaxed bg-[#F6F6F6] p-2.5 rounded-[6px]">
              "{grd.tutorFeedback}"
            </p>

            <div className="pt-2 border-t border-[#D2D2D2] flex items-center justify-between text-[11px]">
              <span className="text-[#555555]">
                {grd.category} · {grd.assessmentDate}
              </span>
              <button
                type="button"
                onClick={() => handleOpenEdit(grd)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#000000] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[6px]"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        )}
      />

      {/* Add Grade Dialog */}
      <Dialog.Root
        open={isAddModalOpen}
        onOpenChange={(open) => !open && setIsAddModalOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/55 z-50 backdrop-blur-xs transition-opacity duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden focus:outline-none font-sans">
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#D2D2D2] bg-[#F6F6F6] flex items-center justify-between">
                <div>
                  <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                    Input Nilai & Evaluasi Siswa
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-[#555555] mt-0.5">
                    Hasil penilaian akan langsung tercatat pada buku rapor digital
                  </Dialog.Description>
                </div>
                <Dialog.Close className="p-1.5 text-[#555555] hover:text-[#000000] rounded-[6px] hover:bg-[#EAEAEA] transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleAddSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs">
                {/* Select Class */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Pilih Kelas / Rombel <span className="text-[#CB2957]">*</span>
                  </label>
                  <SearchableSelect
                    value={formClassId}
                    onChange={(val) => setFormClassId(val)}
                    options={classes.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    placeholder="Pilih kelas..."
                    searchPlaceholder="Cari kelas..."
                    required
                  />
                </div>

                {/* Select Student */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Pilih Siswa <span className="text-[#CB2957]">*</span>
                  </label>
                  {classStudents.length > 0 ? (
                    <SearchableSelect
                      value={formStudentId}
                      onChange={(val) => setFormStudentId(val)}
                      options={classStudents.map((s) => ({
                        value: s.id,
                        label: s.name,
                        sublabel: `(${s.nis})`,
                      }))}
                      placeholder="Pilih siswa..."
                      searchPlaceholder="Cari nama atau NIS siswa..."
                      required
                    />
                  ) : (
                    <p className="text-xs text-[#901B14] p-2 bg-[#901B14]/10 rounded-[6px]">
                      Tidak ada siswa terdaftar pada kelas ini.
                    </p>
                  )}
                </div>

                {/* Subject Name */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Mata Pelajaran <span className="text-[#CB2957]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    placeholder="Contoh: Fisika UTBK"
                    className="w-full h-10 px-3 border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                {/* Assessment Title & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Judul Asesmen / Evaluasi <span className="text-[#CB2957]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formAssessmentTitle}
                      onChange={(e) => setFormAssessmentTitle(e.target.value)}
                      placeholder="Contoh: Try Out 2 UTBK Fisika"
                      className="w-full h-10 px-3 border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Kategori Asesmen <span className="text-[#CB2957]">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) =>
                        setFormCategory(e.target.value as 'Try Out' | 'Kuis' | 'Tugas')
                      }
                      className="w-full h-10 px-3 border border-[#D2D2D2] rounded-[8px] bg-[#FFFFFF] focus:outline-none focus:border-[#000000]"
                    >
                      <option value="Try Out">Try Out</option>
                      <option value="Kuis">Kuis Harian</option>
                      <option value="Tugas">Lembar Tugas</option>
                    </select>
                  </div>
                </div>

                {/* Score & Class Average */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Skor Siswa (0–100) <span className="text-[#CB2957]">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={formScore}
                      onChange={(e) => setFormScore(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-[#D2D2D2] rounded-[8px] font-mono tabular-nums text-xs focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end pb-2">
                    <span className="font-semibold text-[#555555] block">
                      Rata-rata Rombel
                    </span>
                    <p className="text-xs text-[#555555] italic">
                      Rata-rata rombel dihitung otomatis oleh sistem
                    </p>
                  </div>
                </div>

                {/* Qualitative Feedback */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Catatan Evaluasi & Rekomendasi Tutor <span className="text-[#CB2957]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formFeedback}
                    onChange={(e) => setFormFeedback(e.target.value)}
                    placeholder="Tuliskan umpan balik kemajuan belajar untuk orang tua dan siswa..."
                    className="w-full p-3 border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000] resize-none"
                  />
                  <p className="text-[11px] text-[#555555]">
                    Catatan ini akan tampil di dashboard siswa dan laporan perkembangan orang tua.
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-[#D2D2D2] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-[#D2D2D2] rounded-[8px] text-[#555555] hover:bg-[#F6F6F6] font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formStudentId}
                    className="px-5 py-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] disabled:opacity-50 font-semibold rounded-[8px] cursor-pointer"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Nilai'}
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Grade Dialog */}
      <Dialog.Root
        open={!!editingGrade}
        onOpenChange={(open) => !open && setEditingGrade(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/55 z-50 backdrop-blur-xs transition-opacity duration-200" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden focus:outline-none font-sans">
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#D2D2D2] bg-[#F6F6F6] flex items-center justify-between">
                <div>
                  <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                    Perbarui Nilai & Catatan Evaluasi
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-[#555555] mt-0.5">
                    {editingGrade?.studentName} — {editingGrade?.assessmentTitle}
                  </Dialog.Description>
                </div>
                <Dialog.Close className="p-1.5 text-[#555555] hover:text-[#000000] rounded-[6px] hover:bg-[#EAEAEA] transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs">
                {/* Score & Class Average */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Skor Siswa (0–100) <span className="text-[#CB2957]">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={editScore}
                      onChange={(e) => setEditScore(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-[#D2D2D2] rounded-[8px] font-mono tabular-nums text-xs focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end pb-2">
                    <span className="font-semibold text-[#555555] block">
                      Rata-rata Rombel Saat Ini
                    </span>
                    <p className="font-mono text-xs text-[#555555] tabular-nums">
                      {editingGrade?.classAverage ?? '-'}
                      <span className="text-[11px] text-[#777777] font-sans ml-1.5 italic">
                        (Dihitung otomatis oleh sistem)
                      </span>
                    </p>
                  </div>
                </div>

                {/* Qualitative Feedback */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#000000] block">
                    Catatan Evaluasi & Rekomendasi Tutor <span className="text-[#CB2957]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={editFeedback}
                    onChange={(e) => setEditFeedback(e.target.value)}
                    className="w-full p-3 border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000] resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-[#D2D2D2] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingGrade(null)}
                    className="px-4 py-2 border border-[#D2D2D2] rounded-[8px] text-[#555555] hover:bg-[#F6F6F6] font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] disabled:opacity-50 font-semibold rounded-[8px] cursor-pointer"
                  >
                    {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
