import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Dialog } from '@base-ui/react/dialog'
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  CheckCircle2,
  X,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  User,
  Check,
  Pencil,
  UserX,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '~/hooks/use-auth'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { cn } from '~/lib/utils'
import type { AdminStaffMember } from '~/lib/auth-store'

export const Route = createFileRoute('/admin/staf')({
  ssr: false,
  component: AdminStafPage,
})

function AdminStafPage() {
  const {
    isSuperAdmin,
    adminStaff = [],
    createAdminStaff,
    updateAdminStaff,
    toggleAdminStaffStatus,
    user,
  } = useAuth()

  // Modal Tambah Staf Baru
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [addFormData, setAddFormData] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    isSuperAdmin: false,
  })
  const [isAddSubmitting, setIsAddSubmitting] = React.useState(false)
  const [addFormError, setAddFormError] = React.useState<string | null>(null)
  const [addFormSuccess, setAddFormSuccess] = React.useState<string | null>(null)

  // Modal Ubah Data Staf
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingStaff, setEditingStaff] = React.useState<AdminStaffMember | null>(null)
  const [editFormData, setEditFormData] = React.useState({
    fullName: '',
    phone: '',
    password: '',
    isSuperAdmin: false,
  })
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false)
  const [editFormError, setEditFormError] = React.useState<string | null>(null)
  const [editFormSuccess, setEditFormSuccess] = React.useState<string | null>(null)

  // Dialog Konfirmasi Ubah Status
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false)
  const [statusStaff, setStatusStaff] = React.useState<AdminStaffMember | null>(null)
  const [isStatusSubmitting, setIsStatusSubmitting] = React.useState(false)
  const [statusError, setStatusError] = React.useState<string | null>(null)

  // Perhitungan Metrik KPI & Hak Akses
  const totalStaff = adminStaff.length
  const superAdminCount = adminStaff.filter((s) => s.isSuperAdmin).length
  const regularStaffCount = adminStaff.filter((s) => !s.isSuperAdmin).length
  const activeStaffCount = adminStaff.filter((s) => s.status === 'aktif').length
  const activeSuperAdminCount = adminStaff.filter(
    (s) => s.isSuperAdmin && s.status === 'aktif'
  ).length

  // Handlers untuk Tambah Staf
  const handleOpenAddModal = () => {
    setAddFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      isSuperAdmin: false,
    })
    setAddFormError(null)
    setAddFormSuccess(null)
    setIsAddModalOpen(true)
  }

  const handleCloseAddModal = () => {
    if (isAddSubmitting) return
    setIsAddModalOpen(false)
    setAddFormError(null)
    setAddFormSuccess(null)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddFormError(null)
    setAddFormSuccess(null)

    // Validasi dasar
    if (!addFormData.fullName.trim()) {
      setAddFormError('Nama lengkap staf wajib diisi.')
      return
    }
    if (!addFormData.email.trim() || !addFormData.email.includes('@')) {
      setAddFormError('Alamat email staf tidak valid.')
      return
    }
    const cleanPhone = addFormData.phone.replace(/[^0-9+]/g, '')
    if (cleanPhone.length < 10) {
      setAddFormError('Nomor telepon minimal 10 digit (contoh: 081245678901).')
      return
    }

    setIsAddSubmitting(true)

    try {
      const result = await createAdminStaff({
        fullName: addFormData.fullName,
        email: addFormData.email,
        phone: addFormData.phone,
        password: addFormData.password || 'password123',
        isSuperAdmin: addFormData.isSuperAdmin,
      })

      if (!result.success) {
        setAddFormError(result.error || 'Gagal menambahkan staf admin.')
        setIsAddSubmitting(false)
        return
      }

      setAddFormSuccess(`Akun staf ${result.staff?.fullName} berhasil didaftarkan.`)
      // Reset form
      setAddFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        isSuperAdmin: false,
      })

      // Tutup otomatis setelah feedback singkat
      setTimeout(() => {
        setIsAddModalOpen(false)
        setAddFormSuccess(null)
      }, 1500)
    } catch {
      setAddFormError('Terjadi kesalahan saat menyimpan data staf admin.')
    } finally {
      setIsAddSubmitting(false)
    }
  }

  // Handlers untuk Ubah Data Staf
  const handleOpenEditModal = (staff: AdminStaffMember) => {
    setEditingStaff(staff)
    setEditFormData({
      fullName: staff.fullName,
      phone: staff.phone,
      password: '',
      isSuperAdmin: staff.isSuperAdmin,
    })
    setEditFormError(null)
    setEditFormSuccess(null)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    if (isEditSubmitting) return
    setIsEditModalOpen(false)
    setEditFormError(null)
    setEditFormSuccess(null)
    setEditingStaff(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff) return
    setEditFormError(null)
    setEditFormSuccess(null)

    if (!editFormData.fullName.trim()) {
      setEditFormError('Nama lengkap staf wajib diisi.')
      return
    }
    const cleanPhone = editFormData.phone.replace(/[^0-9+]/g, '')
    if (cleanPhone.length < 10) {
      setEditFormError('Nomor telepon minimal 10 digit (contoh: 081245678901).')
      return
    }
    if (editFormData.password.trim() && editFormData.password.trim().length < 6) {
      setEditFormError('Kata sandi baru minimal 6 karakter.')
      return
    }

    setIsEditSubmitting(true)

    try {
      const result = await updateAdminStaff(editingStaff.id, {
        fullName: editFormData.fullName,
        phone: editFormData.phone,
        isSuperAdmin: editFormData.isSuperAdmin,
        password: editFormData.password.trim() || undefined,
      })

      if (!result.success) {
        setEditFormError(result.error || 'Gagal memperbarui data staf.')
        setIsEditSubmitting(false)
        return
      }

      setEditFormSuccess(
        `Data staf ${result.staff?.fullName || editingStaff.fullName} berhasil diperbarui.`
      )
      setTimeout(() => {
        setIsEditModalOpen(false)
        setEditFormSuccess(null)
        setEditingStaff(null)
      }, 1500)
    } catch {
      setEditFormError('Terjadi kesalahan saat menyimpan perubahan data staf.')
    } finally {
      setIsEditSubmitting(false)
    }
  }

  // Handlers untuk Konfirmasi Status Staf
  const handleOpenStatusModal = (staff: AdminStaffMember) => {
    setStatusStaff(staff)
    setStatusError(null)
    setIsStatusModalOpen(true)
  }

  const handleCloseStatusModal = () => {
    if (isStatusSubmitting) return
    setIsStatusModalOpen(false)
    setStatusError(null)
    setStatusStaff(null)
  }

  const handleConfirmStatusToggle = async () => {
    if (!statusStaff) return
    setStatusError(null)
    setIsStatusSubmitting(true)

    const targetStatus = statusStaff.status === 'aktif' ? 'nonaktif' : 'aktif'

    try {
      const result = await toggleAdminStaffStatus(statusStaff.id, targetStatus)
      if (!result.success) {
        setStatusError(result.error || 'Gagal mengubah status staf.')
        setIsStatusSubmitting(false)
        return
      }

      setIsStatusModalOpen(false)
      setStatusStaff(null)
    } catch {
      setStatusError('Terjadi kesalahan saat mengubah status staf.')
    } finally {
      setIsStatusSubmitting(false)
    }
  }

  // Guard: Jika bukan Super Admin, tolak akses dan tampilkan peringatan
  if (!isSuperAdmin) {
    return (
      <div className="py-16 px-4 max-w-lg mx-auto text-center">
        <div className="bg-white border border-[#D2D2D2] rounded-[12px] p-8 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#CB2957]/10 flex items-center justify-center text-[#CB2957] mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-[#000000]">
            Akses Terbatas
          </h2>
          <p className="text-sm text-[#555555] mt-2 leading-relaxed">
            Akses Terbatas: Halaman ini hanya dapat diakses oleh Pimpinan Lembaga / Super Admin.
          </p>
          <div className="mt-6">
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#000000] text-white text-xs font-semibold rounded-[8px] hover:bg-[#222222] transition-colors"
            >
              Kembali ke Dashboard Utama
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Logika disable penonaktifan Super Admin pada form edit
  const isEditingSelf = Boolean(
    user?.email && editingStaff?.email.toLowerCase() === user.email.toLowerCase()
  )
  const isOnlySuperAdmin = isEditingSelf && editingStaff?.isSuperAdmin && activeSuperAdminCount <= 1

  // Kolom TanStack Table (Poster Kontras Tinggi, Zero Fake Buttons, Semantic Text)
  const columns: ColumnDef<AdminStaffMember>[] = [
    {
      accessorKey: 'fullName',
      header: 'Nama staf & peran',
      cell: ({ row }) => {
        const staff = row.original
        return (
          <div className="min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#000000] leading-snug">
                {staff.fullName}
              </span>
              <span className="font-mono text-xs text-[#6B6B6B] tabular-nums">
                {staff.id}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {staff.isSuperAdmin ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#CB2957]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Pimpinan / Super Admin</span>
                </span>
              ) : (
                <span className="text-[11px] text-[#555555]">
                  {staff.roleTitle || 'Staf Tata Usaha'}
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'email',
      header: 'Alamat email',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[#555555] block">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'No. telepon / WhatsApp',
      cell: ({ row }) => (
        <span className="text-sm font-normal text-[#292524] tabular-nums">
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: 'joinDate',
      header: 'Tanggal bergabung',
      cell: ({ row }) => (
        <span className="text-sm font-normal text-[#555555] tabular-nums whitespace-nowrap">
          {row.original.joinDate}
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
        const staff = row.original
        const isCurrentUser = Boolean(
          user?.email && staff.email.toLowerCase() === user.email.toLowerCase()
        )
        const isAktif = staff.status === 'aktif'

        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleOpenEditModal(staff)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[6px] hover:bg-[#F6F6F6] hover:border-[#000000] transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-[#555555]" />
              <span>Edit</span>
            </button>

            {isAktif ? (
              <button
                type="button"
                disabled={isCurrentUser}
                title={isCurrentUser ? 'Akun Anda sedang aktif' : 'Nonaktifkan akun staf ini'}
                onClick={() => !isCurrentUser && handleOpenStatusModal(staff)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[6px] transition-colors',
                  isCurrentUser
                    ? 'text-[#A81E46]/40 border border-[#D2D2D2] cursor-not-allowed bg-transparent'
                    : 'text-[#CB2957] border border-[#CB2957]/30 hover:bg-[#CB2957]/10 cursor-pointer'
                )}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Nonaktifkan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenStatusModal(staff)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#166534] border border-[#166534]/30 hover:bg-[#166534]/10 rounded-[6px] transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Aktifkan</span>
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Halaman (Poster Kontras Tinggi & Editorial Typography) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D2D2D2]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A81E46] block mb-1">
            Sistem & Kepegawaian
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[#000000] tracking-tight leading-tight">
            Manajemen Staf Tata Usaha
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1">
            Kelola hak akses dan akun staf administrasi bimbingan belajar
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#CB2957] hover:bg-[#A81E46] text-white text-xs font-semibold rounded-[8px] transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Staf Admin</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryMetricCard
          title="Total Staf Admin"
          value={totalStaff}
          unit="Akun"
          description="Seluruh personel administrasi terdaftar"
          icon={Users}
          footer={
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#292524]">Kepegawaian</span>
              <span className="text-[11px] text-[#555555]">Tata usaha</span>
            </div>
          }
        />
        <SummaryMetricCard
          title="Pimpinan & Super Admin"
          value={superAdminCount}
          unit="Akun"
          description="Akses penuh konfigurasi & kepegawaian"
          icon={ShieldCheck}
          footer={
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#292524]">Hak Akses</span>
              <span className="text-[11px] text-[#555555]">Penuh</span>
            </div>
          }
        />
        <SummaryMetricCard
          title="Staf Operasional"
          value={regularStaffCount}
          unit="Akun"
          description="Pengelolaan harian jadwal, presensi & SPP"
          icon={UserPlus}
          footer={
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#292524]">Staf TU</span>
              <span className="text-[11px] text-[#555555]">Operasional</span>
            </div>
          }
        />
        <SummaryMetricCard
          title="Akun Aktif"
          value={activeStaffCount}
          unit="Akun"
          description="Personel aktif bertugas di sistem"
          icon={CheckCircle2}
          footer={
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#292524]">Status</span>
              <span className="text-[11px] text-[#555555]">Siap bertugas</span>
            </div>
          }
        />
      </div>

      {/* Tabel Staf Admin */}
      <DataTable
        columns={columns}
        data={adminStaff}
        searchPlaceholder="Cari nama staf, email, atau ID..."
        pageSize={10}
        totalCount={adminStaff.length}
        counterLabel="staf tata usaha"
        emptyState={
          <div className="py-12 text-center text-xs text-[#555555]">
            Belum ada data staf tata usaha tambahan.
          </div>
        }
      />

      {/* Modal Tambah Staf Admin Baru */}
      <Dialog.Root
        open={isAddModalOpen}
        onOpenChange={(open) => !open && handleCloseAddModal()}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="modal-overlay active" />
          <Dialog.Viewport className="modal-overlay active">
            <Dialog.Popup
              className="modal-dialog max-w-lg max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="staffModalTitle"
            >
              <div className="modal-header">
                <div>
                  <Dialog.Title
                    render={
                      <h2
                        id="staffModalTitle"
                        className="font-display text-xl font-bold text-[#000000]"
                      />
                    }
                  >
                    Tambah Staf Admin Baru
                  </Dialog.Title>
                  <Dialog.Description
                    render={<p className="text-xs text-[#555555] mt-0.5" />}
                  >
                    Daftarkan akun staf tata usaha baru untuk mengakses portal administrasi.
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="modal-close-btn cursor-pointer"
                      aria-label="Tutup modal"
                    />
                  }
                >
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </div>

              <div className="modal-body">
                {addFormError && (
                  <div className="mb-4 p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 text-[#A81E46] text-xs rounded-[8px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{addFormError}</span>
                  </div>
                )}

                {addFormSuccess && (
                  <div className="mb-4 p-3 bg-[#166534]/10 border border-[#166534]/30 text-[#166534] text-xs rounded-[8px] flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{addFormSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                  {/* Nama Lengkap */}
                  <div className="space-y-1">
                    <label
                      htmlFor="staffName"
                      className="font-medium text-[#000000] flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-[#555555]" />
                      <span>Nama Lengkap Staf *</span>
                    </label>
                    <input
                      id="staffName"
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Firdaus, S.Kom"
                      value={addFormData.fullName}
                      onChange={(e) =>
                        setAddFormData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  {/* Email & Telepon */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="staffEmail"
                        className="font-medium text-[#000000] flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#555555]" />
                        <span>Alamat Email *</span>
                      </label>
                      <input
                        id="staffEmail"
                        type="email"
                        required
                        placeholder="firdaus.tu@tadulakocendekia.sch.id"
                        value={addFormData.email}
                        onChange={(e) =>
                          setAddFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="staffPhone"
                        className="font-medium text-[#000000] flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#555555]" />
                        <span>No. WhatsApp / Telepon *</span>
                      </label>
                      <input
                        id="staffPhone"
                        type="tel"
                        required
                        placeholder="Contoh: 081244556677"
                        value={addFormData.phone}
                        onChange={(e) =>
                          setAddFormData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                    </div>
                  </div>

                  {/* Kata Sandi Awal */}
                  <div className="space-y-1">
                    <label
                      htmlFor="staffPassword"
                      className="font-medium text-[#000000] flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#555555]" />
                      <span>Kata Sandi Awal</span>
                    </label>
                    <input
                      id="staffPassword"
                      type="text"
                      placeholder="Default: password123 (minimal 6 karakter)"
                      value={addFormData.password}
                      onChange={(e) =>
                        setAddFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    />
                    <p className="text-[11px] text-[#6B6B6B]">
                      Kosongkan bila ingin menggunakan kata sandi standar (password123).
                    </p>
                  </div>

                  {/* Opsi Hak Akses */}
                  <div className="p-3 bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] space-y-2">
                    <span className="font-semibold text-xs text-[#000000] block">
                      Tingkat Hak Akses Sistem
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addFormData.isSuperAdmin}
                        onChange={(e) =>
                          setAddFormData((prev) => ({
                            ...prev,
                            isSuperAdmin: e.target.checked,
                          }))
                        }
                        className="rounded border-[#D2D2D2] text-[#CB2957] focus:ring-[#CB2957]"
                      />
                      <span className="text-xs text-[#292524]">
                        Berikan hak akses <strong>Pimpinan Lembaga / Super Admin</strong> (dapat mengelola staf lain)
                      </span>
                    </label>
                  </div>

                  {/* Footer Modal Action Buttons */}
                  <div className="modal-footer pt-3">
                    <button
                      type="button"
                      onClick={handleCloseAddModal}
                      disabled={isAddSubmitting}
                      className="btn btn-secondary cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isAddSubmitting}
                      className="btn btn-primary bg-[#CB2957] hover:bg-[#A81E46] border-none text-white cursor-pointer"
                    >
                      {isAddSubmitting ? 'Menyimpan...' : 'Simpan Akun Staf'}
                    </button>
                  </div>
                </form>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal Ubah Data Staf Admin */}
      <Dialog.Root
        open={isEditModalOpen}
        onOpenChange={(open) => !open && handleCloseEditModal()}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="modal-overlay active" />
          <Dialog.Viewport className="modal-overlay active">
            <Dialog.Popup
              className="modal-dialog max-w-lg max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="editStaffModalTitle"
            >
              <div className="modal-header">
                <div>
                  <Dialog.Title
                    render={
                      <h2
                        id="editStaffModalTitle"
                        className="font-display text-xl font-bold text-[#000000]"
                      />
                    }
                  >
                    Ubah Data Staf
                  </Dialog.Title>
                  <Dialog.Description
                    render={<p className="text-xs text-[#555555] mt-0.5" />}
                  >
                    Perbarui informasi profil dan hak akses staf tata usaha.
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="modal-close-btn cursor-pointer"
                      aria-label="Tutup modal ubah data"
                    />
                  }
                >
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </div>

              <div className="modal-body">
                {editFormError && (
                  <div className="mb-4 p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 text-[#A81E46] text-xs rounded-[8px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editFormError}</span>
                  </div>
                )}

                {editFormSuccess && (
                  <div className="mb-4 p-3 bg-[#166534]/10 border border-[#166534]/30 text-[#166534] text-xs rounded-[8px] flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{editFormSuccess}</span>
                  </div>
                )}

                {editingStaff && (
                  <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                    {/* Alamat Email (Read-only / Teks Statis) */}
                    <div className="space-y-1">
                      <label className="font-medium text-[#000000] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#555555]" />
                        <span>Alamat Email</span>
                      </label>
                      <div className="py-1">
                        <span className="font-mono text-xs text-[#555555] select-all">
                          {editingStaff.email}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B6B6B]">
                        Alamat email terikat pada identitas Supabase Auth dan tidak dapat diubah langsung.
                      </p>
                    </div>

                    {/* Nama Lengkap */}
                    <div className="space-y-1">
                      <label
                        htmlFor="editStaffName"
                        className="font-medium text-[#000000] flex items-center gap-1.5"
                      >
                        <User className="w-3.5 h-3.5 text-[#555555]" />
                        <span>Nama Lengkap Staf *</span>
                      </label>
                      <input
                        id="editStaffName"
                        type="text"
                        required
                        placeholder="Contoh: Muhammad Firdaus, S.Kom"
                        value={editFormData.fullName}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                    </div>

                    {/* Nomor Telepon / WhatsApp */}
                    <div className="space-y-1">
                      <label
                        htmlFor="editStaffPhone"
                        className="font-medium text-[#000000] flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#555555]" />
                        <span>No. WhatsApp / Telepon *</span>
                      </label>
                      <input
                        id="editStaffPhone"
                        type="tel"
                        required
                        placeholder="Contoh: 081244556677"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                    </div>

                    {/* Kata Sandi Baru (Opsional) */}
                    <div className="space-y-1">
                      <label
                        htmlFor="editStaffPassword"
                        className="font-medium text-[#000000] flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#555555]" />
                        <span>Kata Sandi Baru (Opsional)</span>
                      </label>
                      <input
                        id="editStaffPassword"
                        type="password"
                        placeholder="Biarkan kosong jika tidak ingin mengubah kata sandi"
                        value={editFormData.password}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      />
                      <p className="text-[11px] text-[#6B6B6B]">
                        Biarkan kosong jika tidak ingin mengubah kata sandi. Minimal 6 karakter jika diisi.
                      </p>
                    </div>

                    {/* Opsi Hak Akses */}
                    <div className="p-3 bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] space-y-2">
                      <span className="font-semibold text-xs text-[#000000] block">
                        Tingkat Hak Akses Sistem
                      </span>
                      <label
                        className={cn(
                          'flex items-center gap-2',
                          isOnlySuperAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        )}
                      >
                        <input
                          type="checkbox"
                          disabled={isOnlySuperAdmin}
                          checked={editFormData.isSuperAdmin}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              isSuperAdmin: e.target.checked,
                            }))
                          }
                          className="rounded border-[#D2D2D2] text-[#CB2957] focus:ring-[#CB2957]"
                        />
                        <span className="text-xs text-[#292524]">
                          Hak Akses <strong>Pimpinan Lembaga / Super Admin</strong> (dapat mengelola staf lain)
                        </span>
                      </label>
                      {isOnlySuperAdmin && (
                        <p className="text-[11px] text-[#CB2957] font-medium">
                          Anda adalah satu-satunya Super Admin aktif, hak akses tidak dapat diturunkan.
                        </p>
                      )}
                    </div>

                    {/* Footer Modal Action Buttons */}
                    <div className="modal-footer pt-3">
                      <button
                        type="button"
                        onClick={handleCloseEditModal}
                        disabled={isEditSubmitting}
                        className="btn btn-secondary cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isEditSubmitting}
                        className="btn btn-primary bg-[#CB2957] hover:bg-[#A81E46] border-none text-white cursor-pointer"
                      >
                        {isEditSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Konfirmasi Ubah Status */}
      <Dialog.Root
        open={isStatusModalOpen}
        onOpenChange={(open) => !open && handleCloseStatusModal()}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="modal-overlay active" />
          <Dialog.Viewport className="modal-overlay active">
            <Dialog.Popup
              className="modal-dialog max-w-md max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="statusModalTitle"
            >
              <div className="modal-header">
                <div>
                  <Dialog.Title
                    render={
                      <h2
                        id="statusModalTitle"
                        className="font-display text-lg font-bold text-[#000000]"
                      />
                    }
                  >
                    Konfirmasi Ubah Status
                  </Dialog.Title>
                  <Dialog.Description
                    render={<p className="text-xs text-[#555555] mt-0.5" />}
                  >
                    Perubahan status akses akun staf tata usaha.
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="modal-close-btn cursor-pointer"
                      aria-label="Tutup dialog konfirmasi"
                    />
                  }
                >
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </div>

              <div className="modal-body space-y-4">
                {statusError && (
                  <div className="p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 text-[#A81E46] text-xs rounded-[8px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{statusError}</span>
                  </div>
                )}

                {statusStaff && (
                  <p className="text-sm text-[#292524] leading-relaxed">
                    {statusStaff.status === 'aktif' ? (
                      <>
                        Apakah Anda yakin ingin menonaktifkan akun staf{' '}
                        <strong className="text-[#000000]">{statusStaff.fullName}</strong> (
                        <span className="font-mono text-xs text-[#555555]">{statusStaff.email}</span>)?
                        Staf ini tidak akan dapat login ke portal Tata Usaha.
                      </>
                    ) : (
                      <>
                        Apakah Anda yakin ingin mengaktifkan kembali akun staf{' '}
                        <strong className="text-[#000000]">{statusStaff.fullName}</strong> (
                        <span className="font-mono text-xs text-[#555555]">{statusStaff.email}</span>)?
                        Staf ini akan dapat kembali login ke portal Tata Usaha.
                      </>
                    )}
                  </p>
                )}

                <div className="modal-footer pt-3">
                  <button
                    type="button"
                    onClick={handleCloseStatusModal}
                    disabled={isStatusSubmitting}
                    className="btn btn-secondary cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmStatusToggle}
                    disabled={isStatusSubmitting}
                    className={cn(
                      'btn border-none text-white cursor-pointer',
                      statusStaff?.status === 'aktif'
                        ? 'bg-[#CB2957] hover:bg-[#A81E46]'
                        : 'bg-[#166534] hover:bg-[#14532d]'
                    )}
                  >
                    {isStatusSubmitting
                      ? 'Memproses...'
                      : statusStaff?.status === 'aktif'
                      ? 'Ya, Nonaktifkan'
                      : 'Ya, Aktifkan'}
                  </button>
                </div>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
