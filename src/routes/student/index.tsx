import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Clock,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Award,
  BookOpen,
  CreditCard,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useStudentDashboardData } from '~/hooks/use-admin-data'
import type { Schedule, LearningMaterial } from '~/lib/admin-store'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'

export const Route = createFileRoute('/student/')({
  ssr: false,
  component: StudentDashboardPage,
})

function StudentDashboardPage() {
  const {
    student,
    classSchedules,
    attendanceRate,
    totalSessions,
    attendedSessions,
    avgGrade,
    materials,
    invoices,
  } = useStudentDashboardData()

  const [downloadNotice, setDownloadNotice] = React.useState<string | null>(null)

  // Status SPP Terkini
  const hasUnpaid = invoices.some((i) => i.status === 'belum_dibayar')
  const hasPending = invoices.some((i) => i.status === 'menunggu')
  const latestInvoice = invoices[0]
  const sppStatusLabel = hasUnpaid
    ? 'Belum Dibayar'
    : hasPending
      ? 'Menunggu'
      : 'Lunas'

  const handleDownload = (material: LearningMaterial) => {
    setDownloadNotice(`Mengunduh berkas "${material.title}"...`)
    const link = document.createElement('a')
    link.href = '#'
    link.setAttribute('download', material.title)
    document.body.appendChild(link)
    setTimeout(() => {
      document.body.removeChild(link)
    }, 100)
    setTimeout(() => {
      setDownloadNotice(null)
    }, 3500)
  }

  // DataTable columns for weekly schedules
  const scheduleColumns: ColumnDef<Schedule>[] = [
    {
      accessorKey: 'dayOfWeek',
      header: 'Hari & waktu',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-sm text-[#000000] block">
            {row.original.dayOfWeek}
          </span>
          <span className="tabular-nums text-xs text-[#555555]">
            {row.original.startTime} – {row.original.endTime} WITA
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'subjectName',
      header: 'Mata pelajaran',
      cell: ({ row }) => (
        <span className="font-medium text-sm text-[#000000]">
          {row.original.subjectName}
        </span>
      ),
    },
    {
      accessorKey: 'tutorName',
      header: 'Tutor pengajar',
      cell: ({ row }) => (
        <span className="text-sm text-[#292524]">
          {row.original.tutorName}
        </span>
      ),
    },
    {
      accessorKey: 'roomName',
      header: 'Ruang bimbingan',
      cell: ({ row }) => (
        <span className="text-xs text-[#555555] font-medium">
          {row.original.roomName}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => (
        <StatusBadge status="terjadwal" label="Terjadwal" />
      ),
    },
  ]

  // Modul terbaru (3 berkas teratas)
  const recentMaterials = materials.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* 1. Clean Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D2D2D2]/60">
        <div>
          <span className="text-xs font-semibold tracking-wider text-[#555555] uppercase block mb-1">
            Ruang Belajar Mandiri
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#000000]">
            Selamat Datang, {student?.name || 'Muhammad Rafly'}
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1 leading-relaxed">
            Akses jadwal belajar bimbingan, unduh materi modul digital, dan pantau progres akademik secara terpadu.
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

      {/* Download Notice Banner */}
      {downloadNotice && (
        <div className="p-3 bg-[#FFFFFF] border-l-4 border-l-[#CB2957] border border-[#D2D2D2] rounded-[10px] text-xs font-semibold text-[#000000] flex items-center justify-between shadow-none">
          <span>{downloadNotice}</span>
          <button
            type="button"
            onClick={() => setDownloadNotice(null)}
            className="text-[#555555] hover:text-[#000000] ml-4 cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryMetricCard
          title="Tingkat Kehadiran"
          value={`${attendanceRate}%`}
          description={`${attendedSessions} dari ${totalSessions || 25} sesi bimbingan dihadiri`}
          icon={CheckCircle2}
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">Kehadiran aktif</span>
              <span className="text-[11px] text-[#555555]">Target min. 85%</span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Rata-rata Skor Try Out"
          value={avgGrade}
          unit="/ 100"
          description="Berdasarkan evaluasi & kuis berkala"
          icon={Award}
          to="/student/nilai"
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">+12 poin</span>
              <span className="text-[11px] text-[#555555]">Bulan berjalan</span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Modul Digital Tersedia"
          value={`${materials.length} Modul`}
          description="Modul teori, tugas, & bank soal"
          icon={BookOpen}
          to="/student/materi"
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">Akses penuh</span>
              <span className="text-[11px] text-[#555555]">Dapat diunduh bebas</span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Status SPP Terkini"
          value={sppStatusLabel}
          description={
            latestInvoice?.dueDate
              ? `Jatuh tempo: ${latestInvoice.dueDate}`
              : 'Tagihan SPP bulan berjalan'
          }
          icon={CreditCard}
          to="/student/tagihan"
          variant={hasUnpaid ? 'urgent' : 'default'}
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">
                {hasUnpaid ? 'Perlu diselesaikan' : 'Kwitansi resmi ada'}
              </span>
              <span className="text-[11px] text-[#555555]">BSI Resmi</span>
            </div>
          }
        />
      </div>

      {/* 3. Sesi Bimbingan Minggu Ini using DataTable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-[#000000]">
              Sesi Bimbingan Minggu Ini
            </h2>
            <p className="text-xs text-[#555555] mt-0.5">
              Jadwal tatap muka bimbingan kelas {student?.className || 'UTBK Intensif A'} di unit Tadulako Cendekia.
            </p>
          </div>
          <Link
            to="/student/jadwal"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000000] hover:text-[#CB2957] transition-colors"
          >
            <span>Lihat jadwal lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DataTable
          columns={scheduleColumns}
          data={classSchedules}
          searchPlaceholder="Cari mapel, tutor, atau hari..."
          filterSlot={
            <div className="inline-flex items-center gap-1.5 text-xs text-[#555555]">
              <Clock className="w-3.5 h-3.5 text-[#555555]" />
              <span>Zona WITA (UTC+8)</span>
            </div>
          }
          renderMobileCard={(row) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#000000]">
                  {row.dayOfWeek}, {row.startTime}–{row.endTime} WITA
                </span>
                <StatusBadge status="terjadwal" label="Terjadwal" />
              </div>
              <p className="font-medium text-sm text-[#292524]">{row.subjectName}</p>
              <div className="flex items-center justify-between text-xs text-[#555555] pt-1">
                <span>{row.tutorName}</span>
                <span>{row.roomName}</span>
              </div>
            </div>
          )}
        />
      </div>

      {/* 4. Modul Digital Terbaru List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-[#000000]">
              Modul Digital Terbaru
            </h2>
            <p className="text-xs text-[#555555] mt-0.5">
              Bahan ajar dan lembar tugas terbaru yang telah diunggah oleh tutor bimbingan.
            </p>
          </div>
          <Link
            to="/student/materi"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000000] hover:text-[#CB2957] transition-colors"
          >
            <span>Semua modul ({materials.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {recentMaterials.length > 0 ? (
            recentMaterials.map((mat) => (
              <div
                key={mat.id}
                className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#000000] transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[8px] bg-[#000000] text-[#FFFFFF] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-[#000000] truncate">
                      {mat.title}
                    </h3>
                    <p className="text-xs text-[#555555] mt-0.5">
                      {mat.subjectName} · Diunggah oleh {mat.tutorName} · {mat.fileSize}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link
                    to="/student/preview/$materialId"
                    params={{ materialId: mat.id }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDownload(mat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[12px] p-8 text-center text-xs text-[#555555]">
              Belum ada modul yang dibagikan untuk kelas ini.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
