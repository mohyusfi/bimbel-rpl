import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import {
  CreditCard,
  Building2,
  Copy,
  Check,
  Upload,
  Printer,
  Clock,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  Filter,
  Users,
} from 'lucide-react'
import { useParentDashboardData, useAdminInvoices } from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'
import { UploadProofModal } from '~/components/dashboard/UploadProofModal'
import { ReceiptModal } from '~/components/dashboard/ReceiptModal'
import type { Invoice } from '~/lib/admin-store'
import { formatRupiah, cn, formatDueDate } from '~/lib/utils'

export const Route = createFileRoute('/parent/tagihan')({
  ssr: false,
  component: ParentBillingPage,
})

function ParentBillingPage() {
  const { parent, selectedChild, children = [], childData } = useParentDashboardData()
  const { student } = childData
  const { data: allInvoices = [], isLoading: isLoadingInvoices } = useAdminInvoices()

  const [copiedAccount, setCopiedAccount] = React.useState<string | null>(null)
  const [selectedInvoiceForProof, setSelectedInvoiceForProof] = React.useState<Invoice | null>(null)
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = React.useState<Invoice | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
  const [showAllFamily, setShowAllFamily] = React.useState<boolean>(false)

  // Copy BSI account
  const handleCopyAccount = (accountNo: string) => {
    navigator.clipboard.writeText(accountNo)
    setCopiedAccount(accountNo)
    setTimeout(() => setCopiedAccount(null), 2000)
  }

  // Get invoices for either selected child or the whole family (all children of this parent)
  const familyStudentIds = new Set([
    ...children.map((c) => c.id),
    ...(parent?.studentIds || []),
  ])
  const relevantInvoices = showAllFamily
    ? allInvoices.filter((i) => familyStudentIds.has(i.studentId) || (i.parentId && i.parentId === parent?.id))
    : allInvoices.filter(
        (i) =>
          i.studentId === student?.id ||
          (student && i.studentName === student.name)
      )

  // Calculations for summary cards
  const unpaidInvoices = relevantInvoices.filter(
    (i) => i.status === 'belum_dibayar' || i.status === 'ditolak'
  )
  const totalUnpaidAmount = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0)

  const pendingInvoices = relevantInvoices.filter((i) => i.status === 'menunggu')
  const totalPendingAmount = pendingInvoices.reduce((sum, i) => sum + i.amount, 0)

  const paidInvoices = relevantInvoices.filter((i) => i.status === 'lunas')
  const totalPaidAmount = paidInvoices.reduce((sum, i) => sum + i.amount, 0)

  // Filtered invoices for DataTable
  const filteredInvoices =
    statusFilter === 'ALL'
      ? relevantInvoices
      : relevantInvoices.filter((i) => i.status === statusFilter)

  // Columns definition
  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'id',
      header: 'No. Tagihan & Jatuh Tempo',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-mono text-xs font-semibold text-[#000000]">
            {row.original.invoiceNumber || row.original.id}
          </p>
          <p className="text-[11px] text-[#555555] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#555555]" />
            <span className="tabular-nums">Jatuh tempo: {formatDueDate(row.original.dueDate)}</span>
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'programName',
      header: 'Program & Siswa',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-xs text-[#000000]">
            {row.original.programName}
          </p>
          <p className="text-[11px] text-[#555555]">
            {row.original.studentName} · NIS:{' '}
            <span className="font-mono">{row.original.nis || '-'}</span>
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">Nominal SPP</div>,
      cell: ({ row }) => (
        <div className="text-right font-display font-extrabold text-sm text-[#000000] tabular-nums">
          {formatRupiah(row.original.amount)}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status Pembayaran',
      cell: ({ row }) => (
        <div className="space-y-1">
          <StatusBadge status={row.original.status} />
          {row.original.rejectedReason && (
            <div className="p-2 bg-[#FBEAEF] border border-[#CB2957]/30 rounded-[6px] text-[11px] text-[#A81E46] space-y-0.5 max-w-xs">
              <strong className="block font-semibold">Alasan Penolakan:</strong>
              <p>{row.original.rejectedReason}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Aksi Layanan</div>,
      cell: ({ row }) => {
        const inv = row.original

        if (inv.status === 'lunas') {
          return (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForReceipt(inv)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] hover:bg-[#F6F6F6] border border-[#D2D2D2] hover:border-[#000000] rounded-[8px] transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#555555]" />
                <span>Cetak Kwitansi</span>
              </button>
            </div>
          )
        }

        if (inv.status === 'menunggu') {
          return (
            <div className="text-right">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#555555] bg-[#F6F6F6] rounded-[6px] select-none"
                title="Bukti bayar sedang diverifikasi oleh staf tata usaha bimbel"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-[#8C5806]" />
                <span>Menunggu Verifikasi</span>
              </span>
            </div>
          )
        }

        if (inv.status === 'belum_dibayar' || inv.status === 'ditolak') {
          return (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForProof(inv)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[8px] transition-colors cursor-pointer shadow-none"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{inv.status === 'ditolak' ? 'Unggah Ulang Bukti' : 'Unggah Bukti Transfer'}</span>
              </button>
            </div>
          )
        }

        return <div className="text-right text-xs text-[#555555]">-</div>
      },
    },
  ]

  // Mobile card view
  const renderMobileCard = (inv: Invoice) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-xs font-bold text-[#000000] block">
            {inv.id}
          </span>
          <span className="text-[11px] text-[#555555]">
            Jatuh tempo: {formatDueDate(inv.dueDate)}
          </span>
        </div>
        <StatusBadge status={inv.status} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <div>
          <p className="font-semibold text-[#000000]">{inv.programName}</p>
          <p className="text-[11px] text-[#555555]">{inv.studentName}</p>
        </div>
        <div className="text-right font-display font-extrabold text-base text-[#000000] tabular-nums">
          {formatRupiah(inv.amount)}
        </div>
      </div>

      {inv.rejectedReason && (
        <div className="p-2.5 bg-[#FBEAEF] border border-[#CB2957]/30 rounded-[8px] text-xs text-[#A81E46]">
          <strong>Alasan Penolakan: </strong>
          <span>{inv.rejectedReason}</span>
        </div>
      )}

      <div className="pt-2 border-t border-[#D2D2D2]/60 flex items-center justify-end gap-2">
        {inv.status === 'lunas' && (
          <button
            type="button"
            onClick={() => setSelectedInvoiceForReceipt(inv)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kwitansi</span>
          </button>
        )}

        {(inv.status === 'belum_dibayar' || inv.status === 'ditolak') && (
          <button
            type="button"
            onClick={() => setSelectedInvoiceForProof(inv)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{inv.status === 'ditolak' ? 'Unggah Ulang Bukti' : 'Unggah Bukti Transfer'}</span>
          </button>
        )}

        {inv.status === 'menunggu' && (
          <div className="w-full text-center py-1.5 text-xs text-[#8C5806] font-medium bg-[#F6F6F6] rounded-[6px]">
            Bukti transfer sedang diproses staf tata usaha
          </div>
        )}
      </div>
    </div>
  )

  const filterSlot = (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => setShowAllFamily((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[8px] border transition-colors cursor-pointer',
          showAllFamily
            ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
            : 'bg-[#FFFFFF] text-[#292524] border-[#D2D2D2] hover:bg-[#F6F6F6]'
        )}
      >
        <Users className="w-3.5 h-3.5" />
        <span>{showAllFamily ? 'Menampilkan Semua Anak' : 'Filter per Anak'}</span>
      </button>

      <div className="flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5 text-[#555555]" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-xs bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
          aria-label="Filter status tagihan"
        >
          <option value="ALL">Semua Status Tagihan</option>
          <option value="belum_dibayar">Belum Dibayar</option>
          <option value="menunggu">Menunggu Verifikasi</option>
          <option value="lunas">Lunas</option>
        </select>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#CB2957]">
          Administrasi & Keuangan Siswa
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#000000] tracking-tight">
          Tagihan SPP & Konfirmasi Pembayaran
        </h1>
        <p className="text-xs sm:text-sm text-[#555555]">
          Kelola pembayaran iuran bimbingan belajar, unggah bukti transfer perbankan, dan unduh kwitansi resmi tervalidasi.
        </p>
      </div>

      {/* Official Bank Account Information Banner */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D2D2D2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#000000] text-[#FFFFFF] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#555555]">
                Rekening Resmi Tujuan Transfer
              </span>
              <h2 className="font-display font-bold text-lg text-[#000000]">
                Bank Syariah Indonesia (BSI)
              </h2>
            </div>
          </div>

          <div className="w-full md:w-auto flex items-center justify-between gap-3 sm:gap-4 bg-[#F8F8F8] border border-[#D2D2D2] px-4 py-2.5 rounded-[10px]">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.06em] text-[#555555] block">
                Nomor Rekening Resmi
              </span>
              <span className="font-mono font-bold text-base sm:text-lg text-[#000000] tabular-nums tracking-wider leading-tight block">
                7123-4567-89
              </span>
              <span className="text-[11px] text-[#555555] block mt-0.5">
                a.n. Pintar Yuk
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleCopyAccount('7123456789')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] active:scale-95 rounded-[8px] transition-all cursor-pointer shrink-0"
              title="Salin nomor rekening ke papan klip"
            >
              {copiedAccount === '7123456789' ? (
                <>
                  <Check className="w-4 h-4 text-[#22C55E]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin<span className="hidden sm:inline"> No. Rekening</span></span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-[#555555] bg-[#F6F6F6] p-3 rounded-[8px]">
          <AlertCircle className="w-4 h-4 text-[#CB2957] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Harap mencantumkan <strong>Nomor Tagihan</strong> pada kolom berita transfer saat melakukan transaksi ATM atau Mobile Banking untuk mempercepat verifikasi oleh petugas tata usaha.
          </p>
        </div>
      </div>

      {/* SPP Obligation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Belum Dibayar */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#555555]">Kewajiban Belum Dibayar</span>
            <AlertCircle className="w-4 h-4 text-[#8C5806]" />
          </div>
          <div className="mt-3">
            <span className="font-display font-extrabold text-2xl text-[#000000] tabular-nums">
              {formatRupiah(totalUnpaidAmount)}
            </span>
            <p className="text-[11px] text-[#555555] mt-0.5">
              {unpaidInvoices.length} tagihan menunggu pelunasan
            </p>
          </div>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#555555]">Menunggu Verifikasi</span>
            <Clock className="w-4 h-4 text-[#8C5806]" />
          </div>
          <div className="mt-3">
            <span className="font-display font-extrabold text-2xl text-[#000000] tabular-nums">
              {formatRupiah(totalPendingAmount)}
            </span>
            <p className="text-[11px] text-[#555555] mt-0.5">
              {pendingInvoices.length} bukti bayar dalam antrean cek
            </p>
          </div>
        </div>

        {/* Lunas */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#555555]">Riwayat Lunas</span>
            <CheckCircle2 className="w-4 h-4 text-[#166534]" />
          </div>
          <div className="mt-3">
            <span className="font-display font-extrabold text-2xl text-[#166534] tabular-nums">
              {formatRupiah(totalPaidAmount)}
            </span>
            <p className="text-[11px] text-[#555555] mt-0.5">
              {paidInvoices.length} tagihan telah diverifikasi sah
            </p>
          </div>
        </div>
      </div>

      {/* Invoices DataTable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-[#000000]">
            Daftar Tagihan SPP {showAllFamily ? '(Seluruh Anak)' : `(${student?.name})`}
          </h2>
        </div>

        <DataTable
          columns={columns}
          data={filteredInvoices}
          isLoading={isLoadingInvoices}
          searchPlaceholder="Cari nomor tagihan, nama anak, atau program..."
          filterSlot={filterSlot}
          renderMobileCard={renderMobileCard}
          emptyState="Belum ada riwayat tagihan SPP yang tercatat."
        />
      </div>

      {/* Upload Proof Modal */}
      <UploadProofModal
        invoice={selectedInvoiceForProof}
        isOpen={Boolean(selectedInvoiceForProof)}
        onClose={() => setSelectedInvoiceForProof(null)}
        submittedByRole="parent"
        submittedByName={parent?.name || 'Ir. H. Ahmad Dahlan'}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        invoice={selectedInvoiceForReceipt}
        isOpen={Boolean(selectedInvoiceForReceipt)}
        onClose={() => setSelectedInvoiceForReceipt(null)}
      />
    </div>
  )
}
