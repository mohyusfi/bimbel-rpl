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
import { Dialog } from '@base-ui/react/dialog'
import { useAdminMutations } from '~/hooks/use-admin-data'
import { formatRupiah, formatDueDate } from '~/lib/utils'
import { validateReceiptFile } from '~/lib/receipt-validator'
import type { Invoice } from '~/lib/admin-store'

interface UploadProofModalProps {
  invoice: Invoice | null
  isOpen: boolean
  onClose: () => void
  submittedByRole?: 'student' | 'parent'
  submittedByName?: string
}

export function UploadProofModal({
  invoice,
  isOpen,
  onClose,
  submittedByRole = 'student',
  submittedByName = 'Fahri Ramadhan',
}: UploadProofModalProps) {
  const { submitPaymentProof } = useAdminMutations()
  const [copiedAccount, setCopiedAccount] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [selectedBank, setSelectedBank] = React.useState('Bank Syariah Indonesia (BSI)')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setErrorMsg(null)
      setIsSubmitting(false)
    }
  }, [isOpen, invoice?.id])

  if (!invoice) return null

  const handleCopy = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber)
    setCopiedAccount(accountNumber)
    setTimeout(() => setCopiedAccount(null), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateReceiptFile({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    if (!validation.valid) {
      setErrorMsg(validation.error || 'Format berkas atau ukuran tidak valid.')
      return
    }

    setErrorMsg(null)
    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setErrorMsg('Silakan pilih berkas bukti transfer terlebih dahulu.')
      return
    }

    try {
      setIsSubmitting(true)
      await submitPaymentProof({
        invoiceId: invoice.id,
        file: selectedFile,
        fileName: selectedFile.name,
        bankName: selectedBank,
        paymentMethod: `Transfer ${selectedBank}`,
        submittedByRole,
        submittedByName,
      })
      onClose()
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat mengunggah bukti bayar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/55 z-50 backdrop-blur-xs transition-opacity duration-200" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden focus:outline-none">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-[#D2D2D2] bg-[#F6F6F6] flex items-center justify-between">
              <div>
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Unggah Bukti Transfer SPP
                </Dialog.Title>
                <p className="text-xs text-[#555555] mt-0.5">
                  Tagihan: {invoice.id} — {invoice.programName}
                </p>
              </div>
              <Dialog.Close
                render={
                  <button
                    type="button"
                    className="p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#FFFFFF] border border-transparent hover:border-[#D2D2D2] rounded-[6px] transition-colors cursor-pointer"
                    aria-label="Tutup modal"
                  />
                }
              >
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
              {/* Invoice Summary Card */}
              <div className="bg-[#F6F6F6] p-4 rounded-[10px] border border-[#D2D2D2] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#555555]">
                  <span>Total Tagihan:</span>
                  <span className="font-display font-extrabold text-lg text-[#000000] tabular-nums">
                    {formatRupiah(invoice.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#555555] pt-1.5 border-t border-[#D2D2D2]/60">
                  <span>Jatuh Tempo:</span>
                  <span className="font-semibold text-[#000000]">{formatDueDate(invoice.dueDate)}</span>
                </div>
                {invoice.rejectedReason && (
                  <div className="p-2.5 bg-[#FBEAEF] border border-[#CB2957]/30 rounded-[8px] text-xs text-[#A81E46] space-y-1">
                    <strong className="block font-semibold">Alasan Penolakan Sebelumnya:</strong>
                    <p>{invoice.rejectedReason}</p>
                  </div>
                )}
              </div>

              {/* Official Destination Bank Account */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#000000] block">
                  Rekening Resmi Bimbel Tadulako Cendekia:
                </label>
                <div className="p-3 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#000000] text-[#FFFFFF] flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#000000]">BSI (Bank Syariah Indonesia)</p>
                      <p className="text-xs font-mono text-[#555555] mt-0.5">7123-4567-89 a.n. Bimbel Tadulako</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('7123456789')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#000000] bg-[#F6F6F6] hover:bg-[#000000] hover:text-[#FFFFFF] border border-[#D2D2D2] rounded-[6px] transition-colors cursor-pointer"
                  >
                    {copiedAccount === '7123456789' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#166534]" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bank Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#292524] block">
                  Bank Pengirim / Metode Pembayaran:
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                >
                  <option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="Bank Rakyat Indonesia (BRI)">Bank Rakyat Indonesia (BRI)</option>
                  <option value="Bank Central Asia (BCA)">Bank Central Asia (BCA)</option>
                  <option value="Bank Sulteng">Bank Sulteng</option>
                </select>
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#292524] block">
                  Unggah Foto Struk / Bukti Transfer:
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#D2D2D2] hover:border-[#000000] bg-[#F6F6F6]/60 hover:bg-[#FFFFFF] rounded-[10px] p-6 text-center cursor-pointer transition-colors space-y-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="space-y-2">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Pratinjau Struk"
                          className="max-h-36 mx-auto object-contain rounded-[6px] border border-[#D2D2D2]"
                        />
                      ) : (
                        <FileCheck2 className="w-8 h-8 text-[#166534] mx-auto" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-[#000000] truncate max-w-xs mx-auto">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-[#555555]">
                          {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk mengganti berkas
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-8 h-8 text-[#555555] mx-auto" />
                      <p className="text-xs font-semibold text-[#000000]">
                        Klik untuk memilih berkas struk transfer
                      </p>
                      <p className="text-[11px] text-[#555555]">Format JPG, PNG, atau PDF (Maks. 5 MB)</p>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <p className="text-xs text-[#901B14] font-medium flex items-center gap-1.5 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#D2D2D2] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#555555] hover:text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[8px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Kirim Bukti Pembayaran</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
