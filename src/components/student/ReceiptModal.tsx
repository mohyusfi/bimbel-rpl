import * as React from 'react'
import { Printer, CheckCircle2 } from 'lucide-react'
import {
  DialogRoot,
  DialogContent,
  DialogCloseButton,
} from '~/components/ui/dialog'
import { STUDENT_PROFILE, type InvoiceRecord } from '~/lib/mock-student-data'

interface ReceiptModalProps {
  invoice: InvoiceRecord | null
  isOpen: boolean
  onClose: () => void
}

function angkaKeTerbilang(nilai: number): string {
  if (nilai === 450000) return 'Empat Ratus Lima Puluh Ribu Rupiah'
  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ]

  function terbilang(n: number): string {
    if (n < 12) return satuan[n]
    if (n < 20) return `${terbilang(n - 10)} Belas`
    if (n < 100)
      return `${terbilang(Math.floor(n / 10))} Puluh${n % 10 !== 0 ? ` ${terbilang(n % 10)}` : ''}`
    if (n < 200)
      return `Seratus${n - 100 !== 0 ? ` ${terbilang(n - 100)}` : ''}`
    if (n < 1000)
      return `${terbilang(Math.floor(n / 100))} Ratus${n % 100 !== 0 ? ` ${terbilang(n % 100)}` : ''}`
    if (n < 2000)
      return `Seribu${n - 1000 !== 0 ? ` ${terbilang(n - 1000)}` : ''}`
    if (n < 1000000)
      return `${terbilang(Math.floor(n / 1000))} Ribu${n % 1000 !== 0 ? ` ${terbilang(n % 1000)}` : ''}`
    if (n < 1000000000)
      return `${terbilang(Math.floor(n / 1000000))} Juta${n % 1000000 !== 0 ? ` ${terbilang(n % 1000000)}` : ''}`
    return n.toString()
  }

  return `${terbilang(nilai).trim()} Rupiah`.replace(/\s+/g, ' ')
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

  const receiptNumber = `KWT-${invoice.number.replace('INV-', '')}`
  const terbilangText = angkaKeTerbilang(invoice.amount)

  return (
    <DialogRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 bg-white border border-[#D2D2D2] rounded-[14px] shadow-2xl overflow-hidden print:max-w-none print:w-full print:border-none print:shadow-none print:m-0">
        {/* Action bar (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#D2D2D2] bg-[#F6F6F6] flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-[#000000] uppercase font-archivo">
              Kwitansi Resmi Digital
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[#E3E3E3] text-[#555555]">
              {receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#000000] hover:bg-[#262626] rounded-[8px] transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kwitansi / Simpan PDF</span>
            </button>
            <DialogCloseButton className="text-[#555555] hover:text-[#000000] hover:bg-[#E3E3E3] rounded-[6px]" />
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-[#000000] font-sans print:p-6 print:overflow-visible">
          {/* Kop Surat Resmi */}
          <div className="border-b-2 border-[#000000] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-archivo font-extrabold text-base sm:text-lg tracking-tight text-[#000000] leading-snug">
                LEMBAGA BIMBINGAN BELAJAR TADULAKO CENDEKIA — KOTA PALU
              </h1>
              <p className="text-xs text-[#555555] font-instrument">
                Jalan Sam Ratulangi No. 45, Palu, Sulawesi Tengah
              </p>
              <p className="text-[11px] text-[#555555] font-instrument">
                WhatsApp Tata Usaha: 0821-9988-7766 · Email: info@tadulakocendekia.id
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] border border-black bg-black text-white text-xs font-bold font-['Archivo']">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>KWITANSI LUNAS</span>
              </div>
              <p className="text-xs text-[#555555] mt-1.5 font-mono font-bold">
                {receiptNumber}
              </p>
            </div>
          </div>

          {/* Student & Payment Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-instrument bg-[#F6F6F6] p-4 rounded-[8px] border border-[#E0E0E0]">
            <div className="space-y-1">
              <span className="text-[#555555] block">Telah Diterima Dari:</span>
              <span className="font-bold text-sm text-[#000000] block">
                {STUDENT_PROFILE.name}
              </span>
              <span className="text-[#555555] block">
                Sekolah / Jenjang: <strong className="text-[#000000]">{STUDENT_PROFILE.school} ({STUDENT_PROFILE.grade})</strong>
              </span>
              <span className="text-[#555555] block">
                Program Bimbel: <strong className="text-[#CB2957]">{STUDENT_PROFILE.package}</strong>
              </span>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-[#555555] block">Tanggal Verifikasi (WITA):</span>
              <span className="font-bold text-xs text-[#000000] block">
                {invoice.date}
              </span>
              <span className="text-[#555555] block">
                Periode Tagihan: <strong className="text-[#000000]">{invoice.period}</strong>
              </span>
              <span className="text-[#555555] block">
                Metode Pembayaran: <strong className="text-[#000000]">{invoice.method}</strong>
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-[#D2D2D2] rounded-[8px] overflow-hidden">
            <table className="w-full text-xs text-left font-instrument">
              <thead className="bg-[#EEEEEE] border-b border-[#D2D2D2] text-[#000000] font-bold font-archivo">
                <tr>
                  <th className="px-4 py-2.5">Deskripsi Pembayaran</th>
                  <th className="px-4 py-2.5">Periode / Program</th>
                  <th className="px-4 py-2.5 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                <tr>
                  <td className="px-4 py-3">
                    <span className="font-bold text-[#000000] block">
                      Biaya Bimbingan Belajar SPP Bulanan
                    </span>
                    <span className="text-[11px] text-[#555555]">
                      No. Invoice: {invoice.number} · Status: Verifikasi Sah Admin
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#333333]">
                    {invoice.period} — {STUDENT_PROFILE.package}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#000000] font-mono">
                    {formatRupiah(invoice.amount)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-[#F6F6F6] border-t-2 border-[#000000]">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-archivo font-bold text-sm text-[#000000]">
                    TOTAL PEMBAYARAN LUNAS
                  </td>
                  <td className="px-4 py-3 text-right font-archivo font-extrabold text-base text-[#CB2957] font-mono">
                    {formatRupiah(invoice.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terbilang Box */}
          <div className="p-3.5 bg-[#F6F6F6] rounded-[8px] border border-[#D2D2D2] text-xs font-instrument">
            <span className="font-bold text-[#CB2957]">Terbilang: </span>
            <span className="italic font-semibold text-[#000000]">
              &ldquo;{terbilangText}&rdquo;
            </span>
          </div>

          {/* Verification Stamp & Signatures */}
          <div className="pt-4 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 text-xs font-instrument">
            <div className="space-y-1.5 text-center sm:text-left">
              <p className="text-[11px] text-[#555555] leading-relaxed">
                Kwitansi ini merupakan bukti pembayaran digital sah yang diterbitkan oleh
                <br />
                Sistem Tata Usaha Lembaga Bimbingan Belajar Tadulako Cendekia Palu.
              </p>
              <div className="inline-flex items-center gap-1.5 text-[10px] text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-[4px] border border-neutral-300 font-medium">
                <CheckCircle2 className="w-3 h-3 text-black" />
                <span>Terekam secara digital di server Tadulako Cloud</span>
              </div>
            </div>

            {/* Stempel & Signature Container */}
            <div className="relative text-center w-52 shrink-0">
              {/* Stempel Digital Kirmizi */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none -rotate-12 border-2 border-dashed border-[#CB2957] text-[#CB2957] rounded-full w-28 h-28 flex flex-col items-center justify-center p-1 select-none bg-white">
                <span className="text-[8px] font-bold tracking-widest uppercase font-archivo">
                  BIMBEL TADULAKO
                </span>
                <span className="text-[11px] font-black tracking-wider uppercase font-archivo border-y border-[#CB2957] my-0.5 px-2">
                  LUNAS / VERIFIED
                </span>
                <span className="text-[8px] font-semibold tracking-tighter">
                  {invoice.date.split('(')[0].trim()}
                </span>
                <span className="text-[7px] tracking-widest font-mono">
                  KOTA PALU
                </span>
              </div>

              <p className="text-[#555555] mb-14">
                Palu, {invoice.date.split('(')[0].trim()}
                <br />
                Kepala Tata Usaha,
              </p>
              <p className="font-bold underline text-[#000000] font-archivo">
                Hj. Nuraini, S.Pd
              </p>
              <p className="text-[10px] text-[#555555]">NIP: 19840315 200801 2 009</p>
            </div>
          </div>
        </div>

        {/* Footer actions (hidden on print) */}
        <div className="p-4 border-t border-[#D2D2D2] bg-[#F6F6F6] flex-shrink-0 flex items-center justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#000000] bg-white border border-[#D2D2D2] rounded-[8px] hover:bg-[#E3E3E3] transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#CB2957] hover:bg-[#B3214B] rounded-[8px] transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kwitansi / Simpan PDF</span>
          </button>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
