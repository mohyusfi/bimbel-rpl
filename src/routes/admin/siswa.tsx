import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Dialog } from '@base-ui/react/dialog'
import {
  UserPlus,
  Edit,
  X,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react'
import {
  useAdminStudents,
  useAdminClasses,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { cn } from '~/lib/utils'
import { SearchableSelect } from '~/components/ui/searchable-select'
import type { Student, PackageCode } from '~/lib/admin-store'

export const Route = createFileRoute('/admin/siswa')({
  ssr: false,
  component: AdminSiswaPage,
})

const PACKAGE_FILTERS: Array<{
  code: 'ALL' | PackageCode
  label: string
  sub: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    code: 'ALL',
    label: 'Semua Jenjang',
    sub: 'Total siswa aktif',
    description: 'Seluruh siswa terdaftar aktif',
    icon: Users,
  },
  {
    code: 'UTBK',
    label: 'Intensif UTBK',
    sub: 'Persiapan SNBT',
    description: 'Program akselerasi & karantina',
    icon: GraduationCap,
  },
  {
    code: 'SMA',
    label: 'SMA Sukses',
    sub: 'Kelas 10–12 SMA',
    description: 'Pemantapan kurikulum merdeka',
    icon: BookOpen,
  },
  {
    code: 'SMP',
    label: 'SMP Prestasi',
    sub: 'Kelas 7–9 SMP',
    description: 'Bimbingan konsep dasar saintek',
    icon: Award,
  },
  {
    code: 'SD',
    label: 'SD Cendekia',
    sub: 'Kelas 4–6 SD',
    description: 'Pondasi calistung & logika dasar',
    icon: Sparkles,
  },
]

function AdminSiswaPage() {
  const { data: students = [] } = useAdminStudents()
  const { data: classes = [] } = useAdminClasses()
  const { addStudent, updateStudent } = useAdminMutations()

  // Filters
  const [packageFilter, setPackageFilter] = React.useState<string>('ALL')
  const [classFilter, setClassFilter] = React.useState<string>('ALL')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(
    null
  )

  // Add Form State
  const [newForm, setNewForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    packageCode: 'UTBK' as PackageCode,
    classId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentJob: '',
    parentAddress: '',
  })

  // Edit Form State
  const [editForm, setEditForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    classId: '',
    parentName: '',
    parentPhone: '',
    parentJob: '',
    parentAddress: '',
    status: 'aktif' as 'aktif' | 'nonaktif',
  })

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student)
    setEditForm({
      name: student.name,
      email: student.email,
      phone: student.phone,
      school: student.school,
      classId: student.classId,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentJob: student.parentJob || '',
      parentAddress: student.parentAddress || '',
      status: student.status,
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return

    const targetClass = classes.find((c) => c.id === editForm.classId)

    await updateStudent({
      id: editingStudent.id,
      updates: {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        school: editForm.school,
        classId: editForm.classId,
        className: targetClass?.name || editingStudent.className,
        parentName: editForm.parentName,
        parentPhone: editForm.parentPhone,
        parentJob: editForm.parentJob,
        parentAddress: editForm.parentAddress,
        status: editForm.status,
      },
    })
    setEditingStudent(null)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetClass =
      classes.find((c) => c.id === newForm.classId) || classes[0]
    if (!targetClass) return

    await addStudent({
      name: newForm.name,
      email: newForm.email,
      phone: newForm.phone,
      school: newForm.school,
      packageCode: newForm.packageCode,
      classId: targetClass.id,
      className: targetClass.name,
      parentName: newForm.parentName,
      parentPhone: newForm.parentPhone,
      parentEmail: newForm.parentEmail,
      parentJob: newForm.parentJob,
      parentAddress: newForm.parentAddress,
    })
    setIsAddModalOpen(false)
    setNewForm({
      name: '',
      email: '',
      phone: '',
      school: '',
      packageCode: 'UTBK',
      classId: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      parentJob: '',
      parentAddress: '',
    })
  }

  // Filtered dataset
  const filteredStudents = students.filter((s) => {
    const matchPackage =
      packageFilter === 'ALL' || s.packageCode === packageFilter
    const matchClass = classFilter === 'ALL' || s.classId === classFilter
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter
    return matchPackage && matchClass && matchStatus
  })

  const getPackageCount = (code: 'ALL' | PackageCode) => {
    if (code === 'ALL') return students.length
    return students.filter((s) => s.packageCode === code).length
  }

  // TanStack Table columns (Clean Editorial Hierarchy)
  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'name',
      header: 'Siswa & identitas',
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#000000] leading-snug">
                {s.name}
              </span>
              <span className="font-mono text-xs text-[#6B6B6B] tabular-nums">
                {s.nis}
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {s.school}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'className',
      header: 'Paket & rombel',
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <span className="font-normal text-sm text-[#292524] block leading-snug">
            {row.original.className}
          </span>
          <span className="text-[#6B6B6B] text-xs block mt-0.5">
            Program {row.original.packageCode}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'parentName',
      header: 'Orang tua / wali',
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <span className="font-normal text-sm text-[#292524] block leading-snug">
            {row.original.parentName}
          </span>
          <span className="text-xs text-[#6B6B6B] block mt-0.5 tabular-nums">
            WA: {row.original.parentPhone}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'joinDate',
      header: 'Tanggal bergabung',
      cell: ({ getValue }) => (
        <span className="text-sm font-normal text-[#555555] tabular-nums whitespace-nowrap">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => handleOpenEdit(row.original)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] hover:border-[#000000] transition-colors whitespace-nowrap cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5 text-[#555555]" />
          <span>Detail & Edit</span>
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D2D2D2]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A81E46] block mb-1">
            Data Induk Akademik
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[#000000] tracking-tight leading-tight">
            Direktori Siswa & Wali Murid
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1">
            Data induk siswa aktif, penempatan rombel belajar, dan kontak darurat orang tua/wali.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (classes.length > 0) {
              setNewForm((prev) => ({ ...prev, classId: classes[0].id }))
            }
            setIsAddModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[10px] hover:bg-[#262626] transition-colors self-start sm:self-auto cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Siswa & Wali Baru</span>
        </button>
      </div>

      {/* 5 Standardized Quick-Filter & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {PACKAGE_FILTERS.map((pkg) => {
          const isSelected = packageFilter === pkg.code
          const count = getPackageCount(pkg.code)

          return (
            <SummaryMetricCard
              key={pkg.code}
              title={pkg.label}
              value={count}
              unit="Siswa"
              description={pkg.description}
              icon={pkg.icon}
              isSelected={isSelected}
              onClick={() => setPackageFilter(pkg.code)}
              className="rounded-[14px]"
              footer={
                <div className="text-xs">
                  <span>{pkg.sub}</span>
                </div>
              }
            />
          )
        })}
      </div>

      {/* Unified DataTable Card */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        searchPlaceholder="Cari NIS, nama siswa, sekolah, atau nama orang tua..."
        filterSlot={
          <>
            <div className="flex items-center gap-2 text-xs">
              <label
                htmlFor="filter-jenjang"
                className="font-medium text-[#555555]"
              >
                Jenjang:
              </label>
              <select
                id="filter-jenjang"
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
              >
                <option value="ALL">Semua Jenjang</option>
                <option value="UTBK">Intensif UTBK</option>
                <option value="SMA">SMA Sukses</option>
                <option value="SMP">SMP Prestasi</option>
                <option value="SD">SD Cendekia</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label
                htmlFor="filter-rombel"
                className="font-medium text-[#555555]"
              >
                Rombel:
              </label>
              <select
                id="filter-rombel"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
              >
                <option value="ALL">Semua Rombel</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label
                htmlFor="filter-status-siswa"
                className="font-medium text-[#555555]"
              >
                Status:
              </label>
              <select
                id="filter-status-siswa"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
              >
                <option value="ALL">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </>
        }
      />

      {/* DIALOG 1: Tambah Siswa Baru */}
      <Dialog.Root
        open={isAddModalOpen}
        onOpenChange={(open) => !open && setIsAddModalOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3.5">
                <div>
                  <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                    Tambah Data Siswa & Wali Murid
                  </Dialog.Title>
                  <p className="text-xs text-[#555555] mt-0.5">
                    Masukkan identitas siswa dan kontak orang tua untuk penempatan rombel.
                  </p>
                </div>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#F6F6F6] rounded-[6px]"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div className="space-y-3">
                  <h4 className="font-bold text-[#000000] text-[11px] tracking-[0.06em] uppercase border-b border-[#D2D2D2] pb-1.5">
                    1. Identitas Siswa
                  </h4>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Nama Lengkap Siswa <span className="text-[#A1301C]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Akbar"
                      value={newForm.name}
                      onChange={(e) =>
                        setNewForm({ ...newForm, name: e.target.value })
                      }
                      className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        Email Siswa <span className="text-[#A1301C]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="akbar@email.com"
                        value={newForm.email}
                        onChange={(e) =>
                          setNewForm({ ...newForm, email: e.target.value })
                        }
                        className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        Nomor Telepon / WA <span className="text-[#A1301C]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0821-xxxx-xxxx"
                        value={newForm.phone}
                        onChange={(e) =>
                          setNewForm({ ...newForm, phone: e.target.value })
                        }
                        className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        Sekolah Asal <span className="text-[#A1301C]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: SMAN 1 Palu"
                        value={newForm.school}
                        onChange={(e) =>
                          setNewForm({ ...newForm, school: e.target.value })
                        }
                        className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        Penempatan Rombel <span className="text-[#A1301C]">*</span>
                      </label>
                      <SearchableSelect
                        value={newForm.classId}
                        onChange={(val) =>
                          setNewForm({ ...newForm, classId: val })
                        }
                        options={classes.map((c) => ({
                          value: c.id,
                          label: c.name,
                          sublabel: `(${c.studentCount}/${c.capacity} kursi)`,
                        }))}
                        placeholder="Pilih rombel / kelas..."
                        searchPlaceholder="Cari kelas..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-[#000000] text-[11px] tracking-[0.06em] uppercase border-b border-[#D2D2D2] pb-1.5">
                    2. Kontak Orang Tua / Wali
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        Nama Orang Tua / Wali <span className="text-[#A1301C]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Drs. Suharso"
                        value={newForm.parentName}
                        onChange={(e) =>
                          setNewForm({ ...newForm, parentName: e.target.value })
                        }
                        className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        WhatsApp Orang Tua <span className="text-[#A1301C]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0811-xxxx-xxxx"
                        value={newForm.parentPhone}
                        onChange={(e) =>
                          setNewForm({ ...newForm, parentPhone: e.target.value })
                        }
                        className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Alamat Domisili Siswa
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Tadulako No. 5, Besusu Tengah"
                      value={newForm.parentAddress}
                      onChange={(e) =>
                        setNewForm({ ...newForm, parentAddress: e.target.value })
                      }
                      className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#292524] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626]"
                  >
                    Simpan Data Siswa
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG 2: Detail / Edit Siswa */}
      <Dialog.Root
        open={Boolean(editingStudent)}
        onOpenChange={(open) => !open && setEditingStudent(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3.5">
                <div>
                  <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                    Edit Data Siswa — {editingStudent?.nis}
                  </Dialog.Title>
                  <p className="text-xs text-[#555555] mt-0.5">
                    Perbarui kontak, penempatan kelas, atau ubah status keaktifan siswa.
                  </p>
                </div>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#F6F6F6] rounded-[6px]"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {editingStudent && (
                <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#000000] block">
                      Nama Lengkap Siswa <span className="text-[#A1301C]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        Sekolah Asal
                      </label>
                      <input
                        type="text"
                        value={editForm.school}
                        onChange={(e) =>
                          setEditForm({ ...editForm, school: e.target.value })
                        }
                        className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        Telepon / WhatsApp Siswa
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        Rombel / Kelas
                      </label>
                      <SearchableSelect
                        value={editForm.classId}
                        onChange={(val) =>
                          setEditForm({ ...editForm, classId: val })
                        }
                        options={classes.map((c) => ({
                          value: c.id,
                          label: c.name,
                          sublabel: `(${c.studentCount}/${c.capacity} kursi)`,
                        }))}
                        placeholder="Pilih rombel / kelas..."
                        searchPlaceholder="Cari kelas..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        Status Keaktifan
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            status: e.target.value as Student['status'],
                          })
                        }
                        className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] bg-[#FFFFFF] focus:outline-none focus:border-[#000000]"
                      >
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        Nama Orang Tua / Wali
                      </label>
                      <input
                        type="text"
                        value={editForm.parentName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            parentName: e.target.value,
                          })
                        }
                        className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#000000] block">
                        WhatsApp Orang Tua
                      </label>
                      <input
                        type="tel"
                        value={editForm.parentPhone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            parentPhone: e.target.value,
                          })
                        }
                        className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#D2D2D2]">
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="px-4 py-2 text-xs font-semibold text-[#292524] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626]"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
