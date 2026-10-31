import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Dialog } from '@base-ui/react/dialog'
import {
  UserPlus,
  Eye,
  X,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Lock,
} from 'lucide-react'
import {
  useAdminStudents,
  useAdminClasses,
  useAdminMutations,
  useAdminParents,
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
  const { data: students = [], isLoading: isLoadingStudents } = useAdminStudents()
  const { data: classes = [] } = useAdminClasses()
  const { data: parents = [] } = useAdminParents()
  const { addStudent } = useAdminMutations()

  // Filters
  const [packageFilter, setPackageFilter] = React.useState<string>('ALL')
  const [classFilter, setClassFilter] = React.useState<string>('ALL')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [addError, setAddError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [parentMode, setParentMode] = React.useState<'new' | 'existing'>('new')
  const [selectedParentId, setSelectedParentId] = React.useState<string>('')

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

  const handleSelectParent = (parentId: string) => {
    setSelectedParentId(parentId)
    const targetParent = parents.find((p) => p.id === parentId)
    if (targetParent) {
      setNewForm((prev) => ({
        ...prev,
        parentName: targetParent.name,
        parentPhone: targetParent.phone,
        parentEmail: targetParent.email,
        parentJob: targetParent.job || '',
        parentAddress: targetParent.address || '',
      }))
    }
  }

  const detectedParent = React.useMemo(() => {
    if (parentMode !== 'new') return null
    const cleanPhone = newForm.parentPhone.replace(/[^0-9]/g, '')
    const cleanEmail = newForm.parentEmail.trim().toLowerCase()
    return (
      parents.find(
        (p) =>
          (cleanEmail && p.email.toLowerCase() === cleanEmail) ||
          (cleanPhone.length >= 10 && p.phone.replace(/[^0-9]/g, '') === cleanPhone)
      ) || null
    )
  }, [parentMode, newForm.parentPhone, newForm.parentEmail, parents])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    const targetClass =
      classes.find((c) => c.id === newForm.classId) || classes[0]
    if (!targetClass) {
      setAddError('Silakan pilih rombel kelas tujuan.')
      return
    }

    if (parentMode === 'existing' && !selectedParentId) {
      setAddError('Silakan pilih orang tua terdaftar terlebih dahulu.')
      return
    }

    setIsSubmitting(true)
    try {
      await addStudent({
        name: newForm.name,
        email: newForm.email,
        phone: newForm.phone,
        school: newForm.school,
        packageCode: newForm.packageCode,
        classId: targetClass.id,
        className: targetClass.name,
        parentId: parentMode === 'existing' ? selectedParentId : undefined,
        parentName: newForm.parentName,
        parentPhone: newForm.parentPhone,
        parentEmail: newForm.parentEmail,
        parentJob: newForm.parentJob,
        parentAddress: newForm.parentAddress,
      })
      setIsAddModalOpen(false)
      setParentMode('new')
      setSelectedParentId('')
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menambahkan data siswa baru.'
      setAddError(message)
    } finally {
      setIsSubmitting(false)
    }
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

  // Filter state helpers
  const isFilterActive =
    packageFilter !== 'ALL' || classFilter !== 'ALL' || statusFilter !== 'ALL'

  const handleResetFilters = () => {
    setPackageFilter('ALL')
    setClassFilter('ALL')
    setStatusFilter('ALL')
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
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Link
              to="/admin/siswa/$studentId"
              params={{ studentId: s.id }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] hover:border-[#000000] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#555555]" />
              <span>Lihat Detail</span>
            </Link>
          </div>
        )
      },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
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
              isLoading={isLoadingStudents}
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
        totalCount={students.length}
        counterLabel="siswa"
        searchPlaceholder="Cari NIS, nama siswa, sekolah, atau nama orang tua..."
        isLoading={isLoadingStudents}
        filterSlot={
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Filter 1: Jenjang */}
              <div className="relative flex items-center">
                <GraduationCap className="absolute left-3 w-4 h-4 text-[#555555] pointer-events-none" />
                <select
                  id="filter-jenjang"
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-medium bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Jenjang</option>
                  <option value="UTBK">Intensif UTBK</option>
                  <option value="SMA">SMA Sukses</option>
                  <option value="SMP">SMP Prestasi</option>
                  <option value="SD">SD Cendekia</option>
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#555555] pointer-events-none" />
              </div>

              {/* Filter 2: Rombel */}
              <div className="relative flex items-center">
                <Users className="absolute left-3 w-4 h-4 text-[#555555] pointer-events-none" />
                <select
                  id="filter-rombel"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-medium bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Rombel</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#555555] pointer-events-none" />
              </div>

              {/* Filter 3: Status */}
              <div className="relative flex items-center">
                <CheckCircle2 className="absolute left-3 w-4 h-4 text-[#555555] pointer-events-none" />
                <select
                  id="filter-status-siswa"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-medium bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="aktif">Status Aktif</option>
                  <option value="nonaktif">Status Nonaktif</option>
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#555555] pointer-events-none" />
              </div>
            </div>

            {/* Reset Filter Button if any filter active */}
            {isFilterActive && (
              <div className="mt-2.5 pt-2.5 border-t border-[#D2D2D2]/50 flex items-center justify-between">
                <span className="text-[11px] text-[#555555]">
                  Filter sedang aktif membatasi siswa yang ditampilkan.
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CB2957] hover:text-[#A81F45] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Semua Filter</span>
                </button>
              </div>
            )}
          </div>
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
                {addError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-[8px] text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{addError}</span>
                  </div>
                )}

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
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="border-b border-[#D2D2D2] pb-1.5 flex items-center justify-between">
                    <h4 className="font-bold text-[#000000] text-[11px] tracking-[0.06em] uppercase">
                      2. Kontak Orang Tua / Wali
                    </h4>
                    <div className="flex items-center gap-1 bg-[#F5F5F5] p-0.5 rounded-[6px] border border-[#E5E5E5]">
                      <button
                        type="button"
                        onClick={() => {
                          setParentMode('new')
                          setSelectedParentId('')
                        }}
                        className={cn(
                          'px-2 py-0.5 text-[11px] font-semibold rounded-[4px] transition-colors cursor-pointer',
                          parentMode === 'new'
                            ? 'bg-[#FFFFFF] text-[#000000] shadow-xs'
                            : 'text-[#666666] hover:text-[#000000]'
                        )}
                      >
                        Wali Baru
                      </button>
                      <button
                        type="button"
                        onClick={() => setParentMode('existing')}
                        className={cn(
                          'px-2 py-0.5 text-[11px] font-semibold rounded-[4px] transition-colors cursor-pointer',
                          parentMode === 'existing'
                            ? 'bg-[#FFFFFF] text-[#000000] shadow-xs'
                            : 'text-[#666666] hover:text-[#000000]'
                        )}
                      >
                        Pilih Wali Terdaftar
                      </button>
                    </div>
                  </div>

                  {parentMode === 'existing' ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-[#000000] block text-xs">
                          Pilih Akun Orang Tua Terdaftar <span className="text-[#A1301C]">*</span>
                        </label>
                        <SearchableSelect
                          value={selectedParentId}
                          onChange={handleSelectParent}
                          options={parents.map((p) => {
                            const parentChildren = students.filter(
                              (s) =>
                                p.studentIds.includes(s.id) ||
                                s.parentId === p.id ||
                                (p.email && s.parentEmail?.toLowerCase() === p.email.toLowerCase())
                            )
                            const kids = parentChildren.map((k) => k.name).join(', ')
                            return {
                              value: p.id,
                              label: p.name,
                              sublabel: kids ? `(Wali dari: ${kids})` : `(WA: ${p.phone})`,
                            }
                          })}
                          placeholder="Cari nama orang tua / nomor WA..."
                          searchPlaceholder="Ketik nama atau nomor telepon..."
                          required
                        />
                      </div>

                      {selectedParentId && (
                        <div className="p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-[8px] space-y-1.5 text-xs">
                          <div className="font-bold text-[#111111]">{newForm.parentName}</div>
                          <div className="text-[#555555] grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                            <div>WhatsApp: <span className="font-medium text-[#111111]">{newForm.parentPhone || '-'}</span></div>
                            <div>Email: <span className="font-medium text-[#111111]">{newForm.parentEmail || '-'}</span></div>
                            {newForm.parentJob && <div>Pekerjaan: <span className="font-medium text-[#111111]">{newForm.parentJob}</span></div>}
                            {newForm.parentAddress && <div className="sm:col-span-2">Alamat: <span className="font-medium text-[#111111]">{newForm.parentAddress}</span></div>}
                          </div>
                          <p className="text-[11px] text-[#006622] font-medium pt-1 border-t border-[#EAEAEA]">
                            [INFO] Siswa baru ini akan otomatis ditautkan ke akun orang tua di atas.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {detectedParent && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-[8px] text-xs flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-[#8A5A00] block">[INFO] Terdeteksi Wali Terdaftar:</span>
                            <span className="text-[#6D4700] text-[11px]">
                              {detectedParent.name} ({detectedParent.phone})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setParentMode('existing')
                              handleSelectParent(detectedParent.id)
                            }}
                            className="text-xs bg-[#000000] text-white px-2.5 py-1 rounded-[6px] hover:bg-[#333333] cursor-pointer"
                          >
                            Tautkan
                          </button>
                        </div>
                      )}

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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-[#000000] block">
                            Email Orang Tua
                          </label>
                          <input
                            type="email"
                            placeholder="wali@email.com"
                            value={newForm.parentEmail}
                            onChange={(e) =>
                              setNewForm({ ...newForm, parentEmail: e.target.value })
                            }
                            className="w-full h-10 px-3 text-xs border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-semibold text-[#000000] block">
                            Pekerjaan Orang Tua
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: PNS / Wiraswasta"
                            value={newForm.parentJob}
                            onChange={(e) =>
                              setNewForm({ ...newForm, parentJob: e.target.value })
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
                    </>
                  )}
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
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data Siswa'}
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
