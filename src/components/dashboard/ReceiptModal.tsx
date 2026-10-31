import * as React from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Printer, X, CheckCircle2 } from 'lucide-react'
import type { Invoice } from '~/lib/admin-store'
import { formatDueDate } from '~/lib/utils'

interface ReceiptModalProps {
  invoice: Invoice | null
  isOpen: boolean
  onClose: () => void
}

export function ReceiptModal({ invoice, isOpen, onClose }: ReceiptModalProps) {
  if (!invoice) return null

  const handlePrint = () => {
    window.print()
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs transition-opacity print:hidden" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:static">
          <Dialog.Popup className="relative w-full max-w-xl bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] shadow-xl overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full">
            {/* Modal Action Bar (Hidden on print) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D2D2D2] bg-[#F6F6F6] print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider text-stone-600 uppercase">
                  Pratinjau Dokumen
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kwitansi (PDF)</span>
                </button>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#E3E3E3] rounded-[6px] transition-colors"
                      aria-label="Tutup jendela kwitansi"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>
            </div>

            {/* Printable Receipt Canvas */}
            <div className="receipt-container p-8 sm:p-10 space-y-6 text-[#000000] font-sans print:p-8">
              {/* Receipt Header */}
              <div className="border-b-2 border-[#000000] pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="font-display font-extrabold text-xl tracking-tight text-[#000000]">
                    PINTAR YUK
                  </h1>
                  <p className="text-xs text-[#555555] mt-0.5">
                    Lembaga Bimbingan Belajar SD, SMP, SMA & Intensif UTBK-SNBT
                  </p>
                  <p className="text-[11px] text-[#555555] mt-1">
                    Jl. Soekarno-Hatta, Kampus Bumi Tadulako, Kota Palu, Sulawesi Tengah 94118
                    <br />
                    WhatsApp Tata Usaha: 0821-9988-7766 · Email: admin@pintaryuk.id
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0FDF4] text-[#166534] border border-[#166534]/30 rounded-[6px] text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                    <span>Kwitansi Resmi Lunas</span>
                  </div>
                  <p className="text-xs text-stone-600 mt-2 font-mono tabular-nums font-semibold">
                    {invoice.receiptNumber || `KWT-${invoice.id}`}
                  </p>
                </div>
              </div>

              {/* Receipt Body Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#555555] block">Telah diterima dari:</span>
                  <span className="font-bold text-sm text-[#000000] block mt-0.5">
                    {invoice.studentName}
                  </span>
                  <span className="text-[#555555] tabular-nums mt-0.5 block">
                    NIS: {invoice.nis || '-'}
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-[#555555] block">Tanggal Verifikasi (WITA):</span>
                  <span className="font-medium text-[#000000] block mt-0.5 tabular-nums">
                    {invoice.verifiedAt || '17 Oktober 2026, 14:20 WITA'}
                  </span>
                  <span className="text-[#555555] block mt-0.5">
                    Metode: {invoice.paymentMethod || 'Transfer Bank'}
                  </span>
                </div>
              </div>

              {/* Transaction Item Breakdown */}
              <div className="border border-[#D2D2D2] rounded-[10px] overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F6F6F6] border-b border-[#D2D2D2] text-[#292524] font-medium">
                    <tr>
                      <th className="px-4 py-2.5">Rincian pembayaran</th>
                      <th className="px-4 py-2.5">Program / jenjang</th>
                      <th className="px-4 py-2.5 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D2D2D2]">
                    <tr>
                      <td className="px-4 py-3">
                        <span className="font-semibold block">
                          Biaya Bimbingan SPP Bulanan
                        </span>
                        <span className="text-[11px] text-[#555555]">
                          No. Tagihan: <span className="tabular-nums font-mono">{invoice.invoiceNumber || invoice.id}</span> · Jatuh Tempo: <span className="tabular-nums">{formatDueDate(invoice.dueDate)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#555555]">
                        {invoice.programName}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatRupiah(invoice.amount)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-[#F6F6F6] border-t border-[#D2D2D2]">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 font-bold text-stone-900 text-sm">
                        Total pembayaran
                      </td>
                      <td className="px-4 py-3 text-right font-display font-bold text-base text-[#000000] tabular-nums">
                        {formatRupiah(invoice.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Terbilang Note */}
              <div className="p-3 bg-[#F6F6F6] rounded-[8px] border border-[#D2D2D2] text-xs">
                <span className="font-medium text-[#555555]">Catatan: </span>
                <span className="italic text-stone-800">
                  Pembayaran SPP bimbingan belajar telah terverifikasi sah di sistem tata usaha Pintar Yuk Palu.
                </span>
              </div>

              {/* Signature Footer */}
              <div className="pt-4 flex items-end justify-between text-xs">
                <div>
                  <p className="text-[11px] text-[#555555]">
                    Dokumen ini sah diterbitkan secara digital oleh
                    <br />
                    Sistem Informasi Pintar Yuk Kota Palu.
                  </p>
                </div>
                <div className="text-center w-48 relative">
                  <p className="text-[#555555] mb-2">
                    Palu, {invoice.verifiedAt ? invoice.verifiedAt.split(',')[0] : '17 Oktober 2026'}
                    <br />
                    Petugas Tata Usaha,
                  </p>

                  {/* Stempel Resmi Pintar Yuk */}
                  <div className="my-1 flex justify-center">
                    <div className="border-2 border-double border-[#166534] text-[#166534] px-2.5 py-1 rounded-[6px] -rotate-6 select-none bg-white/90 shadow-2xs">
                      <p className="text-[8px] font-extrabold uppercase tracking-widest leading-none text-center">
                        PINTAR YUK
                      </p>
                      <p className="text-[12px] font-black tracking-widest leading-tight text-center my-0.5">
                        LUNAS
                      </p>
                      <p className="text-[7.5px] font-bold font-mono tracking-wider leading-none text-center">
                        TATA USAHA RESMI
                      </p>
                    </div>
                  </div>

                  <p className="font-bold underline text-stone-900 mt-2">
                    {invoice.verifiedBy || 'Hj. Nuraini, S.Pd'}
                  </p>
                  <p className="text-[11px] text-[#555555]">NIP / ID: ADM-TC-001</p>
                </div>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
