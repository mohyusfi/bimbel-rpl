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
  Users,
  Clock,
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
import type { Registration, PackageCode } from '~/lib/admin-store'

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
  const { data: registrations = [] } = useAdminRegistrations()
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
  const [rejectionTarget, setRejectionTarget] =
    React.useState<Registration | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState<string>('')

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

  // Open approval modal
  const handleOpenApproval = (reg: Registration) => {
    setApprovalTarget(reg)
    const matchingClasses = classes.filter(
      (c) => c.courseCode === reg.packageCode
    )
    if (matchingClasses.length > 0) {
      setSelectedClassId(matchingClasses[0].id)
    } else {
      setSelectedClassId(classes[0]?.id || '')
    }
  }

  const handleConfirmApproval = async () => {
    if (!approvalTarget || !selectedClassId) return
    await approveRegistration({
      regId: approvalTarget.id,
      classId: selectedClassId,
    })
    setApprovalTarget(null)
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
                {reg.id}
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
            <span className="font-semibold text-xs text-[#1F6B45]">
              {assigned ? `Rombel: ${assigned.name}` : 'Terverifikasi'}
            </span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        searchPlaceholder="Cari nama calon siswa, sekolah, wali, atau ID..."
        filterSlot={
          <>
            <div className="flex items-center gap-2 text-xs">
              <label
                htmlFor="filter-paket"
                className="font-medium text-[#555555]"
              >
                Paket:
              </label>
              <select
                id="filter-paket"
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
              >
                <option value="ALL">Semua Paket</option>
                <option value="UTBK">Intensif UTBK</option>
                <option value="SMA">SMA Sukses</option>
                <option value="SMP">SMP Prestasi</option>
                <option value="SD">SD Cendekia</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label
                htmlFor="filter-status"
                className="font-medium text-[#555555]"
              >
                Status:
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
              >
                <option value="ALL">Semua Status</option>
                <option value="menunggu">Menunggu Verifikasi</option>
                <option value="terverifikasi">Terverifikasi</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          </>
        }
      />

      {/* MODAL 1: Setujui & Plotting Rombel */}
      <Dialog.Root
        open={Boolean(approvalTarget)}
        onOpenChange={(open) => !open && setApprovalTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 shadow-xl space-y-4">
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
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    >
                      {classes
                        .filter(
                          (c) => c.courseCode === approvalTarget.packageCode
                        )
                        .map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} (Terisi {cls.studentCount}/{cls.capacity}{' '}
                            kursi · Tutor: {cls.tutorName})
                          </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-[#555555]">
                      Data siswa dan kontak orang tua otomatis dimasukkan ke direktori Siswa Aktif.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                    <button
                      type="button"
                      onClick={() => setApprovalTarget(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmApproval}
                      className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
                    >
                      Konfirmasi Persetujuan
                    </button>
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
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 shadow-xl space-y-4">
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
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 shadow-xl space-y-4 my-8">
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
    </div>
  )
}
