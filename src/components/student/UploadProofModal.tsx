import * as React from 'react'
import {
  Upload,
  Copy,
  Check,
  Building2,
  FileCheck2,
  AlertCircle,
  X,
  CreditCard,
  Loader2,
} from 'lucide-react'
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogCloseButton,
} from '~/components/ui/dialog'
import type { InvoiceRecord } from '~/lib/mock-student-data'

interface UploadProofModalProps {
  invoice: InvoiceRecord | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (invoiceId: string) => void
}

export function UploadProofModal({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}: UploadProofModalProps) {
  const [copiedAccount, setCopiedAccount] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Reset states when modal is opened/closed
  React.useEffect(() => {
    if (isOpen) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setErrorMsg(null)
      setIsSubmitting(false)
    }
  }, [isOpen, invoice?.id])

  if (!invoice) return null

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const handleCopy = (accountNumber: string, bank: string) => {
    navigator.clipboard.writeText(accountNumber)
    setCopiedAccount(bank)
    setTimeout(() => {
      setCopiedAccount(null)
    }, 2500)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 5 MB.')
      return
    }

    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setErrorMsg('Silakan pilih berkas bukti transfer terlebih dahulu.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    // Simulate upload delay
    setTimeout(() => {
      setIsSubmitting(false)
      onSuccess(invoice.id)
      onClose()
    }, 800)
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[92vh] flex flex-col p-0 bg-white border border-[#D2D2D2] rounded-[14px] shadow-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 border-b border-[#D2D2D2] bg-[#F6F6F6] flex-shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-[#000000] text-white">
                <CreditCard className="w-3.5 h-3.5" />
                Konfirmasi Pembayaran SPP
              </span>
              <span className="text-xs font-mono text-[#555555]">
                {invoice.number}
              </span>
            </div>
            <DialogTitle className="text-lg font-bold font-archivo text-[#000000] tracking-tight">
              Unggah Bukti Transfer Bank
            </DialogTitle>
            <p className="text-xs text-[#555555] font-instrument mt-0.5">
              Periode: <strong>{invoice.period}</strong> · Tagihan:{' '}
              <strong className="text-[#CB2957]">{formatRupiah(invoice.amount)}</strong>
            </p>
          </div>
          <DialogCloseButton className="text-[#555555] hover:text-[#000000] hover:bg-[#E3E3E3] rounded-[6px]" />
        </DialogHeader>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Rekening Tujuan Box */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold font-archivo text-[#000000] uppercase tracking-wider block">
              Rekening Resmi Bimbingan Belajar
            </label>
            <p className="text-xs text-[#555555] font-instrument">
              Silakan transfer tepat sebesar{' '}
              <strong className="text-[#000000] font-mono">{formatRupiah(invoice.amount)}</strong> ke salah satu rekening resmi di bawah:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bank BNI */}
              <div className="p-3.5 bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] space-y-1.5 hover:border-black transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#CB2957]" />
                    <span className="font-archivo font-bold text-xs text-[#000000]">
                      Bank BNI
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('08234567890', 'BNI')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#000000] bg-white border border-[#D2D2D2] rounded-[6px] hover:bg-[#E3E3E3] transition-colors cursor-pointer"
                  >
                    {copiedAccount === 'BNI' ? (
                      <>
                        <Check className="w-3 h-3 text-black" />
                        <span className="text-black font-bold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-[#000000]">
                  0823-4567-890
                </div>
                <div className="text-[11px] text-[#555555]">
                  a.n. <strong className="text-[#000000]">Bimbel Tadulako Cendekia</strong>
                </div>
              </div>

              {/* Bank BSI */}
              <div className="p-3.5 bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] space-y-1.5 hover:border-black transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-black" />
                    <span className="font-archivo font-bold text-xs text-[#000000]">
                      Bank BSI (Syariah)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('7123456789', 'BSI')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#000000] bg-white border border-[#D2D2D2] rounded-[6px] hover:bg-[#E3E3E3] transition-colors cursor-pointer"
                  >
                    {copiedAccount === 'BSI' ? (
                      <>
                        <Check className="w-3 h-3 text-black" />
                        <span className="text-black font-bold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-[#000000]">
                  7123-4567-89
                </div>
                <div className="text-[11px] text-[#555555]">
                  a.n. <strong className="text-[#000000]">Bimbel Tadulako Cendekia</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-archivo text-[#000000] uppercase tracking-wider block">
              Berkas Struk / Tangkapan Layar Bukti Transfer <span className="text-[#CB2957]">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              id="proof-upload"
              accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D2D2D2] hover:border-black bg-[#F6F6F6] hover:bg-[#EEEEEE] rounded-[10px] p-6 text-center cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-[#EEEEEE] flex items-center justify-center text-[#555555] mb-2">
                  <Upload className="w-5 h-5 text-[#CB2957]" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#000000] font-archivo">
                  Klik di sini untuk memilih foto struk atau drag &amp; drop
                </p>
                <p className="text-[11px] text-[#555555] mt-1">
                  Format gambar JPG, PNG, WEBP, atau PDF (maksimal 5 MB)
                </p>
              </div>
            ) : (
              <div className="p-3 bg-white border border-[#D2D2D2] rounded-[10px] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileCheck2 className="w-5 h-5 text-black shrink-0" />
                    <div className="truncate text-left">
                      <p className="text-xs font-bold text-[#000000] truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-[#555555]">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 text-[#555555] hover:text-[#CB2957] hover:bg-neutral-100 rounded-[6px] transition-colors cursor-pointer"
                    title="Hapus berkas"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Image Preview */}
                {previewUrl && (
                  <div className="relative border border-[#E0E0E0] rounded-[6px] overflow-hidden bg-neutral-900/5 max-h-52 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Pratinjau Bukti Transfer"
                      className="object-contain w-full max-h-52"
                    />
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-[#A1301C] bg-white p-2.5 rounded-[6px] border-2 border-[#A1301C]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Notes on Verification */}
          <div className="p-3.5 bg-[#EEEEEE] rounded-[8px] text-[11px] text-[#555555] space-y-1 font-instrument">
            <div className="font-bold text-[#000000] flex items-center gap-1.5">
              <span>Alur Verifikasi Pembayaran</span>
            </div>
            <p>
              1. Setelah tombol konfirmasi diklik, status tagihan otomatis menjadi{' '}
              <strong className="text-[#000000]">&quot;Menunggu Verifikasi Admin&quot;</strong>.
            </p>
            <p>
              2. Petugas Tata Usaha memvalidasi mutasi bank maksimal 1x24 jam kerja.
            </p>
            <p>
              3. Kwitansi resmi lunas berstempel digital akan langsung terbit di halaman ini setelah verifikasi selesai.
            </p>
          </div>

          {/* Footer inside form */}
          <DialogFooter className="p-0 pt-3 border-t border-[#D2D2D2] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#000000] bg-white border border-[#D2D2D2] rounded-[8px] hover:bg-[#E3E3E3] transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={!selectedFile || isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#CB2957] hover:bg-[#B3214B] rounded-[8px] transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Bukti...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Kirim Konfirmasi Pembayaran</span>
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
