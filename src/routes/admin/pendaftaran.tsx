import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Dialog } from '@base-ui/react/dialog'
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  AlertCircle,
  Users,
  Clock,
  ChevronDown,
  RotateCcw,
  GraduationCap,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react'
import {
  useAdminRegistrations,
  useAdminClasses,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { cn } from '~/lib/utils'
import { SearchableSelect } from '~/components/ui/searchable-select'
import { adminStore, type Registration, type PackageCode } from '~/lib/admin-store'

export const Route = createFileRoute('/admin/pendaftaran')({
  ssr: false,
  component: AdminPendaftaranPage,
})

const PACKAGE_NAMES: Record<PackageCode, string> = {
  UTBK: 'Intensif UTBK-SNBT',
  SMA: 'SMA Sukses',
  SMP: 'SMP Prestasi',
  SD: 'SD Cendekia',
}

function AdminPendaftaranPage() {
  const { data: registrations = [], isLoading: isLoadingRegistrations } = useAdminRegistrations()
  const { data: classes = [] } = useAdminClasses()
  const { approveRegistration, rejectRegistration, addRegistration } =
    useAdminMutations()

  // Filters
  const [packageFilter, setPackageFilter] = React.useState<string>('ALL')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [approvalTarget, setApprovalTarget] =
    React.useState<Registration | null>(null)
  const [selectedClassId, setSelectedClassId] = React.useState<string>('')
  const [approvalError, setApprovalError] = React.useState<string | null>(null)
  const [rejectionTarget, setRejectionTarget] =
    React.useState<Registration | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState<string>('')

  // Approval Credentials Modal State
  const [credentialsModalData, setCredentialsModalData] = React.useState<{
    studentName: string
    studentNis: string
    studentEmail: string
    studentPassword: string
    className: string
    packageName: string
    parentName: string
    parentEmail: string
    parentPhone: string
    parentPassword: string
  } | null>(null)
  const [isTemplateCopied, setIsTemplateCopied] = React.useState(false)

  // Add Manual Form State
  const [newForm, setNewForm] = React.useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    studentSchool: '',
    packageCode: 'UTBK' as PackageCode,
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentJob: '',
    parentAddress: '',
  })

  // Filtered dataset
  const filteredData = registrations.filter((reg) => {
    const matchPackage =
      packageFilter === 'ALL' || reg.packageCode === packageFilter
    const matchStatus =
      statusFilter === 'ALL' || reg.status === statusFilter
    return matchPackage && matchStatus
  })

  // Filter state helpers
  const isFilterActive = packageFilter !== 'ALL' || statusFilter !== 'ALL'

  const handleResetFilters = () => {
    setPackageFilter('ALL')
    setStatusFilter('ALL')
  }

  // Open approval modal
  const handleOpenApproval = (reg: Registration) => {
    setApprovalTarget(reg)
    setApprovalError(null)
    const matchingClasses = classes.filter(
      (c) => c.courseCode === reg.packageCode
    )
    if (matchingClasses.length > 0) {
      const availableClass = matchingClasses.find((c) => c.studentCount < 12)
      setSelectedClassId(availableClass?.id || matchingClasses[0].id)
    } else {
      setSelectedClassId(classes[0]?.id || '')
    }
  }

  // Plotting and approval handler (anti-overcapacity verification)
  const handleApproveRegistration = async () => {
    if (!approvalTarget || !selectedClassId) return
    const reg = approvalTarget
    const targetClass = classes.find((c) => c.id === selectedClassId)

    if (!targetClass) {
      setApprovalError('Silakan pilih rombel bimbingan terlebih dahulu.')
      return
    }

    const maxCap = Math.min(12, targetClass.capacity || 12)
    if (targetClass.studentCount >= maxCap || targetClass.studentCount >= 12) {
      setApprovalError(
        `Rombel "${targetClass.name}" telah penuh (${targetClass.studentCount}/${maxCap} siswa). Plotting pendaftaran dicegah. Silakan pilih rombel lain dengan kuota tersedia.`
      )
      return
    }

    setApprovalError(null)

    try {
      const result = await approveRegistration({
        regId: reg.id,
        classId: selectedClassId,
        reg,
      })

      const creds = (result as any)?.credentials
      if (creds) {
        setCredentialsModalData({
          studentName: creds.studentName,
          studentNis: creds.studentNis,
          studentEmail: creds.studentEmail,
          studentPassword: creds.studentPassword,
          className: creds.className,
          packageName: reg.packageName,
          parentName: creds.parentName,
          parentEmail: creds.parentEmail,
          parentPhone: creds.parentPhone,
          parentPassword: creds.parentPassword,
        })
      } else {
        setCredentialsModalData({
          studentName: reg.studentName,
          studentNis: 'TC-2026-004',
          studentEmail: reg.studentEmail,
          studentPassword: 'siswa2026',
          className: targetClass?.name || 'Rombel Aktif',
          packageName: reg.packageName,
          parentName: reg.parentName,
          parentEmail:
            reg.parentEmail ||
            `${reg.studentEmail.split('@')[0]}.wali@tadulakocendekia.sch.id`,
          parentPhone: reg.parentPhone,
          parentPassword: 'wali2026',
        })
      }

      setApprovalTarget(null)
    } catch (err: any) {
      setApprovalError(err?.message || 'Gagal memverifikasi pendaftaran.')
    }
  }

  const handleConfirmApproval = handleApproveRegistration

  // Open view credentials modal for verified students
  const handleViewCredentials = (reg: Registration) => {
    const adminState = adminStore.getState()
    const student = adminState.students.find(
      (s) => s.email.toLowerCase() === reg.studentEmail.toLowerCase()
    )
    const targetClass = classes.find((c) => c.id === reg.assignedClassId)
    const parent = adminState.parents.find(
      (p) => student && p.studentIds.includes(student.id)
    )

    setCredentialsModalData({
      studentName: reg.studentName,
      studentNis: student?.nis || 'TC-2026-001',
      studentEmail: reg.studentEmail,
      studentPassword: 'siswa2026',
      className: targetClass?.name || student?.className || reg.packageName,
      packageName: reg.packageName,
      parentName: parent?.name || reg.parentName,
      parentEmail:
        parent?.email ||
        reg.parentEmail ||
        `${reg.studentEmail.split('@')[0]}.wali@tadulakocendekia.sch.id`,
      parentPhone: parent?.phone || reg.parentPhone,
      parentPassword: 'wali2026',
    })
  }

  // Copy structured WhatsApp template for parent
  const handleCopyWhatsAppTemplate = () => {
    if (!credentialsModalData) return
    const text = `*TADULAKO CENDEKIA — KREDENSIAL AKSES PORTAL*
Yth. Bapak/Ibu ${credentialsModalData.parentName},
Pendaftaran putra/putri Anda, *${credentialsModalData.studentName}*, untuk program *${credentialsModalData.packageName}* telah diverifikasi dan resmi terdaftar di kelas *${credentialsModalData.className}*.

*Akses Portal Siswa:*
• NIS: ${credentialsModalData.studentNis}
• Email: ${credentialsModalData.studentEmail}
• Kata Sandi: ${credentialsModalData.studentPassword}
• Tautan Masuk: https://tadulakocendekia.sch.id/masuk

*Akses Portal Orang Tua / Wali:*
• Email: ${credentialsModalData.parentEmail}
• Kata Sandi: ${credentialsModalData.parentPassword}
• Tautan Masuk: https://tadulakocendekia.sch.id/masuk

Mohon simpan informasi kredensial ini dengan baik. Terima kasih atas kepercayaan Anda pada Tadulako Cendekia.`

    navigator.clipboard.writeText(text)
    setIsTemplateCopied(true)
    setTimeout(() => setIsTemplateCopied(false), 2500)
  }

  // Open rejection modal
  const handleOpenRejection = (reg: Registration) => {
    setRejectionTarget(reg)
    setRejectionReason('')
  }

  const handleConfirmRejection = async () => {
    if (!rejectionTarget || !rejectionReason.trim()) return
    await rejectRegistration({
      regId: rejectionTarget.id,
      reason: rejectionReason.trim(),
      reg: rejectionTarget,
    })
    setRejectionTarget(null)
  }

  // Submit manual registration
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addRegistration({
      studentName: newForm.studentName,
      studentEmail: newForm.studentEmail,
      studentPhone: newForm.studentPhone,
      studentSchool: newForm.studentSchool,
      packageCode: newForm.packageCode,
      packageName: PACKAGE_NAMES[newForm.packageCode],
      parentName: newForm.parentName,
      parentEmail: newForm.parentEmail,
      parentPhone: newForm.parentPhone,
      parentJob: newForm.parentJob,
      parentAddress: newForm.parentAddress,
    })
    setIsAddModalOpen(false)
    setNewForm({
      studentName: '',
      studentEmail: '',
      studentPhone: '',
      studentSchool: '',
      packageCode: 'UTBK',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      parentJob: '',
      parentAddress: '',
    })
  }

  // Quick Filter Cards data
  const statusCards = [
    {
      status: 'ALL',
      label: 'Semua Pendaftar',
      description: 'Total berkas calon siswa masuk',
      count: registrations.length,
      icon: Users,
      footer: 'Rekap Seluruh Jalur',
      urgent: false,
    },
    {
      status: 'menunggu',
      label: 'Menunggu Verifikasi',
      description: 'Perlu validasi berkas & plotting',
      count: registrations.filter((r) => r.status === 'menunggu').length,
      icon: Clock,
      footer: 'Prioritas Hari Ini',
      urgent: true,
    },
    {
      status: 'terverifikasi',
      label: 'Terverifikasi',
      description: 'Sudah diplot ke rombel aktif',
      count: registrations.filter((r) => r.status === 'terverifikasi').length,
      icon: CheckCircle2,
      footer: 'Plotting Berhasil',
      urgent: false,
    },
    {
      status: 'ditolak',
      label: 'Ditolak',
      description: 'Berkas tidak lengkap / batal',
      count: registrations.filter((r) => r.status === 'ditolak').length,
      icon: XCircle,
      footer: 'Arsip Ditolak',
      urgent: false,
    },
  ]

  // TanStack Table Column Definitions (Clean Editorial Hierarchy)
  const columns: ColumnDef<Registration>[] = [
    {
      accessorKey: 'studentName',
      header: 'Calon siswa & kontak',
      cell: ({ row }) => {
        const reg = row.original
        return (
          <div className="min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#000000] leading-snug">
                {reg.studentName}
              </span>
              <span className="font-mono text-xs text-[#6B6B6B] tabular-nums">
                {reg.registrationNumber || reg.id}
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {reg.studentSchool}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'packageName',
      header: 'Pilihan paket',
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <span className="font-normal text-sm text-[#292524] block leading-snug">
            {row.original.packageName}
          </span>
          <span className="text-xs text-[#6B6B6B] block mt-0.5">
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
      accessorKey: 'createdAt',
      header: 'Waktu daftar',
      cell: ({ row }) => {
        const dateStr = new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(row.original.createdAt))

        return (
          <span className="text-sm font-normal text-[#555555] tabular-nums whitespace-nowrap">
            {dateStr} WITA
          </span>
        )
      },
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
        const reg = row.original

        if (reg.status === 'menunggu') {
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <button
                type="button"
                onClick={() => handleOpenApproval(reg)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Setujui & Plot</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenRejection(reg)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#B3261E] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6E7E3] transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Tolak</span>
              </button>
            </div>
          )
        }

        if (reg.status === 'terverifikasi') {
          const assigned = classes.find((c) => c.id === reg.assignedClassId)
          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-semibold text-xs text-[#166534]">
                {assigned ? `Rombel: ${assigned.name}` : 'Terverifikasi'}
              </span>
              <button
                type="button"
                onClick={() => handleViewCredentials(reg)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#292524] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[6px] hover:bg-[#F6F6F6] hover:text-[#000000] hover:border-[#000000] transition-colors cursor-pointer"
                title="Lihat Kredensial Akun"
              >
                <KeyRound className="w-3 h-3 text-[#555555]" />
                <span>Kredensial</span>
              </button>
            </div>
          )
        }

        return (
          <span
            className="text-xs text-[#B3261E] truncate max-w-[160px] block"
            title={reg.rejectedReason}
          >
            {reg.rejectedReason || 'Ditolak'}
          </span>
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
            Pusat Pendaftaran Siswa
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[#000000] tracking-tight leading-tight">
            Verifikasi Pendaftaran Calon Siswa
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1">
            Kelola pendaftar mandiri dari website, validasi data, dan plotting ke rombel aktif.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[10px] hover:bg-[#262626] transition-colors self-start sm:self-auto cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pendaftar Manual</span>
        </button>
      </div>

      {/* 4 Standardized Quick-Filter & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {statusCards.map((card) => {
          const isSelected = statusFilter === card.status
          return (
            <SummaryMetricCard
              key={card.status}
              title={card.label}
              value={card.count}
              unit="Siswa"
              description={card.description}
              icon={card.icon}
              variant={card.urgent && card.count > 0 ? 'urgent' : 'default'}
              isSelected={isSelected}
              onClick={() => setStatusFilter(card.status)}
              className="rounded-[14px]"
              isLoading={isLoadingRegistrations}
              footer={
                <div className="text-xs">
                  <span>{card.footer}</span>
                </div>
              }
            />
          )
        })}
      </div>

      {/* Unified DataTable Card */}
      <DataTable
        columns={columns}
        data={filteredData}
        totalCount={registrations.length}
        counterLabel="pendaftar"
        searchPlaceholder="Cari nama calon siswa, sekolah, wali, atau ID..."
        isLoading={isLoadingRegistrations}
        filterSlot={
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Filter 1: Paket */}
              <div className="relative flex items-center">
                <GraduationCap className="absolute left-3 w-4 h-4 text-[#555555] pointer-events-none" />
                <select
                  id="filter-paket"
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-medium bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Paket</option>
                  <option value="UTBK">Intensif UTBK</option>
                  <option value="SMA">SMA Sukses</option>
                  <option value="SMP">SMP Prestasi</option>
                  <option value="SD">SD Cendekia</option>
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#555555] pointer-events-none" />
              </div>

              {/* Filter 2: Status */}
              <div className="relative flex items-center">
                <CheckCircle2 className="absolute left-3 w-4 h-4 text-[#555555] pointer-events-none" />
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-medium bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="menunggu">Menunggu Verifikasi</option>
                  <option value="terverifikasi">Terverifikasi</option>
                  <option value="ditolak">Ditolak</option>
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#555555] pointer-events-none" />
              </div>
            </div>

            {/* Reset Filter Button if any filter active */}
            {isFilterActive && (
              <div className="mt-2.5 pt-2.5 border-t border-[#D2D2D2]/50 flex items-center justify-between">
                <span className="text-[11px] text-[#555555]">
                  Filter sedang aktif membatasi pendaftar yang ditampilkan.
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

      {/* MODAL 1: Setujui & Plotting Rombel */}
      <Dialog.Root
        open={Boolean(approvalTarget)}
        onOpenChange={(open) => !open && setApprovalTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Setujui & Plotting Kelas
                </Dialog.Title>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {approvalTarget && (
                <div className="space-y-4 text-xs text-[#000000]">
                  <div className="p-3.5 bg-[#F6F6F6] rounded-[10px] border border-[#D2D2D2] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[14px] text-[#000000]">
                        {approvalTarget.studentName}
                      </p>
                      <span className="font-mono text-xs text-[#555555] tabular-nums">
                        {approvalTarget.id}
                      </span>
                    </div>
                    <p className="text-xs text-[#555555]">
                      {approvalTarget.studentSchool} · {approvalTarget.packageName}
                    </p>
                    <p className="text-xs text-[#555555]">
                      Wali: {approvalTarget.parentName} ({approvalTarget.parentPhone})
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#000000] block">
                      Pilih Rombel / Kelas Bimbingan
                    </label>
                    <SearchableSelect
                      value={selectedClassId}
                      onChange={(val) => {
                        setSelectedClassId(val)
                        setApprovalError(null)
                      }}
                      options={classes
                        .filter(
                          (c) => c.courseCode === approvalTarget.packageCode
                        )
                        .map((cls) => {
                          const isFull =
                            cls.studentCount >= 12 ||
                            cls.studentCount >= (cls.capacity || 12)
                          return {
                            value: cls.id,
                            label: cls.name,
                            sublabel: isFull
                              ? `(PENUH ${cls.studentCount}/12 siswa · Tutor: ${cls.tutorName})`
                              : `(Terisi ${cls.studentCount}/${cls.capacity || 12} kursi · Tutor: ${cls.tutorName})`,
                          }
                        })}
                      placeholder="Pilih rombel / kelas..."
                      searchPlaceholder="Cari kelas atau tutor..."
                      required
                    />
                    <p className="text-[11px] text-[#555555]">
                      Data siswa dan kontak orang tua otomatis dimasukkan ke direktori Siswa Aktif.
                    </p>
                  </div>

                  {(() => {
                    const selectedClass = classes.find((c) => c.id === selectedClassId)
                    const isFull = selectedClass
                      ? selectedClass.studentCount >= 12 ||
                        selectedClass.studentCount >= (selectedClass.capacity || 12)
                      : false

                    if (isFull) {
                      return (
                        <div className="flex items-start gap-2.5 p-3 bg-[#FDF2F4] border border-[#F1AEBA] rounded-[10px] text-xs text-[#A81E46]">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#CB2957]" />
                          <div className="space-y-0.5">
                            <p className="font-semibold text-[#8C1535]">Rombel Telah Penuh</p>
                            <p className="text-[11px] text-[#A81E46] leading-relaxed">
                              Rombel {selectedClass?.name} telah terisi penuh ({selectedClass?.studentCount}/12 siswa). Plotting pendaftaran dicegah sesuai batas maksimal 12 siswa per rombel. Silakan pilih rombel lain.
                            </p>
                          </div>
                        </div>
                      )
                    }

                    if (approvalError) {
                      return (
                        <div className="flex items-start gap-2.5 p-3 bg-[#FDF2F4] border border-[#F1AEBA] rounded-[10px] text-xs text-[#A81E46]">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#CB2957]" />
                          <p className="text-xs text-[#8C1535] leading-relaxed">{approvalError}</p>
                        </div>
                      )
                    }

                    return null
                  })()}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                    <button
                      type="button"
                      onClick={() => setApprovalTarget(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    {(() => {
                      const selectedClass = classes.find((c) => c.id === selectedClassId)
                      const isFull = selectedClass
                        ? selectedClass.studentCount >= 12 ||
                          selectedClass.studentCount >= (selectedClass.capacity || 12)
                        : false

                      return (
                        <button
                          type="button"
                          onClick={handleApproveRegistration}
                          disabled={isFull}
                          className={cn(
                            "px-4 py-2 text-xs font-semibold rounded-[8px] transition-colors cursor-pointer",
                            isFull
                              ? "bg-[#D2D2D2] text-[#777777] cursor-not-allowed"
                              : "text-[#FFFFFF] bg-[#000000] hover:bg-[#262626]"
                          )}
                        >
                          Konfirmasi Persetujuan
                        </button>
                      )
                    })()}
                  </div>
                </div>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL 2: Tolak Pendaftaran */}
      <Dialog.Root
        open={Boolean(rejectionTarget)}
        onOpenChange={(open) => !open && setRejectionTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#B3261E] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Tolak Pendaftaran</span>
                </Dialog.Title>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {rejectionTarget && (
                <div className="space-y-4 text-xs text-[#000000]">
                  <p className="text-[#555555]">
                    Anda akan menolak pendaftaran atas nama{' '}
                    <strong className="text-[#000000]">
                      {rejectionTarget.studentName}
                    </strong>
                    . Harap sertakan alasan penolakan yang jelas.
                  </p>

                  <div className="space-y-1.5">
                    <label className="font-medium text-[#000000] block">
                      Alasan Penolakan
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Contoh: Kuota kelas untuk jenjang ini telah penuh / nomor telepon tidak valid."
                      className="w-full p-2.5 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                    <button
                      type="button"
                      onClick={() => setRejectionTarget(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={!rejectionReason.trim()}
                      onClick={handleConfirmRejection}
                      className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#B3261E] rounded-[8px] hover:bg-[#921E17] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Tolak Pendaftar
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL 3: Tambah Pendaftar Manual */}
      <Dialog.Root
        open={isAddModalOpen}
        onOpenChange={(open) => !open && setIsAddModalOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Tambah Pendaftar Calon Siswa Manual
                </Dialog.Title>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div className="space-y-3">
                  <h4 className="font-bold text-[#000000] text-xs tracking-wide uppercase border-b border-[#D2D2D2] pb-1">
                    Data Calon Siswa
                  </h4>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Nama Lengkap Siswa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Andi Muh. Akbar"
                      value={newForm.studentName}
                      onChange={(e) =>
                        setNewForm((prev) => ({
                          ...prev,
                          studentName: e.target.value,
                        }))
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-medium text-[#000000]">
                        Nomor HP / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="081234567890"
                        value={newForm.studentPhone}
                        onChange={(e) =>
                          setNewForm((prev) => ({
                            ...prev,
                            studentPhone: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-[#000000]">
                        Email Siswa
                      </label>
                      <input
                        type="email"
                        placeholder="siswa@contoh.com"
                        value={newForm.studentEmail}
                        onChange={(e) =>
                          setNewForm((prev) => ({
                            ...prev,
                            studentEmail: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-medium text-[#000000]">
                        Asal Sekolah *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="SMA Negeri 1 Palu"
                        value={newForm.studentSchool}
                        onChange={(e) =>
                          setNewForm((prev) => ({
                            ...prev,
                            studentSchool: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-[#000000]">
                        Pilihan Paket Bimbel *
                      </label>
                      <select
                        value={newForm.packageCode}
                        onChange={(e) =>
                          setNewForm((prev) => ({
                            ...prev,
                            packageCode: e.target.value as PackageCode,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      >
                        <option value="UTBK">Intensif UTBK-SNBT</option>
                        <option value="SMA">SMA Sukses (Kelas 10-12)</option>
                        <option value="SMP">SMP Prestasi (Kelas 7-9)</option>
                        <option value="SD">SD Cendekia (Kelas 4-6)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-[#000000] text-xs tracking-wide uppercase border-b border-[#D2D2D2] pb-1">
                    Data Orang Tua / Wali Murid
                  </h4>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Nama Lengkap Orang Tua / Wali *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Drs. H. Rusdianto"
                      value={newForm.parentName}
                      onChange={(e) =>
                        setNewForm((prev) => ({
                          ...prev,
                          parentName: e.target.value,
                        }))
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-medium text-[#000000]">
                        WhatsApp Orang Tua *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="08114567890"
                        value={newForm.parentPhone}
                        onChange={(e) =>
                          setNewForm((prev) => ({
                            ...prev,
                            parentPhone: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-[#000000]">
                        Pekerjaan Orang Tua
                      </label>
                      <input
                        type="text"
                        placeholder="PNS / Wiraswasta"
                        value={newForm.parentJob}
                        onChange={(e) =>
                          setNewForm((prev) => ({
                            ...prev,
                            parentJob: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Alamat Domisili Siswa
                    </label>
                    <input
                      type="text"
                      placeholder="Jl. Tadulako No. 12, Besusu Tengah"
                      value={newForm.parentAddress}
                      onChange={(e) =>
                        setNewForm((prev) => ({
                          ...prev,
                          parentAddress: e.target.value,
                        }))
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
                  >
                    Simpan Pendaftar
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL 4: Dialog Kredensial Persetujuan Siswa & Wali */}
      <Dialog.Root
        open={Boolean(credentialsModalData)}
        onOpenChange={(open) => !open && setCredentialsModalData(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 shadow-xl space-y-5 my-8 max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <div className="flex items-start justify-between border-b border-[#D2D2D2] pb-3.5">
                <div>
                  <Dialog.Title className="font-display font-bold text-base text-[#000000] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#CB2957]" />
                    <span>Kredensial Akses Akun Siswa & Wali</span>
                  </Dialog.Title>
                  <p className="text-xs text-[#555555] mt-0.5">
                    Pendaftaran resmi disetujui. Kirimkan detail akun login berikut kepada siswa dan orang tua murid.
                  </p>
                </div>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] cursor-pointer"
                      onClick={() => setCredentialsModalData(null)}
                      aria-label="Tutup dialog kredensial"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {credentialsModalData && (
                <div className="space-y-4 text-xs">
                  {/* Card 1: Akun Siswa */}
                  <div className="p-4 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-[#D2D2D2] gap-2 flex-wrap">
                      <span className="font-bold text-[#000000] text-xs uppercase tracking-wide flex items-center gap-1.5 shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 text-[#000000]" />
                        <span>Akun Portal Siswa</span>
                      </span>
                      <span className="text-[11px] font-semibold text-[#166534] truncate max-w-[200px]">
                        {credentialsModalData.className}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Nama Siswa:</span>
                        <strong className="text-[#000000] font-medium block truncate" title={credentialsModalData.studentName}>
                          {credentialsModalData.studentName}
                        </strong>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Nomor Induk Siswa (NIS):</span>
                        <span className="font-mono text-[#000000] font-semibold block select-all">
                          {credentialsModalData.studentNis}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Email Login:</span>
                        <span className="font-mono text-[#000000] block break-all select-all">
                          {credentialsModalData.studentEmail}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Kata Sandi Sementara:</span>
                        <span className="font-mono text-[#CB2957] font-bold block select-all">
                          {credentialsModalData.studentPassword}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Akun Wali */}
                  <div className="p-4 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-[#D2D2D2] gap-2 flex-wrap">
                      <span className="font-bold text-[#000000] text-xs uppercase tracking-wide flex items-center gap-1.5 shrink-0">
                        <Users className="w-3.5 h-3.5 text-[#000000]" />
                        <span>Akun Portal Orang Tua / Wali</span>
                      </span>
                      <span className="text-[11px] text-[#555555] font-mono shrink-0">
                        WA: {credentialsModalData.parentPhone}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Nama Wali:</span>
                        <strong className="text-[#000000] font-medium block truncate" title={credentialsModalData.parentName}>
                          {credentialsModalData.parentName}
                        </strong>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Email Login:</span>
                        <span className="font-mono text-[#000000] block break-all select-all">
                          {credentialsModalData.parentEmail}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Kata Sandi Sementara:</span>
                        <span className="font-mono text-[#CB2957] font-bold block select-all">
                          {credentialsModalData.parentPassword}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[#555555] block text-[11px]">Hak Pemantauan:</span>
                        <span className="text-[#000000] block">Presensi Real-Time, Rapor & Tagihan</span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Copy Template Box */}
                  <div className="p-3.5 bg-[#F6F6F6] rounded-[8px] border border-[#D2D2D2] text-[11px] text-[#555555] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="min-w-0 leading-relaxed">
                      Salin format pesan siap kirim untuk disampaikan langsung kepada orang tua siswa melalui WhatsApp.
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyWhatsAppTemplate}
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[6px] transition-colors cursor-pointer"
                    >
                      {isTemplateCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#166534]" />
                          <span>Format Disalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Format WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                    <button
                      type="button"
                      onClick={() => setCredentialsModalData(null)}
                      className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[8px] transition-colors cursor-pointer"
                    >
                      Tutup & Selesai
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
