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
  AlertCircle,
  XCircle,
  Calendar,
  Filter,
  Pin,
  Megaphone,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  useStudentDashboardData,
  usePortalAnnouncements,
} from '~/hooks/use-admin-data'
import { PortalAnnouncementsWidget } from '~/components/dashboard/PortalAnnouncementsWidget'
import type { Schedule, LearningMaterial } from '~/lib/admin-store'
import { downloadMaterialFile } from '~/lib/download-material'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge, type BadgeStatus } from '~/components/ui/status-badge'
import { cn, formatDueDate } from '~/lib/utils'

export const Route = createFileRoute('/student/')({
  ssr: false,
  component: StudentDashboardPage,
})

interface StudentSessionRow {
  id: string
  sessionId: string
  date: string
  dayOfWeek: string
  timeRange: string
  subjectName: string
  topic: string
  roomName: string
  tutorName: string
  status: BadgeStatus
  isCompleted: boolean
  note?: string
}

function StudentDashboardPage() {
  const {
    student,
    classSchedules,
    sessions,
    attendanceRate,
    totalSessions,
    totalCompleted,
    attendedSessions,
    hadirCount,
    sakitCount,
    izinCount,
    alpaCount,
    avgGrade,
    materials,
    invoices,
  } = useStudentDashboardData()
  const { data: announcements = [] } = usePortalAnnouncements('student')

  const [activeTab, setActiveTab] = React.useState<'kalender' | 'mingguan'>('kalender')
  const [sessionFilter, setSessionFilter] = React.useState<string>('ALL')
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

  const handleDownload = async (material: LearningMaterial) => {
    setDownloadNotice(`Mengunduh berkas "${material.title}"...`)
    try {
      await downloadMaterialFile(material)
      setDownloadNotice(`Berkas "${material.title}" berhasil diunduh.`)
    } catch (err) {
      console.error('Gagal mengunduh berkas:', err)
      setDownloadNotice(`Gagal mengunduh berkas "${material.title}".`)
    } finally {
      setTimeout(() => {
        setDownloadNotice(null)
      }, 3500)
    }
  }

  // Transform actual attendance sessions for current student
  const actualSessionRows: StudentSessionRow[] = React.useMemo(() => {
    return sessions.map((session) => {
      const entry = session.entries.find((e) => e.studentId === student?.id)
      return {
        id: session.id,
        sessionId: session.id,
        date: session.sessionDate,
        dayOfWeek: session.dayOfWeek,
        timeRange: `${session.startTime}–${session.endTime} WITA`,
        subjectName: session.subjectName,
        topic: session.topic || session.subjectName,
        roomName: session.roomName,
        tutorName: session.tutorName,
        status: session.isCompleted ? (entry?.status || 'belum_diabsen') : 'terjadwal',
        isCompleted: session.isCompleted,
        note: entry?.note,
      }
    })
  }, [sessions, student?.id])

  const belumDiabsenCount = React.useMemo(() => {
    return actualSessionRows.filter((r) => r.status === 'belum_diabsen').length
  }, [actualSessionRows])

  // Filtered actual sessions
  const filteredActualSessions = React.useMemo(() => {
    if (sessionFilter === 'ALL') return actualSessionRows
    return actualSessionRows.filter((row) => row.status === sessionFilter)
  }, [actualSessionRows, sessionFilter])

  // Columns for actual calendar sessions
  const sessionColumns: ColumnDef<StudentSessionRow>[] = [
    {
      accessorKey: 'date',
      header: 'Tanggal & Sesi',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-xs text-[#000000] block">
            {row.original.dayOfWeek}, {row.original.date}
          </span>
          <span className="tabular-nums font-mono text-[11px] text-[#555555] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#555555]" />
            <span>{row.original.timeRange}</span>
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'subjectName',
      header: 'Mata Pelajaran & Topik',
      cell: ({ row }) => (
        <div className="space-y-0.5 max-w-sm">
          <span className="font-semibold text-xs text-[#000000] block">
            {row.original.subjectName}
          </span>
          <span className="text-[11px] text-[#555555] line-clamp-1">
            {row.original.topic}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'tutorName',
      header: 'Tutor & Ruangan',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-medium text-xs text-[#292524] block">
            {row.original.tutorName}
          </span>
          <span className="text-[11px] text-[#555555] block">
            {row.original.roomName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'note',
      header: 'Catatan Evaluasi Tutor',
      cell: ({ row }) => (
        <div className="text-xs text-[#555555] max-w-xs">
          {row.original.note ? (
            <span className="italic text-[#292524]">
              &ldquo;{row.original.note}&rdquo;
            </span>
          ) : (
            <span className="text-[#555555]">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status Presensi',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          label={!row.original.isCompleted ? 'Terjadwal' : undefined}
        />
      ),
    },
  ]

  // DataTable columns for weekly recurring schedules
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
        <StatusBadge status="terjadwal" label="Terjadwal Rutin" />
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
            Selamat Datang, {student?.name || 'Siswa'}
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1 leading-relaxed">
            Akses jadwal belajar bimbingan, pantau riwayat presensi sesi aktual, dan unduh materi modul digital.
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

      {/* Pengumuman Resmi Bimbel */}
      <PortalAnnouncementsWidget announcements={announcements} />

      {/* 2. 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryMetricCard
          title="Tingkat Kehadiran"
          value={`${attendanceRate}%`}
          description={
            totalCompleted > 0
              ? `${attendedSessions} dari ${totalCompleted} sesi terlaksana dihadiri`
              : 'Belum ada sesi evaluasi presensi'
          }
          icon={CheckCircle2}
          footer={
            <div className="flex items-center justify-end">
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
              ? `Jatuh tempo: ${formatDueDate(latestInvoice.dueDate)}`
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

      {/* 3. Detail Rekap Presensi Siswa: 4 Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#166534] block">
              Hadir
            </span>
            <div className="font-display font-bold text-xl text-[#166534] tabular-nums mt-0.5">
              {hadirCount}
            </div>
            <span className="text-[10px] text-[#555555]">Pertemuan aktif</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#166534] opacity-80" />
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#8C5806] block">
              Sakit
            </span>
            <div className="font-display font-bold text-xl text-[#8C5806] tabular-nums mt-0.5">
              {sakitCount}
            </div>
            <span className="text-[10px] text-[#555555]">Surat izin sakit</span>
          </div>
          <AlertCircle className="w-5 h-5 text-[#8C5806] opacity-80" />
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#3A5A80] block">
              Izin
            </span>
            <div className="font-display font-bold text-xl text-[#3A5A80] tabular-nums mt-0.5">
              {izinCount}
            </div>
            <span className="text-[10px] text-[#555555]">Izin terkonfirmasi</span>
          </div>
          <Clock className="w-5 h-5 text-[#3A5A80] opacity-80" />
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#901B14] block">
              Alpa
            </span>
            <div className="font-display font-bold text-xl text-[#901B14] tabular-nums mt-0.5">
              {alpaCount}
            </div>
            <span className="text-[10px] text-[#555555]">Tanpa keterangan</span>
          </div>
          <XCircle className="w-5 h-5 text-[#901B14] opacity-80" />
        </div>
      </div>

      {/* 4. Sesi Bimbingan & Presensi Aktual using DataTable */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold font-display text-[#000000]">
              {activeTab === 'kalender'
                ? 'Sesi Bimbingan & Presensi Aktual'
                : 'Jadwal Mingguan Bimbingan'}
            </h2>
            <p className="text-xs text-[#555555] mt-0.5">
              {activeTab === 'kalender'
                ? `Rekap kehadiran tatap muka kelas ${student?.className || 'UTBK Intensif A'} per sesi kalender.`
                : `Jadwal rutin mingguan kelas ${student?.className || 'UTBK Intensif A'} di unit Tadulako Cendekia.`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* View Tab Switcher */}
            <div className="flex items-center gap-1 bg-[#F6F6F6] p-1 rounded-[8px] border border-[#D2D2D2]">
              <button
                type="button"
                onClick={() => setActiveTab('kalender')}
                className={cn(
                  'px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'kalender'
                    ? 'bg-[#000000] text-[#FFFFFF]'
                    : 'text-[#555555] hover:text-[#000000] hover:bg-[#FFFFFF]'
                )}
              >
                Sesi Kalender ({actualSessionRows.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mingguan')}
                className={cn(
                  'px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer',
                  activeTab === 'mingguan'
                    ? 'bg-[#000000] text-[#FFFFFF]'
                    : 'text-[#555555] hover:text-[#000000] hover:bg-[#FFFFFF]'
                )}
              >
                Jadwal Mingguan ({classSchedules.length})
              </button>
            </div>

            <Link
              to="/student/jadwal"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#000000] hover:text-[#CB2957] transition-colors ml-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {activeTab === 'kalender' ? (
          <DataTable
            columns={sessionColumns}
            data={filteredActualSessions}
            searchPlaceholder="Cari mapel, materi bahasan, atau tutor..."
            filterSlot={
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#555555]" />
                <select
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  className="h-9 px-3 text-xs bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
                  aria-label="Filter status presensi"
                >
                  <option value="ALL">Semua Sesi ({actualSessionRows.length})</option>
                  <option value="hadir">Hadir ({hadirCount})</option>
                  <option value="sakit">Sakit ({sakitCount})</option>
                  <option value="izin">Izin ({izinCount})</option>
                  <option value="alpa">Alpa ({alpaCount})</option>
                  {belumDiabsenCount > 0 && (
                    <option value="belum_diabsen">Belum Diabsen ({belumDiabsenCount})</option>
                  )}
                  <option value="terjadwal">Sesi Terjadwal</option>
                </select>
              </div>
            }
            renderMobileCard={(row) => (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-[#000000]">
                      {row.dayOfWeek}, {row.date}
                    </span>
                    <span className="text-[11px] text-[#555555] block tabular-nums font-mono">
                      {row.timeRange}
                    </span>
                  </div>
                  <StatusBadge status={row.status} />
                </div>

                <div className="space-y-0.5">
                  <p className="font-semibold text-xs text-[#000000]">{row.subjectName}</p>
                  <p className="text-xs text-[#555555]">{row.topic}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#555555] pt-1.5 border-t border-[#D2D2D2]/60">
                  <span>Tutor: {row.tutorName}</span>
                  <span>{row.roomName}</span>
                </div>

                {row.note && (
                  <div className="p-2 bg-[#F6F6F6] rounded-[6px] text-xs italic text-[#292524]">
                    &ldquo;{row.note}&rdquo;
                  </div>
                )}
              </div>
            )}
            emptyState="Belum ada rekaman sesi bimbingan yang sesuai kriteria."
          />
        ) : (
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
            emptyState="Belum ada jadwal mingguan yang dikonfigurasi untuk rombel ini."
          />
        )}
      </div>

      {/* 5. Modul Digital Terbaru List */}
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
