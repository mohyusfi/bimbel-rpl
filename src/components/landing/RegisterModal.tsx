import * as React from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'

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
}

export function RegisterModal({
  isOpen,
  onClose,
  defaultPackage = 'UTBK',
}: RegisterModalProps) {
  const [formData, setFormData] = React.useState(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [submitText, setSubmitText] = React.useState('Kirim Pendaftaran')

  React.useEffect(() => {
    if (defaultPackage) {
      setFormData((prev) => ({ ...prev, studentPackage: defaultPackage }))
    }
  }, [defaultPackage, isOpen])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitText('Memproses...')

    setTimeout(() => {
      setIsSubmitted(true)
      setSubmitText('Terkirim')

      setTimeout(() => {
        onClose()
        setIsSubmitted(false)
        setIsSubmitting(false)
        setSubmitText('Kirim Pendaftaran')
        setFormData(INITIAL_FORM_DATA)
        alert(
          'Pendaftaran berhasil diterima! Kredensial akun akan diverifikasi oleh Admin Bimbel Kota Palu.'
        )
      }, 1400)
    }, 600)
  }

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-overlay active" />
        <Dialog.Viewport className="modal-overlay active">
          <Dialog.Popup
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="regTitle"
          >
            <div className="modal-header">
              <div>
                <Dialog.Title render={<h2 id="regTitle" />}>
                  Daftar siswa baru
                </Dialog.Title>
                <Dialog.Description render={<p />}>
                  Isi data anak dan kontak orang tua. Admin akan menghubungi Anda lewat WhatsApp.
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={
                  <button
                    type="button"
                    className="modal-close-btn"
                    aria-label="Tutup formulir"
                  />
                }
              >
                <X className="lucide" />
              </Dialog.Close>
            </div>

            <form id="regForm" onSubmit={handleSubmit}>
              <div className="modal-body">
                <h3 className="lp-form-section">Data siswa</h3>

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
                      className="form-input"
                      placeholder="0821-xxxx-xxxx"
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
                      Paket
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

                <h3 className="lp-form-section">Data orang tua / wali</h3>

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
                    placeholder="Contoh: Ahmad Dahlan"
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
                      Email orang tua
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
                      Untuk masuk ke halaman orang tua
                    </span>
                  </div>
                  <div className="form-group">
                    <label
                      className="form-label form-label-required"
                      htmlFor="parentPhone"
                    >
                      WhatsApp orang tua
                    </label>
                    <input
                      type="tel"
                      id="parentPhone"
                      className="form-input"
                      placeholder="0812-xxxx-xxxx"
                      value={formData.parentPhone}
                      onChange={handleChange}
                      required
                    />
                    <span className="form-helper">
                      Untuk kabar kehadiran anak
                    </span>
                  </div>
                </div>

                {isSubmitted && (
                  <div
                    id="regSuccessAlert"
                    className="lp-form-success"
                    role="status"
                  >
                    <strong>Pendaftaran terkirim</strong>
                    Admin akan mengecek kursi yang tersedia dan menghubungi Anda lewat WhatsApp.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleClose}
                    />
                  }
                >
                  Batal
                </Dialog.Close>
                <button
                  type="submit"
                  id="submitRegBtn"
                  className="btn btn-accent"
                  disabled={isSubmitting}
                >
                  {submitText}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
