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
} from 'lucide-react'
import { useAuth } from '~/hooks/use-auth'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import type { AdminStaffMember } from '~/lib/auth-store'

export const Route = createFileRoute('/admin/staf')({
  ssr: false,
  component: AdminStafPage,
})

function AdminStafPage() {
  const { isSuperAdmin, adminStaff = [], createAdminStaff } = useAuth()

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    isSuperAdmin: false,
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [formSuccess, setFormSuccess] = React.useState<string | null>(null)

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

  // Perhitungan Metrik KPI
  const totalStaff = adminStaff.length
  const superAdminCount = adminStaff.filter((s) => s.isSuperAdmin).length
  const regularStaffCount = adminStaff.filter((s) => !s.isSuperAdmin).length
  const activeStaffCount = adminStaff.filter((s) => s.status === 'aktif').length

  const handleOpenModal = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      isSuperAdmin: false,
    })
    setFormError(null)
    setFormSuccess(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (isSubmitting) return
    setIsModalOpen(false)
    setFormError(null)
    setFormSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    // Validasi dasar
    if (!formData.fullName.trim()) {
      setFormError('Nama lengkap staf wajib diisi.')
      return
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Alamat email staf tidak valid.')
      return
    }
    const cleanPhone = formData.phone.replace(/[^0-9+]/g, '')
    if (cleanPhone.length < 10) {
      setFormError('Nomor telepon minimal 10 digit (contoh: 081245678901).')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createAdminStaff({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || 'password123',
        isSuperAdmin: formData.isSuperAdmin,
      })

      if (!result.success) {
        setFormError(result.error || 'Gagal menambahkan staf admin.')
        setIsSubmitting(false)
        return
      }

      setFormSuccess(
        `Akun staf ${result.staff?.fullName} berhasil didaftarkan.`
      )
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        isSuperAdmin: false,
      })

      // Tutup otomatis setelah feedback singkat
      setTimeout(() => {
        setIsModalOpen(false)
        setFormSuccess(null)
      }, 1500)
    } catch {
      setFormError('Terjadi kesalahan saat menyimpan data staf admin.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          onClick={handleOpenModal}
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
        open={isModalOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
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
                {formError && (
                  <div className="mb-4 p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 text-[#A81E46] text-xs rounded-[8px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="mb-4 p-3 bg-[#166534]/10 border border-[#166534]/30 text-[#166534] text-xs rounded-[8px] flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((prev) => ({
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
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
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
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
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
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
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
                        checked={formData.isSuperAdmin}
                        onChange={(e) =>
                          setFormData((prev) => ({
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
                      onClick={handleCloseModal}
                      disabled={isSubmitting}
                      className="btn btn-secondary cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary bg-[#CB2957] hover:bg-[#A81E46] border-none text-white cursor-pointer"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Akun Staf'}
                    </button>
                  </div>
                </form>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
