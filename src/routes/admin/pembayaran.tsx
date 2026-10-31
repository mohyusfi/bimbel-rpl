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
  ChevronDown,
  RotateCcw,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  useAdminInvoices,
  useAdminStudents,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { supabase } from '~/lib/supabase/client'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'
import { ReceiptModal } from '~/components/dashboard/ReceiptModal'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { cn, formatRupiah, formatDueDate } from '~/lib/utils'
import { SearchableSelect } from '~/components/ui/searchable-select'
import type { Invoice } from '~/lib/admin-store'

export const Route = createFileRoute('/admin/pembayaran')({
  ssr: false,
  component: AdminPembayaranPage,
})

function getDefaultDueDate(): string {
  const now = new Date()
  const target = new Date(
    now.getFullYear(),
    now.getDate() > 10 ? now.getMonth() + 1 : now.getMonth(),
    10
  )
  const y = target.getFullYear()
  const m = String(target.getMonth() + 1).padStart(2, '0')
  const d = String(target.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function AdminPembayaranPage() {
  const { data: invoices = [], isLoading: isLoadingInvoices } = useAdminInvoices()
  const { data: students = [], isLoading: isLoadingStudents } = useAdminStudents()
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
  const [resolvedReceiptUrl, setResolvedReceiptUrl] = React.useState<string | null>(null)
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [isRejectingSubmit, setIsRejectingSubmit] = React.useState(false)
  const [verifyError, setVerifyError] = React.useState<string | null>(null)
  const [isCreatingInvoice, setIsCreatingInvoice] = React.useState(false)
  const [createInvoiceError, setCreateInvoiceError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true
    if (!inspectingInvoice) {
      setResolvedReceiptUrl(null)
      return
    }

    if (inspectingInvoice.receiptUrl) {
      setResolvedReceiptUrl(inspectingInvoice.receiptUrl)
      return
    }

    if (inspectingInvoice.storage_path) {
      supabase.storage
        .from('receipts')
        .createSignedUrl(inspectingInvoice.storage_path, 3600)
        .then(({ data }) => {
          if (isMounted) {
            if (data?.signedUrl) {
              setResolvedReceiptUrl(data.signedUrl)
            } else {
              const { data: pubData } = supabase.storage
                .from('receipts')
                .getPublicUrl(inspectingInvoice.storage_path!)
              setResolvedReceiptUrl(pubData?.publicUrl || null)
            }
          }
        })
        .catch(() => {
          if (isMounted) setResolvedReceiptUrl(null)
        })
    } else {
      setResolvedReceiptUrl(null)
    }

    return () => {
      isMounted = false
    }
  }, [inspectingInvoice])

  // New Invoice Form State
  const [invoiceForm, setInvoiceForm] = React.useState({
    studentId: '',
    amount: 450000,
    dueDate: getDefaultDueDate(),
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

  // Filter state helpers
  const isFilterActive = statusFilter !== 'ALL'

  const handleResetFilters = () => {
    setStatusFilter('ALL')
  }

  // Quick Filter Cards data
  const summaryCards = [
    {
      key: 'ALL' as const,
      label: 'Semua Tagihan',
      description: 'Rekap tagihan SPP Pintar Yuk',
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
    if (isCreatingInvoice) return
    const student =
      students.find((s) => s.id === invoiceForm.studentId) || students[0]
    if (!student) return

    setCreateInvoiceError(null)
    setIsCreatingInvoice(true)
    try {
      await createInvoice({
        studentId: student.id,
        studentName: student.name,
        nis: student.nis,
        programName: invoiceForm.programName,
        amount: Number(invoiceForm.amount),
        dueDate: invoiceForm.dueDate,
      })
      setIsAddInvoiceOpen(false)
      setInvoiceForm({
        studentId: '',
        amount: 450000,
        dueDate: getDefaultDueDate(),
        programName: 'Intensif UTBK-SNBT',
      })
    } catch (err: any) {
      setCreateInvoiceError(err?.message || 'Gagal menerbitkan tagihan SPP.')
    } finally {
      setIsCreatingInvoice(false)
    }
  }

  // Handle Verify Invoice
  const handleConfirmVerify = async () => {
    if (!inspectingInvoice || isVerifying || isRejectingSubmit) return
    setVerifyError(null)
    setIsVerifying(true)
    try {
      const res = await verifyInvoice(inspectingInvoice.id)
      const receiptNumber = res?.receiptNumber || inspectingInvoice.receiptNumber || 'KWT-202610-0001'
      const updated: Invoice = {
        ...inspectingInvoice,
        status: 'lunas' as const,
        receiptNumber,
        verifiedAt:
          new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date()) + ' WITA',
        verifiedBy: 'Hj. Nuraini, S.Pd',
      }
      setInspectingInvoice(null)
      setViewingReceipt(updated)
    } catch (err: any) {
      setVerifyError(err?.message || 'Gagal memverifikasi tagihan pembayaran.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle Reject Invoice
  const handleConfirmReject = async () => {
    if (!inspectingInvoice || !rejectionReason.trim() || isRejectingSubmit || isVerifying) return
    setVerifyError(null)
    setIsRejectingSubmit(true)
    try {
      await rejectInvoice(inspectingInvoice.id, rejectionReason.trim())
      setInspectingInvoice(null)
      setIsRejecting(false)
      setRejectionReason('')
    } catch (err: any) {
      setVerifyError(err?.message || 'Gagal menolak bukti transfer.')
    } finally {
      setIsRejectingSubmit(false)
    }
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
                {inv.invoiceNumber || inv.id}
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
          {formatDueDate(getValue() as string)}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
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
              isLoading={isLoadingInvoices}
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
        totalCount={invoices.length}
        counterLabel="tagihan"
        searchPlaceholder="Cari nomor tagihan, nama siswa, NIS, atau program..."
        isLoading={isLoadingInvoices}
        filterSlot={
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Filter: Status Tagihan */}
              <div className="relative flex items-center">
                <CreditCard className="absolute left-3 w-4 h-4 text-[#555555] pointer-events-none" />
                <select
                  id="filter-status-tagihan"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as 'ALL' | 'menunggu' | 'lunas' | 'unpaid'
                    )
                  }
                  className="w-full h-10 pl-9 pr-8 text-xs font-medium bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Status Tagihan</option>
                  <option value="menunggu">Menunggu Verifikasi</option>
                  <option value="lunas">Lunas</option>
                  <option value="unpaid">Belum Dibayar / Ditolak</option>
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#555555] pointer-events-none" />
              </div>
            </div>

            {/* Reset Filter Button if any filter active */}
            {isFilterActive && (
              <div className="mt-2.5 pt-2.5 border-t border-[#D2D2D2]/50 flex items-center justify-between">
                <span className="text-[11px] text-[#555555]">
                  Filter sedang aktif membatasi tagihan yang ditampilkan.
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CB2957] hover:text-[#A81F45] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Semua Filter</span>
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* DIALOG 1: Periksa Bukti Transfer (BILL-03) */}
      <Dialog.Root
        open={Boolean(inspectingInvoice)}
        onOpenChange={(open) => {
          if (!open && !isVerifying && !isRejectingSubmit) {
            setInspectingInvoice(null)
            setIsRejecting(false)
            setRejectionReason('')
            setVerifyError(null)
          }
        }}
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
                  disabled={isVerifying || isRejectingSubmit}
                  render={
                    <button
                      type="button"
                      disabled={isVerifying || isRejectingSubmit}
                      onClick={() => {
                        setIsRejecting(false)
                        setRejectionReason('')
                        setVerifyError(null)
                      }}
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {inspectingInvoice && (
                <div className="space-y-4 text-xs text-[#000000]">
                  {verifyError && (
                    <div
                      className="p-3 bg-[#F6E7E3] border border-[#901B14]/30 rounded-[8px] flex items-start gap-2.5 text-xs text-[#901B14]"
                      role="alert"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{verifyError}</span>
                    </div>
                  )}

                  {/* Invoice Summary */}
                  <div className="p-3.5 bg-[#F6F6F6] rounded-[10px] border border-[#D2D2D2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#000000]">
                        {inspectingInvoice.invoiceNumber || inspectingInvoice.id}
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

                  {/* Berkas Bukti Transfer Fisik */}
                  <div className="space-y-1.5">
                    <span className="font-medium text-[#000000] block text-xs">
                      Berkas Bukti Transfer Bank
                    </span>

                    {resolvedReceiptUrl ? (
                      <div className="p-3 border border-[#D2D2D2] rounded-[10px] bg-[#F9F9F9] flex flex-col items-center justify-center space-y-2">
                        {resolvedReceiptUrl.startsWith('data:application/pdf') ||
                        inspectingInvoice.transferReceiptFile?.toLowerCase().endsWith('.pdf') ? (
                          <div className="p-4 text-center space-y-2">
                            <FileText className="w-10 h-10 text-[#CB2957] mx-auto" />
                            <div>
                              <p className="font-mono text-xs font-semibold text-[#000000]">
                                {inspectingInvoice.transferReceiptFile || 'struk_transfer.pdf'}
                              </p>
                              <p className="text-xs text-[#555555]">
                                Rekening Tujuan: {inspectingInvoice.bankName || 'BSI Cabang Palu'}
                              </p>
                            </div>
                            <a
                              href={resolvedReceiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[6px] hover:bg-[#262626] transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Dokumen PDF Struk</span>
                            </a>
                          </div>
                        ) : (
                          <div className="w-full flex flex-col items-center space-y-2">
                            <img
                              src={resolvedReceiptUrl}
                              alt="Bukti Transfer Fisik"
                              className="max-h-64 object-contain rounded-[8px] border border-[#D2D2D2] bg-[#FFFFFF] mx-auto shadow-xs"
                            />
                            <div className="w-full flex items-center justify-between text-[11px] text-[#555555] pt-1 border-t border-[#D2D2D2]/60">
                              <span className="font-mono truncate max-w-[220px]">
                                {inspectingInvoice.transferReceiptFile || 'struk_transfer.jpg'}
                              </span>
                              <a
                                href={resolvedReceiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#CB2957] hover:underline font-semibold"
                              >
                                <span>Ukuran Penuh</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}
                        <div className="w-full text-xs text-[#555555] flex flex-col sm:flex-row sm:items-center sm:justify-between pt-1 gap-1">
                          <span>Rekening: {inspectingInvoice.bankName || 'BSI Cabang Palu'}</span>
                          <span>
                            Pengunggah: {inspectingInvoice.submittedByName || inspectingInvoice.studentName} (
                            {inspectingInvoice.submittedByRole === 'parent' ? 'Orang Tua' : 'Siswa'})
                          </span>
                        </div>
                      </div>
                    ) : (
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
                        <p className="text-[11px] text-[#555555]">
                          Pengunggah: {inspectingInvoice.submittedByName || inspectingInvoice.studentName} (
                          {inspectingInvoice.submittedByRole === 'parent' ? 'Orang Tua' : 'Siswa'})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rejection Form Input (Toggle) */}
                  {isRejecting ? (
                    <div className="p-3.5 bg-[#F6E7E3] rounded-[10px] border border-[#A1301C] space-y-2.5">
                      <label className="font-bold text-[#A1301C] block text-xs">
                        Alasan Penolakan Bukti Transfer (Wajib diisi) *
                      </label>
                      <textarea
                        rows={2}
                        value={rejectionReason}
                        disabled={isRejectingSubmit}
                        onChange={(e) => {
                          setRejectionReason(e.target.value)
                          if (verifyError) setVerifyError(null)
                        }}
                        placeholder="Contoh: Foto struk buram / nominal transfer belum sesuai tagihan."
                        className="w-full p-2.5 text-xs bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] text-[#000000] placeholder:text-[#888888] focus:outline-none focus:border-[#A1301C] disabled:opacity-60"
                        required
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isRejectingSubmit}
                          onClick={() => {
                            setIsRejecting(false)
                            setRejectionReason('')
                            setVerifyError(null)
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={!rejectionReason.trim() || isRejectingSubmit}
                          onClick={handleConfirmReject}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#B3261E] rounded-[8px] hover:bg-[#921E17] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {isRejectingSubmit ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Mengirim Penolakan...</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Kirim Penolakan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Modal Actions */}
                  {!isRejecting && (
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3 border-t border-[#D2D2D2]">
                      <button
                        type="button"
                        disabled={isVerifying}
                        onClick={() => setIsRejecting(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#B3261E] bg-[#FFFFFF] border border-[#B3261E]/30 rounded-[8px] hover:bg-[#F6E7E3] hover:border-[#B3261E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tolak Bukti</span>
                      </button>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isVerifying}
                          onClick={() => {
                            setInspectingInvoice(null)
                            setIsRejecting(false)
                            setRejectionReason('')
                            setVerifyError(null)
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isVerifying}
                          onClick={handleConfirmVerify}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Memverifikasi...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verifikasi Lunas</span>
                            </>
                          )}
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
        onOpenChange={(open) => !open && !isCreatingInvoice && setIsAddInvoiceOpen(false)}
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
                  disabled={isCreatingInvoice}
                  render={
                    <button
                      type="button"
                      disabled={isCreatingInvoice}
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleCreateInvoiceSubmit} className="space-y-3.5 text-xs">
                {createInvoiceError && (
                  <div
                    className="p-3 bg-[#F6E7E3] border border-[#901B14]/30 rounded-[8px] flex items-start gap-2.5 text-xs text-[#901B14]"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{createInvoiceError}</span>
                  </div>
                )}
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
                    required
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
                    <label
                      htmlFor="invoice-due-date"
                      className="font-medium text-[#000000]"
                    >
                      Jatuh Tempo *
                    </label>
                    <input
                      id="invoice-due-date"
                      type="date"
                      required
                      value={invoiceForm.dueDate}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          dueDate: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] cursor-pointer tabular-nums [color-scheme:light]"
                    />
                    {invoiceForm.dueDate && (
                      <p className="text-[11px] text-[#555555]">
                        Batas pembayaran:{' '}
                        <span className="font-semibold text-[#000000]">
                          {formatDueDate(invoiceForm.dueDate)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    disabled={isCreatingInvoice}
                    onClick={() => {
                      setIsAddInvoiceOpen(false)
                      setCreateInvoiceError(null)
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingInvoice}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isCreatingInvoice ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menerbitkan Tagihan...</span>
                      </>
                    ) : (
                      <span>Terbitkan Tagihan</span>
                    )}
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
