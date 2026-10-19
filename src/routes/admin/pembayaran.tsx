import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Dialog } from '@base-ui/react/dialog'
import {
  Plus,
  CheckCircle2,
  XCircle,
  X,
  Printer,
  FileText,
  Eye,
  CreditCard,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import {
  useAdminInvoices,
  useAdminStudents,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'
import { ReceiptModal } from '~/components/dashboard/ReceiptModal'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { cn, formatRupiah } from '~/lib/utils'
import { SearchableSelect } from '~/components/ui/searchable-select'
import type { Invoice } from '~/lib/admin-store'

export const Route = createFileRoute('/admin/pembayaran')({
  ssr: false,
  component: AdminPembayaranPage,
})

function AdminPembayaranPage() {
  const { data: invoices = [] } = useAdminInvoices()
  const { data: students = [] } = useAdminStudents()
  const { verifyInvoice, rejectInvoice, createInvoice } = useAdminMutations()

  // Filter
  const [statusFilter, setStatusFilter] = React.useState<
    'ALL' | 'menunggu' | 'lunas' | 'unpaid'
  >('ALL')

  // Modals state
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = React.useState(false)
  const [inspectingInvoice, setInspectingInvoice] =
    React.useState<Invoice | null>(null)
  const [viewingReceipt, setViewingReceipt] = React.useState<Invoice | null>(
    null
  )
  const [rejectionReason, setRejectionReason] = React.useState('')
  const [isRejecting, setIsRejecting] = React.useState(false)

  // New Invoice Form State
  const [invoiceForm, setInvoiceForm] = React.useState({
    studentId: '',
    amount: 450000,
    dueDate: '10 Mei 2026',
    programName: 'Intensif UTBK-SNBT',
  })

  // Filtered dataset
  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'unpaid') {
      return inv.status === 'belum_dibayar' || inv.status === 'ditolak'
    }
    return inv.status === statusFilter
  })

  // Quick Filter Cards data
  const summaryCards = [
    {
      key: 'ALL' as const,
      label: 'Semua Tagihan',
      description: 'Rekap tagihan SPP bimbel',
      count: invoices.length,
      amount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      icon: CreditCard,
      urgent: false,
    },
    {
      key: 'menunggu' as const,
      label: 'Menunggu Verifikasi',
      description: 'Mutasi bank perlu validasi',
      count: invoices.filter((i) => i.status === 'menunggu').length,
      amount: invoices
        .filter((i) => i.status === 'menunggu')
        .reduce((sum, inv) => sum + inv.amount, 0),
      icon: Clock,
      urgent: true,
    },
    {
      key: 'lunas' as const,
      label: 'Lunas',
      description: 'Pembayaran berkwitansi resmi',
      count: invoices.filter((i) => i.status === 'lunas').length,
      amount: invoices
        .filter((i) => i.status === 'lunas')
        .reduce((sum, inv) => sum + inv.amount, 0),
      icon: CheckCircle2,
      urgent: false,
    },
    {
      key: 'unpaid' as const,
      label: 'Belum Dibayar / Ditolak',
      description: 'Menanti transfer / perbaikan bukti',
      count: invoices.filter(
        (i) => i.status === 'belum_dibayar' || i.status === 'ditolak'
      ).length,
      amount: invoices
        .filter(
          (i) => i.status === 'belum_dibayar' || i.status === 'ditolak'
        )
        .reduce((sum, inv) => sum + inv.amount, 0),
      icon: AlertTriangle,
      urgent: false,
    },
  ]

  // Handle Create Invoice
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const student =
      students.find((s) => s.id === invoiceForm.studentId) || students[0]
    if (!student) return

    await createInvoice({
      studentId: student.id,
      studentName: student.name,
      nis: student.nis,
      programName: invoiceForm.programName,
      amount: Number(invoiceForm.amount),
      dueDate: invoiceForm.dueDate,
    })

    setIsAddInvoiceOpen(false)
  }

  // Handle Verify Invoice
  const handleConfirmVerify = async () => {
    if (!inspectingInvoice) return
    await verifyInvoice(inspectingInvoice.id)
    const updated = {
      ...inspectingInvoice,
      status: 'lunas' as const,
      receiptNumber: `KWT-${inspectingInvoice.id.replace('INV-', '')}`,
    }
    setInspectingInvoice(null)
    setViewingReceipt(updated)
  }

  // Handle Reject Invoice
  const handleConfirmReject = async () => {
    if (!inspectingInvoice || !rejectionReason.trim()) return
    await rejectInvoice({
      id: inspectingInvoice.id,
      reason: rejectionReason.trim(),
    })
    setInspectingInvoice(null)
    setIsRejecting(false)
    setRejectionReason('')
  }

  // TanStack Table columns (Clean Editorial Hierarchy)
  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'studentName',
      header: 'Siswa & tagihan',
      cell: ({ row }) => {
        const inv = row.original
        return (
          <div className="min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#000000] leading-snug">
                {inv.studentName}
              </span>
              <span className="font-mono text-xs text-[#6B6B6B] tabular-nums">
                {inv.id}
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {inv.programName} · NIS: {inv.nis}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'amount',
      header: 'Nominal SPP',
      cell: ({ getValue }) => (
        <span className="font-semibold text-sm text-[#000000] tabular-nums whitespace-nowrap">
          {formatRupiah(getValue() as number)}
        </span>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Jatuh tempo',
      cell: ({ getValue }) => (
        <span className="text-sm font-normal text-[#555555] tabular-nums whitespace-nowrap">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'bankName',
      header: 'Bank transfer & bukti',
      cell: ({ row }) => {
        const inv = row.original
        if (!inv.bankName && !inv.transferReceiptFile) {
          return (
            <span className="text-xs text-[#888888] italic">
              Belum ada bukti diunggah
            </span>
          )
        }

        return (
          <div className="min-w-[140px]">
            <span className="font-normal text-sm text-[#292524] block leading-snug">
              {inv.bankName || 'Transfer Bank'}
            </span>
            <span className="text-xs text-[#6B6B6B] font-mono truncate max-w-[170px] block mt-0.5">
              {inv.transferReceiptFile || 'struk_transfer.jpg'}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          since={row.original.submittedAt}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const inv = row.original

        if (inv.status === 'menunggu') {
          return (
            <button
              type="button"
              onClick={() => {
                setInspectingInvoice(inv)
                setIsRejecting(false)
                setRejectionReason('')
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Periksa Bukti</span>
            </button>
          )
        }

        if (inv.status === 'lunas') {
          return (
            <button
              type="button"
              onClick={() => setViewingReceipt(inv)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] hover:border-[#000000] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 text-[#555555]" />
              <span>Lihat Kwitansi</span>
            </button>
          )
        }

        if (inv.status === 'ditolak') {
          return (
            <span
              className="text-xs text-[#B3261E] truncate max-w-[150px] block"
              title={inv.rejectedReason}
            >
              {inv.rejectedReason || 'Bukti Ditolak'}
            </span>
          )
        }

        return (
          <span className="text-xs text-[#555555]">Belum Dibayar</span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D2D2D2]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A81E46] block mb-1">
            Keuangan & Tata Usaha
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[#000000] tracking-tight leading-tight">
            Verifikasi Tagihan SPP & Kwitansi Digital
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1">
            Pemeriksaan bukti transfer SPP dari orang tua, verifikasi lunas, dan penerbitan kwitansi digital.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (students.length > 0) {
              setInvoiceForm((prev) => ({
                ...prev,
                studentId: students[0].id,
                programName: students[0].className,
              }))
            }
            setIsAddInvoiceOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[10px] hover:bg-[#262626] transition-colors self-start sm:self-auto cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tagihan SPP Baru</span>
        </button>
      </div>

      {/* 4 Standardized Quick-Filter & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const isSelected = statusFilter === card.key
          return (
            <SummaryMetricCard
              key={card.key}
              title={card.label}
              value={card.count}
              unit="Tagihan"
              description={card.description}
              icon={card.icon}
              variant={card.urgent && card.count > 0 ? 'urgent' : 'default'}
              isSelected={isSelected}
              onClick={() => setStatusFilter(card.key)}
              className="rounded-[14px]"
              footer={
                <div className="text-xs">
                  <span className="font-semibold tabular-nums">
                    {formatRupiah(card.amount)}
                  </span>
                </div>
              }
            />
          )
        })}
      </div>

      {/* Unified DataTable Card */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        searchPlaceholder="Cari nomor tagihan, nama siswa, NIS, atau program..."
        filterSlot={
          <div className="flex items-center gap-2 text-xs">
            <label
              htmlFor="filter-status-tagihan"
              className="font-medium text-[#555555]"
            >
              Status Tagihan:
            </label>
            <select
              id="filter-status-tagihan"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'ALL' | 'menunggu' | 'lunas' | 'unpaid'
                )
              }
              className="h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
            >
              <option value="ALL">Semua Status</option>
              <option value="menunggu">Menunggu Verifikasi</option>
              <option value="lunas">Lunas</option>
              <option value="unpaid">Belum Dibayar / Ditolak</option>
            </select>
          </div>
        }
      />

      {/* DIALOG 1: Periksa Bukti Transfer (BILL-03) */}
      <Dialog.Root
        open={Boolean(inspectingInvoice)}
        onOpenChange={(open) => !open && setInspectingInvoice(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Pemeriksaan Bukti Transfer SPP
                </Dialog.Title>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {inspectingInvoice && (
                <div className="space-y-4 text-xs text-[#000000]">
                  {/* Invoice Summary */}
                  <div className="p-3.5 bg-[#F6F6F6] rounded-[10px] border border-[#D2D2D2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#000000]">
                        {inspectingInvoice.id}
                      </span>
                      <StatusBadge
                        status={inspectingInvoice.status}
                        since={inspectingInvoice.submittedAt}
                      />
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="font-bold text-[14px] text-[#000000] block">
                          {inspectingInvoice.studentName}
                        </span>
                        <span className="text-[#555555] text-xs">
                          {inspectingInvoice.programName} · NIS:{' '}
                          <span className="tabular-nums">{inspectingInvoice.nis}</span>
                        </span>
                      </div>
                      <span className="font-display font-extrabold text-lg text-[#000000] tabular-nums">
                        {formatRupiah(inspectingInvoice.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Mock Proof File Visual Preview */}
                  <div className="space-y-1.5">
                    <span className="font-medium text-[#000000] block">
                      Berkas Bukti Transfer Bank
                    </span>
                    <div className="p-4 border border-dashed border-[#D2D2D2] rounded-[10px] bg-[#F9F9F9] flex flex-col items-center justify-center text-center space-y-2">
                      <FileText className="w-8 h-8 text-[#555555]" />
                      <div>
                        <p className="font-mono text-xs font-semibold text-[#000000]">
                          {inspectingInvoice.transferReceiptFile || 'struk_transfer.jpg'}
                        </p>
                        <p className="text-xs text-[#555555]">
                          Rekening Tujuan: {inspectingInvoice.bankName || 'BSI Cabang Palu'}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-[#555555] bg-[#EEEEEE] border border-[#D2D2D2] px-2 py-0.5 rounded-[4px]">
                        Struk Transaksi Valid (Tercetak Jelas)
                      </span>
                    </div>
                  </div>

                  {/* Rejection Form Input (Toggle) */}
                  {isRejecting ? (
                    <div className="p-3.5 bg-[#F6E7E3] rounded-[10px] border border-[#A1301C] space-y-2">
                      <label className="font-bold text-[#A1301C] block">
                        Alasan Penolakan Bukti Transfer (Wajib diisi) *
                      </label>
                      <textarea
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Contoh: Foto struk buram / nominal transfer belum sesuai tagihan."
                        className="w-full p-2.5 text-xs bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] text-[#000000] focus:outline-none"
                        required
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRejecting(false)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[6px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={!rejectionReason.trim()}
                          onClick={handleConfirmReject}
                          className="px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#B3261E] rounded-[6px] hover:bg-[#921E17] disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Kirim Penolakan
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Modal Actions */}
                  {!isRejecting && (
                    <div className="flex items-center justify-between pt-3 border-t border-[#D2D2D2]">
                      <button
                        type="button"
                        onClick={() => setIsRejecting(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#B3261E] hover:underline cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tolak Bukti Transfer</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectingInvoice(null)}
                          className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmVerify}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verifikasi Lunas & Terbitkan Kwitansi</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG 2: Buat Tagihan SPP Baru (BILL-01) */}
      <Dialog.Root
        open={isAddInvoiceOpen}
        onOpenChange={(open) => !open && setIsAddInvoiceOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Buat Tagihan SPP Baru
                </Dialog.Title>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Pilih Siswa *
                  </label>
                  <SearchableSelect
                    value={invoiceForm.studentId}
                    onChange={(val) => {
                      const stu = students.find((s) => s.id === val)
                      setInvoiceForm({
                        ...invoiceForm,
                        studentId: val,
                        programName: stu?.className || invoiceForm.programName,
                      })
                    }}
                    options={students.map((s) => ({
                      value: s.id,
                      label: s.name,
                      sublabel: `(${s.nis} · ${s.className})`,
                    }))}
                    placeholder="Pilih siswa..."
                    searchPlaceholder="Cari nama atau NIS siswa..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Program / Keterangan Tagihan *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.programName}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        programName: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Nominal SPP (IDR) *
                    </label>
                    <input
                      type="number"
                      step={25000}
                      required
                      value={invoiceForm.amount}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          amount: Number(e.target.value),
                        })
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] font-bold tabular-nums"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Jatuh Tempo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="10 Mei 2026"
                      value={invoiceForm.dueDate}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          dueDate: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    onClick={() => setIsAddInvoiceOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
                  >
                    Terbitkan Tagihan
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Kwitansi Resmi Modal */}
      <ReceiptModal
        invoice={viewingReceipt}
        isOpen={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
      />
    </div>
  )
}
