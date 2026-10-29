import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  CreditCard,
  Building2,
  Copy,
  Check,
  Upload,
  Receipt,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useStudentDashboardData } from '~/hooks/use-admin-data'
import type { Invoice } from '~/lib/admin-store'
import { formatRupiah } from '~/lib/utils'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'
import { UploadProofModal } from '~/components/dashboard/UploadProofModal'
import { ReceiptModal } from '~/components/dashboard/ReceiptModal'

export const Route = createFileRoute('/student/tagihan')({
  ssr: false,
  component: StudentTagihanPage,
})

function StudentTagihanPage() {
  const { student, invoices, isLoading } = useStudentDashboardData()

  const [isCopied, setIsCopied] = React.useState(false)
  const [selectedUploadInvoice, setSelectedUploadInvoice] = React.useState<Invoice | null>(null)
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = React.useState<Invoice | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false)

  // Calculations
  const unpaidInvoices = invoices.filter(
    (inv) => inv.status === 'belum_dibayar' || inv.status === 'ditolak'
  )
  const pendingInvoices = invoices.filter((inv) => inv.status === 'menunggu')
  const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0)

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('7188293811')
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleOpenUpload = (invoice: Invoice) => {
    setSelectedUploadInvoice(invoice)
    setIsUploadOpen(true)
  }

  const handleOpenReceipt = (invoice: Invoice) => {
    setSelectedReceiptInvoice(invoice)
    setIsReceiptOpen(true)
  }

  // DataTable columns
  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'id',
      header: 'No. invoice',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[#555555] whitespace-nowrap">
          {row.original.invoiceNumber || row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'programName',
      header: 'Program / Periode',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-sm text-[#000000] block">
            {row.original.programName}
          </span>
          <span className="text-xs text-[#555555]">
            Jatuh tempo: <span className="tabular-nums font-medium text-[#292524]">{row.original.dueDate}</span>
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Jumlah tagihan',
      cell: ({ row }) => (
        <span className="tabular-nums font-bold text-sm text-[#000000] whitespace-nowrap">
          {formatRupiah(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} since={row.original.submittedAt} />
      ),
    },
    {
      id: 'details',
      header: 'Keterangan verifikasi',
      cell: ({ row }) => {
        const inv = row.original
        if (inv.status === 'ditolak') {
          return (
            <div className="flex items-start gap-1.5 text-xs text-[#901B14] max-w-xs leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Ditolak: {inv.rejectedReason || 'Bukti transfer tidak valid.'}</span>
            </div>
          )
        }
        if (inv.status === 'menunggu') {
          const submitter =
            inv.submittedByRole === 'parent'
              ? 'Diunggah oleh Orang Tua'
              : 'Diunggah oleh Siswa'
          return (
            <div className="space-y-0.5 text-xs text-[#555555]">
              <span className="text-[#8C5806] font-medium block">
                {submitter}
              </span>
              <span>{inv.bankName || 'Menunggu verifikasi admin'}</span>
            </div>
          )
        }
        if (inv.status === 'lunas') {
          return (
            <div className="space-y-0.5 text-xs text-[#555555]">
              <span className="font-mono text-[#166534] font-medium block">
                {inv.receiptNumber || 'Lunas Terverifikasi'}
              </span>
              <span>{inv.verifiedBy ? `Oleh ${inv.verifiedBy}` : 'Pembayaran resmi terverifikasi'}</span>
            </div>
          )
        }
        return (
          <span className="text-xs text-[#555555]">
            Silakan transfer ke rekening resmi bimbel
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: () => <span className="w-full text-right block">Aksi</span>,
      cell: ({ row }) => {
        const inv = row.original
        if (inv.status === 'lunas') {
          return (
            <div className="text-right">
              <button
                type="button"
                onClick={() => handleOpenReceipt(inv)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] hover:bg-[#F6F6F6] border border-[#D2D2D2] hover:border-[#000000] rounded-[8px] transition-colors cursor-pointer h-8 whitespace-nowrap"
              >
                <Receipt className="w-3.5 h-3.5 text-[#555555]" />
                <span>Cetak Kwitansi</span>
              </button>
            </div>
          )
        }

        if (inv.status === 'belum_dibayar' || inv.status === 'ditolak') {
          return (
            <div className="text-right">
              <button
                type="button"
                onClick={() => handleOpenUpload(inv)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[8px] transition-colors cursor-pointer shadow-none h-8 whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{inv.status === 'ditolak' ? 'Unggah Ulang Bukti' : 'Unggah Bukti Transfer'}</span>
              </button>
            </div>
          )
        }

        if (inv.status === 'menunggu') {
          return (
            <div className="text-right">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#555555] bg-[#F6F6F6] rounded-[6px] select-none h-8"
                title="Bukti transfer sedang diverifikasi oleh staf tata usaha bimbel"
              >
                <Clock className="w-3.5 h-3.5 text-[#8C5806]" />
                <span>Sedang Diverifikasi</span>
              </span>
            </div>
          )
        }

        return null
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Page Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D2D2D2]/60">
        <div>
          <span className="text-xs font-semibold tracking-wider text-[#555555] uppercase block mb-1">
            Administrasi & Keuangan
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#000000]">
            Tagihan & Pembayaran SPP
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1 leading-relaxed">
            Kelola tagihan biaya bimbingan, kirim bukti transfer bank, dan akses kwitansi resmi yang telah diverifikasi.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="font-mono text-xs text-[#555555]">
            NIS: {student?.nis || 'TC-2026-001'}
          </span>
          <span className="text-[#D2D2D2]">·</span>
          <span className="text-xs font-medium text-[#292524]">
            {student?.className || 'UTBK Intensif A'}
          </span>
        </div>
      </div>

      {/* 2. SPP Obligation Summary & Official Account Banner (xl+, Stacked on 1024px) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: Kewajiban SPP Summary Card */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#555555] uppercase tracking-wider">
                Total Kewajiban SPP
              </span>
              <CreditCard className="w-4 h-4 text-[#CB2957]" />
            </div>

            <div className="mt-3">
              <div className="font-display font-extrabold text-[28px] sm:text-[32px] text-[#000000] tabular-nums tracking-tight leading-none">
                {totalUnpaidAmount > 0 ? formatRupiah(totalUnpaidAmount) : 'Rp 0'}
              </div>
              <p className="text-xs text-[#555555] mt-1.5">
                {unpaidInvoices.length > 0
                  ? `${unpaidInvoices.length} tagihan belum diselesaikan`
                  : pendingInvoices.length > 0
                    ? `${pendingInvoices.length} tagihan sedang diverifikasi admin`
                    : 'Seluruh tagihan SPP telah lunas'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D2D2D2]/60 flex items-center justify-between text-xs">
            <span className="text-[#555555]">Status Pembayaran:</span>
            {totalUnpaidAmount > 0 ? (
              <span className="font-medium text-[#8C5806]">Perlu Diselesaikan</span>
            ) : pendingInvoices.length > 0 ? (
              <span className="font-medium text-[#8C5806]">Menunggu Konfirmasi</span>
            ) : (
              <span className="font-medium text-[#166534]">Bebas Tagihan</span>
            )}
          </div>
        </div>

        {/* Right: Rekening Resmi Anemone Cendekia */}
        <div className="xl:col-span-2 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#000000] shrink-0" />
                <span className="font-bold text-sm text-[#000000]">
                  Rekening Resmi Anemone Cendekia
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#166534] bg-[#F6F6F6] px-2 py-0.5 rounded-[6px] shrink-0 self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
                <span>Terverifikasi</span>
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-[#555555] block">Bank Tujuan:</span>
                <span className="font-semibold text-sm text-[#000000]">
                  Bank Syariah Indonesia (BSI)
                </span>
                <span className="text-xs text-[#555555] block mt-0.5">
                  Cabang Palu Hasanuddin
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#555555] block">Nomor Rekening:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-base text-[#000000] tracking-wider tabular-nums">
                    7188-2938-11
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#000000] bg-[#F6F6F6] border border-[#D2D2D2] rounded-[6px] hover:bg-[#E3E3E3] transition-colors cursor-pointer"
                    title="Salin nomor rekening"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-[#166534]" />
                        <span className="text-[#166534] text-[11px] font-semibold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#555555]" />
                        <span className="text-[11px]">Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <span className="text-xs text-[#555555] block mt-0.5">
                  a.n. <strong>Anemone Cendekia</strong>
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#555555] mt-3 pt-2.5 border-t border-[#D2D2D2]/60 leading-relaxed">
            *Mohon cantumkan <strong>NIS ({student?.nis || 'TC-2026-001'})</strong> atau <strong>Nama Siswa</strong> pada berita transfer untuk mempercepat proses verifikasi oleh tata usaha.
          </p>
        </div>
      </div>

      {/* 3. DataTable of Invoices */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold font-display text-[#000000]">
            Riwayat & Daftar Tagihan SPP
          </h2>
          <p className="text-xs text-[#555555] mt-0.5">
            Daftar seluruh invoice bimbingan siswa beserta status verifikasi bukti transfer.
          </p>
        </div>

        <DataTable
          columns={columns}
          data={invoices}
          isLoading={isLoading}
          searchPlaceholder="Cari nomor invoice, periode, atau program..."
          renderMobileCard={(row) => (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#D2D2D2]/50 pb-2">
                <span className="font-mono text-xs text-[#555555]">
                  {row.id}
                </span>
                <StatusBadge status={row.status} since={row.submittedAt} />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sm text-[#000000]">
                    {row.programName}
                  </h3>
                  <p className="text-xs text-[#555555] mt-0.5">
                    Jatuh tempo: <span className="tabular-nums font-medium text-[#292524]">{row.dueDate}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="tabular-nums font-bold text-sm text-[#000000]">
                    {formatRupiah(row.amount)}
                  </span>
                </div>
              </div>

              {row.status === 'ditolak' && (
                <div className="bg-[#FBEAEF] border border-[#E9A8BA] rounded-[8px] p-2.5 text-xs text-[#901B14] leading-relaxed">
                  <strong>Penolakan:</strong> {row.rejectedReason || 'Bukti transfer tidak sesuai.'}
                </div>
              )}

              {row.status === 'menunggu' && (
                <p className="text-xs text-[#8C5806]">
                  {row.submittedByRole === 'parent'
                    ? 'Bukti telah diunggah oleh orang tua.'
                    : 'Bukti telah diunggah oleh siswa.'}{' '}
                  Menunggu verifikasi admin.
                </p>
              )}

              {row.status === 'lunas' && (
                <p className="font-mono text-xs text-[#166534]">
                  Kwitansi: {row.receiptNumber || 'Lunas Terverifikasi'}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end">
                {row.status === 'lunas' ? (
                  <button
                    type="button"
                    onClick={() => handleOpenReceipt(row)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] hover:bg-[#F6F6F6] border border-[#D2D2D2] hover:border-[#000000] rounded-[8px] transition-colors cursor-pointer h-8"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#555555]" />
                    <span>Cetak Kwitansi</span>
                  </button>
                ) : row.status === 'belum_dibayar' || row.status === 'ditolak' ? (
                  <button
                    type="button"
                    onClick={() => handleOpenUpload(row)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[8px] transition-colors cursor-pointer shadow-none h-8"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{row.status === 'ditolak' ? 'Unggah Ulang Bukti' : 'Unggah Bukti Transfer'}</span>
                  </button>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#555555] bg-[#F6F6F6] rounded-[6px] select-none h-8"
                    title="Bukti transfer sedang diverifikasi oleh staf tata usaha bimbel"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#8C5806]" />
                    <span>Sedang Diverifikasi</span>
                  </span>
                )}
              </div>
            </div>
          )}
        />
      </div>

      {/* Upload Proof Modal */}
      <UploadProofModal
        invoice={selectedUploadInvoice}
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false)
          setSelectedUploadInvoice(null)
        }}
        submittedByRole="student"
        submittedByName={student?.name || 'Muhammad Rafly'}
      />

      {/* Official Receipt Modal */}
      <ReceiptModal
        invoice={selectedReceiptInvoice}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false)
          setSelectedReceiptInvoice(null)
        }}
      />
    </div>
  )
}
