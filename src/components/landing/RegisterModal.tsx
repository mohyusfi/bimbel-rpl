import * as React from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X, CheckCircle2, Clock, ArrowRight, UserPlus, AlertCircle, Copy, Check } from 'lucide-react'
import { adminStore, type PackageCode } from '~/lib/admin-store'
import { StatusBadge } from '~/components/ui/status-badge'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '~/lib/supabase/client'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  defaultPackage?: string
}

const PACKAGE_OPTIONS = [
  { value: 'UTBK', label: 'Intensif UTBK-SNBT' },
  { value: 'SMA', label: 'SMA Sukses' },
  { value: 'SMP', label: 'SMP Prestasi' },
  { value: 'SD', label: 'SD Cendekia' },
] as const

const INITIAL_FORM_DATA = {
  studentName: '',
  studentEmail: '',
  studentPhone: '',
  studentSchool: '',
  studentPackage: 'UTBK',
  parentName: '',
  parentEmail: '',
  parentPhone: '',
  parentAddress: '',
}

export function RegisterModal({
  isOpen,
  onClose,
  defaultPackage = 'UTBK',
}: RegisterModalProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = React.useState(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [submittedTicket, setSubmittedTicket] = React.useState<{
    id: string
    studentName: string
    packageName: string
    studentSchool: string
    parentName: string
    parentPhone: string
    parentEmail: string
  } | null>(null)
  const [isCopied, setIsCopied] = React.useState(false)

  React.useEffect(() => {
    if (defaultPackage) {
      setFormData((prev) => ({ ...prev, studentPackage: defaultPackage }))
    }
  }, [defaultPackage, isOpen])

  // Reset state when modal is closed
  const handleClose = () => {
    if (isSubmitting) return
    onClose()
    setTimeout(() => {
      setSubmittedTicket(null)
      setErrorMessage(null)
      setFormData(INITIAL_FORM_DATA)
      setIsCopied(false)
    }, 200)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    if (errorMessage) setErrorMessage(null)
  }

  const validatePhone = (phone: string) => {
    const clean = phone.replace(/[^0-9+]/g, '')
    return clean.length >= 10 && clean.length <= 15
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // 1. Validasi nomor telepon
    if (!validatePhone(formData.studentPhone)) {
      setErrorMessage('Nomor WhatsApp siswa tidak valid (minimal 10 digit, contoh: 081244556677).')
      return
    }
    if (!validatePhone(formData.parentPhone)) {
      setErrorMessage('Nomor WhatsApp orang tua tidak valid (minimal 10 digit, contoh: 081244556677).')
      return
    }

    // 2. Validasi keunikan email siswa terhadap pendaftar & siswa aktif
    const currentAdminState = adminStore.getState()
    const emailLower = formData.studentEmail.trim().toLowerCase()
    const duplicateReg = currentAdminState.registrations.some(
      (r) => r.studentEmail.toLowerCase() === emailLower && r.status === 'menunggu'
    )
    if (duplicateReg) {
      setErrorMessage(
        'Email calon siswa ini sedang menunggu verifikasi oleh Tata Usaha. Mohon tunggu proses validasi.'
      )
      return
    }

    const duplicateStudent = currentAdminState.students.some(
      (s) => s.email.toLowerCase() === emailLower
    )
    if (duplicateStudent) {
      setErrorMessage('Email ini telah terdaftar sebagai siswa aktif di Tadulako Cendekia.')
      return
    }

    setIsSubmitting(true)

    try {
      const pkgLabels: Record<string, string> = {
        UTBK: 'Intensif UTBK-SNBT',
        SMA: 'SMA Sukses',
        SMP: 'SMP Prestasi',
        SD: 'SD Cendekia',
      }
      const packageName = pkgLabels[formData.studentPackage] || 'Intensif UTBK-SNBT'

      const newRegistration = adminStore.addRegistration({
        studentName: formData.studentName.trim(),
        studentEmail: formData.studentEmail.trim(),
        studentPhone: formData.studentPhone.trim(),
        studentSchool: formData.studentSchool.trim(),
        packageCode: formData.studentPackage as PackageCode,
        packageName,
        parentName: formData.parentName.trim(),
        parentEmail: formData.parentEmail.trim(),
        parentPhone: formData.parentPhone.trim(),
        parentAddress: formData.parentAddress.trim() || 'Kota Palu',
      })

      // Sinkronisasi pendaftaran langsung ke tabel registrations Supabase (graceful error handling)
      try {
        await supabase.from('registrations').insert([{
          student_name: formData.studentName.trim(),
          student_email: formData.studentEmail.trim(),
          student_phone: formData.studentPhone.trim(),
          student_school: formData.studentSchool.trim(),
          package_code: formData.studentPackage,
          package_name: packageName,
          parent_name: formData.parentName.trim(),
          parent_email: formData.parentEmail.trim() || null,
          parent_phone: formData.parentPhone.trim(),
          parent_address: formData.parentAddress.trim() || 'Kota Palu',
          status: 'menunggu',
        }])
      } catch (err) {
        console.info('Supabase registration insert local fallback:', err)
      }

      // Tampilkan tiket konfirmasi sukses tanpa browser alert kasar
      setSubmittedTicket({
        id: newRegistration.id,
        studentName: newRegistration.studentName,
        packageName: newRegistration.packageName,
        studentSchool: newRegistration.studentSchool,
        parentName: newRegistration.parentName,
        parentPhone: newRegistration.parentPhone,
        parentEmail: newRegistration.parentEmail,
      })
    } catch {
      setErrorMessage('Gagal menyimpan pendaftaran. Silakan periksa kembali isian formulir.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyTicket = () => {
    if (!submittedTicket) return
    const text = `Nomor Pendaftaran: ${submittedTicket.id}\nNama Calon Siswa: ${submittedTicket.studentName}\nPaket Bimbel: ${submittedTicket.packageName}\nStatus: Menunggu Verifikasi Admin`
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleGoToLogin = () => {
    handleClose()
    navigate({ to: '/masuk' as any })
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-overlay active" />
        <Dialog.Viewport className="modal-overlay active">
          <Dialog.Popup
            className="modal-dialog max-w-xl max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="regTitle"
          >
            {/* Header Modal */}
            <div className="modal-header">
              <div>
                <Dialog.Title render={<h2 id="regTitle" className="font-display text-xl font-bold text-[#000000]" />}>
                  {submittedTicket ? 'Pendaftaran Berhasil Diterima' : 'Pendaftaran Calon Siswa Baru'}
                </Dialog.Title>
                <Dialog.Description render={<p className="text-xs text-[#555555] mt-0.5" />}>
                  {submittedTicket
                    ? 'Berkas pendaftaran Anda telah tercatat dalam sistem dan menunggu verifikasi admin.'
                    : 'Isi identitas calon siswa dan kontak orang tua/wali untuk verifikasi kuota kelas.'}
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={
                  <button
                    type="button"
                    className="modal-close-btn cursor-pointer"
                    aria-label="Tutup formulir"
                    onClick={handleClose}
                  />
                }
              >
                <X className="lucide" />
              </Dialog.Close>
            </div>

            {/* Konten Modal: Layanan Berhasil / Formulir */}
            {submittedTicket ? (
              <div className="p-5 sm:p-6 space-y-5 text-xs">
                {/* Status Box */}
                <div className="p-4 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#D2D2D2]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#555555]">
                      Tiket Pendaftaran
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#000000] tabular-nums">
                      {submittedTicket.id}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#555555]">Status Verifikasi:</span>
                      <StatusBadge status="menunggu" label="Menunggu Verifikasi" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#555555]">Nama Calon Siswa:</span>
                      <strong className="text-[#000000] font-medium">{submittedTicket.studentName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#555555]">Asal Sekolah:</span>
                      <span className="text-[#000000]">{submittedTicket.studentSchool}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#555555]">Pilihan Paket:</span>
                      <strong className="text-[#A81E46] font-medium">{submittedTicket.packageName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#555555]">Orang Tua / Wali:</span>
                      <span className="text-[#000000]">{submittedTicket.parentName} ({submittedTicket.parentPhone})</span>
                    </div>
                  </div>
                </div>

                {/* Information Card */}
                <div className="p-3.5 bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] space-y-1.5 leading-relaxed text-[#555555]">
                  <p className="font-semibold text-[#000000]">Tahapan Selanjutnya:</p>
                  <p>
                    1. Staf Tata Usaha Tadulako Cendekia akan memeriksa ketersediaan kursi rombel sesuai paket bimbingan.
                  </p>
                  <p>
                    2. Setelah diverifikasi dan diplot ke kelas, kredensial akun portal (Nomor Induk Siswa & Kata Sandi) akan dikirimkan otomatis ke WhatsApp orang tua di nomor <strong className="text-[#000000] font-mono">{submittedTicket.parentPhone}</strong>.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    onClick={handleCopyTicket}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] hover:bg-[#F6F6F6] rounded-[8px] transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#166534]" />
                        <span>Nomor Tiket Disalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#555555]" />
                        <span>Salin Nomor Tiket</span>
                      </>
                    )}
                  </button>

                  <div className="w-full sm:w-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGoToLogin}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#292524] bg-[#F6F6F6] hover:bg-[#EAEAEA] border border-[#D2D2D2] rounded-[8px] transition-colors cursor-pointer"
                    >
                      <span>Lihat Halaman Masuk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[8px] transition-colors cursor-pointer"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form id="regForm" onSubmit={handleSubmit}>
                <div className="modal-body space-y-4">
                  {errorMessage && (
                    <div
                      className="p-3 bg-[#F6E7E3] border border-[#901B14]/30 rounded-[8px] flex items-start gap-2.5 text-xs text-[#901B14]"
                      role="alert"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <h3 className="lp-form-section">Data Calon Siswa</h3>

                  <div className="form-group">
                    <label
                      className="form-label form-label-required"
                      htmlFor="studentName"
                    >
                      Nama lengkap siswa
                    </label>
                    <input
                      type="text"
                      id="studentName"
                      className="form-input"
                      placeholder="Contoh: Muhammad Rafly"
                      autoComplete="name"
                      value={formData.studentName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label
                        className="form-label form-label-required"
                        htmlFor="studentEmail"
                      >
                        Email siswa
                      </label>
                      <input
                        type="email"
                        id="studentEmail"
                        className="form-input"
                        placeholder="nama@email.com"
                        autoComplete="email"
                        value={formData.studentEmail}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label
                        className="form-label form-label-required"
                        htmlFor="studentPhone"
                      >
                        WhatsApp siswa
                      </label>
                      <input
                        type="tel"
                        id="studentPhone"
                        className="form-input font-mono"
                        placeholder="0812-xxxx-xxxx"
                        autoComplete="tel"
                        value={formData.studentPhone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label
                        className="form-label form-label-required"
                        htmlFor="studentSchool"
                      >
                        Sekolah asal
                      </label>
                      <input
                        type="text"
                        id="studentSchool"
                        className="form-input"
                        placeholder="Contoh: SMAN 1 Palu"
                        value={formData.studentSchool}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label
                        className="form-label form-label-required"
                        htmlFor="studentPackage"
                      >
                        Pilihan paket bimbingan
                      </label>
                      <select
                        id="studentPackage"
                        className="form-select"
                        value={formData.studentPackage}
                        onChange={handleChange}
                        required
                      >
                        {PACKAGE_OPTIONS.map((pkg) => (
                          <option key={pkg.value} value={pkg.value}>
                            {pkg.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <h3 className="lp-form-section">Data Orang Tua / Wali</h3>

                  <div className="form-group">
                    <label
                      className="form-label form-label-required"
                      htmlFor="parentName"
                    >
                      Nama lengkap orang tua / wali
                    </label>
                    <input
                      type="text"
                      id="parentName"
                      className="form-input"
                      placeholder="Contoh: Ir. H. Ahmad Dahlan"
                      value={formData.parentName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label
                        className="form-label form-label-required"
                        htmlFor="parentEmail"
                      >
                        Email orang tua / wali
                      </label>
                      <input
                        type="email"
                        id="parentEmail"
                        className="form-input"
                        placeholder="ortu@email.com"
                        value={formData.parentEmail}
                        onChange={handleChange}
                        required
                      />
                      <span className="form-helper">
                        Digunakan untuk akses portal wali murid
                      </span>
                    </div>
                    <div className="form-group">
                      <label
                        className="form-label form-label-required"
                        htmlFor="parentPhone"
                      >
                        WhatsApp orang tua / wali
                      </label>
                      <input
                        type="tel"
                        id="parentPhone"
                        className="form-input font-mono"
                        placeholder="0812-xxxx-xxxx"
                        value={formData.parentPhone}
                        onChange={handleChange}
                        required
                      />
                      <span className="form-helper">
                        Untuk notifikasi presensi harian & penerbitan kredensial
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="parentAddress">
                      Alamat domisili
                    </label>
                    <input
                      type="text"
                      id="parentAddress"
                      className="form-input"
                      placeholder="Contoh: Jl. Tadulako No. 12, Besusu Tengah"
                      value={formData.parentAddress}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <Dialog.Close
                    render={
                      <button
                        type="button"
                        className="btn btn-outline cursor-pointer"
                        onClick={handleClose}
                      />
                    }
                  >
                    Batal
                  </Dialog.Close>
                  <button
                    type="submit"
                    id="submitRegBtn"
                    className="btn btn-accent cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Memproses Pendaftaran...' : 'Kirim Pendaftaran'}
                  </button>
                </div>
              </form>
            )}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
