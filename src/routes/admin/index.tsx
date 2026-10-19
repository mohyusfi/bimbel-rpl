import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CalendarPlus,
  UserCheck,
  CreditCard,
  Building2,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Pin,
  UserPlus,
  Check,
} from 'lucide-react'
import {
  useAdminSummary,
  useAdminRegistrations,
  useAdminInvoices,
  useAdminAnnouncements,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { StatusBadge } from '~/components/ui/status-badge'
import { ReceiptModal } from '~/components/dashboard/ReceiptModal'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { cn, formatRupiah } from '~/lib/utils'
import type { Invoice } from '~/lib/admin-store'

export const Route = createFileRoute('/admin/')({
  ssr: false,
  component: AdminDashboardIndex,
})

function AdminDashboardIndex() {
  const {
    pendingRegistrationsCount,
    pendingInvoicesCount,
    todaySchedulesCount,
    todaySchedules,
    occupancyPercentage,
    totalEnrolled,
    totalCapacity,
  } = useAdminSummary()

  const { data: registrations = [] } = useAdminRegistrations()
  const { data: invoices = [] } = useAdminInvoices()
  const { data: announcements = [] } = useAdminAnnouncements()
  const { verifyInvoice } = useAdminMutations()

  const [selectedReceiptInvoice, setSelectedReceiptInvoice] =
    React.useState<Invoice | null>(null)

  const pendingRegistrations = registrations
    .filter((r) => r.status === 'menunggu')
    .slice(0, 4)

  const pendingInvoices = invoices
    .filter((i) => i.status === 'menunggu')
    .slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D2D2D2]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A81E46] block mb-1">
            Pusat Kendali Operasional
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[#000000] tracking-tight leading-tight">
            Ringkasan Operasional & Tata Usaha
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1">
            Pantau antrean pendaftaran mandiri, verifikasi pembayaran SPP, dan keterisian jadwal kelas hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto shrink-0">
          <Link
            to="/admin/jadwal"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] hover:bg-[#F6F6F6] hover:border-[#000000] transition-colors"
          >
            <CalendarPlus className="w-4 h-4 text-[#555555]" />
            <span>Tetapkan Jadwal Baru</span>
          </Link>
          <Link
            to="/admin/pendaftaran"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[10px] hover:bg-[#262626] transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>Verifikasi Pendaftaran</span>
          </Link>
        </div>
      </div>

      {/* 4 Standardized KPI Summary Cards (DESIGN.md Editorial Console) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryMetricCard
          title="Pendaftaran Baru"
          value={pendingRegistrationsCount}
          unit="Siswa"
          description="Menunggu verifikasi data & plotting kelas rombel"
          to="/admin/pendaftaran"
          icon={UserPlus}
          variant={pendingRegistrationsCount > 0 ? 'urgent' : 'default'}
          className="rounded-[14px]"
          footer={
            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="font-medium text-[#292524] tabular-nums">
                {pendingRegistrationsCount} antrean masuk
              </span>
              <span className="text-[11px] text-[#555555]">Prioritas hari ini</span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Sesi Hari Ini (WITA)"
          value={todaySchedulesCount}
          unit="Sesi"
          description="Sesi tatap muka terjadwal bebas bentrok ruangan & tutor"
          to="/admin/jadwal"
          icon={Calendar}
          className="rounded-[14px]"
          footer={
            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="font-medium text-[#292524]">
                100% terjadwal
              </span>
              <span className="text-[11px] text-[#555555]">Sesi aktif</span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Bukti SPP Menunggu"
          value={pendingInvoicesCount}
          unit="Tagihan"
          description="Pemeriksaan bukti transfer mutasi bank BNI & BSI"
          to="/admin/pembayaran"
          icon={CreditCard}
          variant={pendingInvoicesCount > 0 ? 'urgent' : 'default'}
          className="rounded-[14px]"
          footer={
            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="font-medium text-[#292524] tabular-nums">
                {pendingInvoicesCount} menunggu cek
              </span>
              <span className="text-[11px] text-[#555555]">Mutasi rekening</span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Keterisian Kursi"
          value={`${occupancyPercentage}%`}
          description={`${totalEnrolled} dari ${totalCapacity} kursi rombel terisi siswa aktif`}
          to="/admin/ruangan"
          icon={Building2}
          className="rounded-[14px]"
          footer={
            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="font-medium text-[#292524]">
                Kapasitas optimal
              </span>
              <span className="text-[11px] text-[#555555]">4 ruang bimbingan</span>
            </div>
          }
        />
      </div>

      {/* Priority Action Queues (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue 1: Calon Siswa Menunggu Verifikasi */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#D2D2D2] flex items-center justify-between gap-3 bg-[#F6F6F6]/70">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-[#000000]">
                  Verifikasi Calon Siswa Baru
                </h2>
                <span className="text-xs font-semibold text-[#555555] tabular-nums">
                  ({pendingRegistrationsCount} menunggu)
                </span>
              </div>
              <p className="text-xs text-[#555555] mt-0.5">
                Pendaftar mandiri dari website yang siap diplot ke rombel belajar.
              </p>
            </div>
            <Link
              to="/admin/pendaftaran"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#000000] hover:text-[#CB2957] transition-colors shrink-0"
            >
              <span>Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#D2D2D2] flex-1">
            {pendingRegistrations.length > 0 ? (
              pendingRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-[#F6F6F6]/50 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-sm text-[#000000] leading-snug">
                      {reg.studentName}
                    </p>
                    <div className="text-xs text-[#6B6B6B] truncate">
                      <span>{reg.studentSchool}</span>
                      <span className="meta-divider" />
                      <span className="font-normal text-[#292524]">
                        {reg.packageName}
                      </span>
                    </div>
                    <div className="pt-0.5">
                      <StatusBadge status={reg.status} since={reg.createdAt} />
                    </div>
                  </div>

                  <Link
                    to="/admin/pendaftaran"
                    className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#000000] hover:text-[#FFFFFF] hover:border-[#000000] transition-colors shrink-0 self-start sm:self-center"
                  >
                    Setujui & Plotting
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-xs text-[#555555]">
                Tidak ada pendaftaran calon siswa baru yang menunggu verifikasi.
              </div>
            )}
          </div>
        </div>

        {/* Queue 2: Bukti Pembayaran SPP Menunggu Verifikasi */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#D2D2D2] flex items-center justify-between gap-3 bg-[#F6F6F6]/70">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-[#000000]">
                  Verifikasi Pembayaran SPP
                </h2>
                <span className="text-xs font-semibold text-[#555555] tabular-nums">
                  ({pendingInvoicesCount} menunggu)
                </span>
              </div>
              <p className="text-xs text-[#555555] mt-0.5">
                Verifikasi mutasi pembayaran SPP siswa dari rekening bimbingan.
              </p>
            </div>
            <Link
              to="/admin/pembayaran"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#000000] hover:text-[#CB2957] transition-colors shrink-0"
            >
              <span>Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#D2D2D2] flex-1">
            {pendingInvoices.length > 0 ? (
              pendingInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-[#F6F6F6]/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-[#000000]">
                        {inv.studentName}
                      </span>
                      <span className="font-mono text-xs text-[#6B6B6B] tabular-nums">
                        {inv.id}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B6B6B]">
                      <span className="font-semibold text-[#000000] tabular-nums">
                        {formatRupiah(inv.amount)}
                      </span>
                      <span className="meta-divider" />
                      <span>{inv.bankName || 'Transfer Bank'}</span>
                    </div>
                    <div className="pt-0.5">
                      <StatusBadge status={inv.status} since={inv.submittedAt} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => verifyInvoice(inv.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verifikasi</span>
                    </button>
                    <Link
                      to="/admin/pembayaran"
                      className="inline-flex items-center px-3 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-xs text-[#555555]">
                Seluruh bukti pembayaran SPP telah diverifikasi lunas.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Schedule Matrix & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Sesi Agenda (2 Cols) */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#D2D2D2] flex items-center justify-between gap-3 bg-[#F6F6F6]/70">
            <div>
              <h2 className="font-display font-bold text-base text-[#000000]">
                Jadwal Bimbingan Hari Ini (WITA)
              </h2>
              <p className="text-xs text-[#555555] mt-0.5">
                Sesi tatap muka terjadwal aktif hari ini di seluruh ruang bimbingan.
              </p>
            </div>
            <Link
              to="/admin/jadwal"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#000000] hover:text-[#CB2957] transition-colors shrink-0"
            >
              <span>Matriks lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F6F6] border-b border-[#D2D2D2]">
                  <th className="px-5 py-3 text-xs font-semibold text-[#555555]">
                    Waktu (WITA)
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#555555]">
                    Rombel & mata pelajaran
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#555555]">
                    Ruangan
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-[#555555]">
                    Tutor pengampu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D2]">
                {todaySchedules.length > 0 ? (
                  todaySchedules.map((sch) => (
                    <tr
                      key={sch.id}
                      className="hover:bg-[#F6F6F6]/65 transition-colors text-sm"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-[#6B6B6B] tabular-nums">
                          {sch.startTime}–{sch.endTime}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-sm text-[#000000] block">
                          {sch.className}
                        </span>
                        <span className="text-xs text-[#6B6B6B] block mt-0.5">
                          {sch.subjectName}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-normal text-sm text-[#292524]">
                        {sch.roomName}
                      </td>
                      <td className="px-5 py-4 font-normal text-sm text-[#292524]">
                        {sch.tutorName}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-xs text-[#555555]"
                    >
                      Tidak ada sesi bimbingan terjadwal untuk hari ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Announcements Widget (1 Col) */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-[#D2D2D2] bg-[#F6F6F6]/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#000000]" />
                <h2 className="font-display font-bold text-base text-[#000000]">
                  Pengumuman Resmi
                </h2>
              </div>
              <Link
                to="/admin/pengumuman"
                className="text-xs font-semibold text-[#000000] hover:text-[#CB2957] transition-colors"
              >
                Kelola
              </Link>
            </div>

            <div className="p-5 space-y-3.5">
              {announcements.slice(0, 2).map((ann) => (
                <div
                  key={ann.id}
                  className={cn(
                    'p-4 bg-[#F6F6F6] rounded-[10px] border border-[#D2D2D2] space-y-1.5',
                    ann.isPinned && 'border-l-4 border-l-[#CB2957]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {ann.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[#A81E46] text-xs font-semibold">
                          <Pin className="w-3 h-3 fill-current" />
                          <span>Disematkan</span>
                        </span>
                      )}
                      <span className="text-[#555555] text-xs">
                        Audiens: {ann.targetAudience}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#555555] tabular-nums">
                      {ann.publishedDate}
                    </span>
                  </div>
                  <h3 className="text-[13px] font-bold text-[#000000] leading-snug">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-[#555555] line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-3.5 bg-[#F6F6F6]/50 border-t border-[#D2D2D2] text-xs text-[#555555] flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-[#555555] shrink-0" />
            <span>Disiarkan ke portal siswa, tutor, dan orang tua.</span>
          </div>
        </div>
      </div>

      {/* Receipt Modal for any preview */}
      <ReceiptModal
        invoice={selectedReceiptInvoice}
        isOpen={Boolean(selectedReceiptInvoice)}
        onClose={() => setSelectedReceiptInvoice(null)}
      />
    </div>
  )
}
