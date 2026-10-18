import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Receipt,
  Building,
  Phone,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { INVOICE_RECORDS, type InvoiceRecord } from '~/lib/mock-student-data'
import { ReceiptModal } from '~/components/student/ReceiptModal'
import { UploadProofModal } from '~/components/student/UploadProofModal'

export const Route = createFileRoute('/student/tagihan')({
  ssr: false,
  component: StudentTagihanPage,
})

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val)
}

function StudentTagihanPage() {
  const [invoices, setInvoices] = React.useState<InvoiceRecord[]>(INVOICE_RECORDS)
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] =
    React.useState<InvoiceRecord | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false)

  const [selectedUploadInvoice, setSelectedUploadInvoice] =
    React.useState<InvoiceRecord | null>(null)
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)

  const [notificationMsg, setNotificationMsg] = React.useState<string | null>(null)

  // Calculations
  const totalPaid = invoices
    .filter((inv) => inv.status === 'lunas')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const unpaidCount = invoices.filter(
    (inv) => inv.status === 'belum_bayar'
  ).length

  const pendingCount = invoices.filter(
    (inv) => inv.status === 'menunggu_verifikasi'
  ).length

  const handleOpenReceipt = (invoice: InvoiceRecord) => {
    setSelectedReceiptInvoice(invoice)
    setIsReceiptOpen(true)
  }

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false)
    setSelectedReceiptInvoice(null)
  }

  const handleOpenUpload = (invoice: InvoiceRecord) => {
    setSelectedUploadInvoice(invoice)
    setIsUploadOpen(true)
  }

  const handleCloseUpload = () => {
    setIsUploadOpen(false)
    setSelectedUploadInvoice(null)
  }

  const handleUploadSuccess = (invoiceId: string) => {
    // Update local state to 'menunggu_verifikasi'
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status: 'menunggu_verifikasi',
            method: 'Transfer Bank (Menunggu Verifikasi Admin)',
          }
        }
        return inv
      })
    )

    setNotificationMsg(
      'Bukti transfer berhasil dikirim! Status pembayaran kini Menunggu Verifikasi Tata Usaha (maks. 1x24 jam kerja).'
    )

    setTimeout(() => {
      setNotificationMsg(null)
    }, 6000)
  }

  return (
    <>
      {/* 1. Editorial Page Header */}
      <div className="dash-page-header">
        <div className="dash-title-group">
          <h1>Tagihan SPP &amp; Kwitansi Digital</h1>
          <p>
            Kelola pembayaran biaya bimbingan belajar bulanan secara transparan. Unggah bukti transfer dan unduh kwitansi resmi berstempel sah digital.
          </p>
        </div>
        <div>
          <span className="status-tag status-neutral" style={{ fontSize: '0.8125rem', padding: '5px 10px' }}>
            <CreditCard className="lucide" /> Status SPP: Terverifikasi
          </span>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notificationMsg && (
        <div className="p-4 mb-6 rounded-xl bg-white border-l-4 border-l-[#CB2957] border border-[#D2D2D2] text-black flex items-center justify-between text-xs sm:text-sm shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#CB2957]" />
            <span className="font-semibold">{notificationMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationMsg(null)}
            className="text-neutral-500 hover:text-black font-semibold text-xs ml-3"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 2. Editorial Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total SPP Terverifikasi</div>
          <div className="metric-val num-tabular text-black">{formatRupiah(totalPaid)}</div>
          <div className="metric-sub">Kwitansi pembayaran resmi tersedia</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Tagihan Belum Bayar</div>
          <div className="metric-val num-tabular">
            {unpaidCount} <span style={{ fontSize: '1.1rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>Bulan</span>
          </div>
          <div className="metric-sub">
            {unpaidCount > 0 ? (
              <span className="text-destructive font-medium">Perlu pelunasan sebelum tgl 10</span>
            ) : (
              <span className="text-neutral-600 font-medium">Tidak ada tagihan tertunggak</span>
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Menunggu Verifikasi</div>
          <div className="metric-val num-tabular">{pendingCount} Invoice</div>
          <div className="metric-sub">Verifikasi Tata Usaha maks. 1x24 jam</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Paket Bimbingan</div>
          <div className="metric-val" style={{ fontSize: '1.25rem', lineHeight: 1.2 }}>
            Intensif UTBK
          </div>
          <div className="metric-sub">Siklus Bulanan Reguler Palu</div>
        </div>
      </div>

      {/* 3. Info Rekening Bimbel Mini Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-[#D2D2D2] shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-neutral-100 text-black border border-neutral-300 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4 text-[#CB2957]" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-500 block">Rekening BNI</span>
            <span className="font-mono font-bold text-xs sm:text-sm text-black">
              0823-4567-890
            </span>
            <span className="text-[11px] text-neutral-500 block mt-0.5">
              a.n. Bimbel Tadulako Cendekia
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D2D2D2] shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-neutral-100 text-black border border-neutral-300 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4 text-black" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-500 block">Rekening BSI (Syariah)</span>
            <span className="font-mono font-bold text-xs sm:text-sm text-black">
              7123-4567-89
            </span>
            <span className="text-[11px] text-neutral-500 block mt-0.5">
              a.n. Bimbel Tadulako Cendekia
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D2D2D2] shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-neutral-100 text-black border border-neutral-300 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-[#CB2957]" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-500 block">Bantuan Tata Usaha</span>
            <span className="font-mono font-bold text-xs sm:text-sm text-black">
              0821-9988-7766
            </span>
            <span className="text-[11px] text-neutral-500 block mt-0.5">
              Senin–Sabtu 08.00–18.00 WITA
            </span>
          </div>
        </div>
      </div>

      {/* 4. Invoices Table Card */}
      <div className="dash-card">
        <div className="dash-card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="dash-card-title">Riwayat &amp; Jadwal Tagihan SPP</div>
            <span className="status-tag status-neutral">{invoices.length} Periode</span>
          </div>
          <span className="text-xs text-neutral-500 hidden sm:inline">
            Jatuh tempo setiap tanggal 10 tiap bulan berjalan
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Periode &amp; No. Tagihan</th>
                <th>Nominal SPP</th>
                <th>Tanggal Verifikasi / Batas</th>
                <th>Metode Bayar</th>
                <th>Status Pembayaran</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isLunas = inv.status === 'lunas'
                const isMenunggu = inv.status === 'menunggu_verifikasi'
                const isBelumBayar = inv.status === 'belum_bayar'

                return (
                  <tr key={inv.id}>
                    <td>
                      <span className="font-semibold text-black block">
                        SPP Bulan {inv.period}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-500 block mt-0.5">
                        {inv.number}
                      </span>
                    </td>

                    <td className="font-mono font-semibold text-black tabular-nums">
                      {formatRupiah(inv.amount)}
                    </td>

                    <td className="text-neutral-600 whitespace-nowrap">
                      {inv.date}
                    </td>

                    <td className="text-neutral-700 max-w-xs">
                      {inv.method}
                    </td>

                    <td className="whitespace-nowrap">
                      {isLunas && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-black">
                          <CheckCircle2 className="w-4 h-4 text-black" />
                          <span>Lunas</span>
                        </span>
                      )}
                      {isMenunggu && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                          <Clock className="w-4 h-4 text-neutral-600" />
                          <span>Menunggu Verifikasi</span>
                        </span>
                      )}
                      {isBelumBayar && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CB2957]">
                          <AlertCircle className="w-4 h-4 text-[#CB2957]" />
                          <span>Belum Bayar</span>
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }} className="whitespace-nowrap">
                      {isLunas && (
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(inv)}
                          className="btn btn-outline btn-sm"
                        >
                          <Receipt className="lucide text-[#CB2957]" />
                          <span>Lihat Kwitansi</span>
                        </button>
                      )}

                      {isBelumBayar && (
                        <button
                          type="button"
                          onClick={() => handleOpenUpload(inv)}
                          className="btn btn-primary btn-sm"
                        >
                          <Upload className="lucide" />
                          <span>Unggah Bukti</span>
                        </button>
                      )}

                      {isMenunggu && (
                        <span className="text-xs text-neutral-500 italic">
                          Diverifikasi admin
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#D2D2D2] bg-neutral-50 text-xs text-neutral-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-black" />
            <span>Kwitansi pembayaran resmi diakui sah untuk keperluan administrasi sekolah &amp; instansi.</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            Bimbel Tadulako Cendekia Kota Palu
          </span>
        </div>
      </div>

      {/* Modals */}
      <ReceiptModal
        invoice={selectedReceiptInvoice}
        isOpen={isReceiptOpen}
        onClose={handleCloseReceipt}
      />

      <UploadProofModal
        invoice={selectedUploadInvoice}
        isOpen={isUploadOpen}
        onClose={handleCloseUpload}
        onSuccess={handleUploadSuccess}
      />
    </>
  )
}
