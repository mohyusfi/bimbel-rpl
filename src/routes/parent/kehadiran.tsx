import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import {
  CalendarCheck,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react'
import { useParentDashboardData } from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge, type BadgeStatus } from '~/components/ui/status-badge'
import { resolveStudentSessionStatus } from '~/lib/attendance-helpers'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/parent/kehadiran')({
  ssr: false,
  component: ParentAttendancePage,
})

interface AttendanceRow {
  id: string
  sessionId: string
  date: string
  timeRange: string
  subjectName: string
  topic: string
  roomName: string
  tutorName: string
  status: BadgeStatus
  note?: string
}

function ParentAttendancePage() {
  const { childData } = useParentDashboardData()
  const { student, sessions } = childData

  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')

  // Transform sessions into flat rows for the selected child
  const allRows: AttendanceRow[] = sessions.map((session) => {
    const entry = session.entries.find((e) => e.studentId === student?.id)
    return {
      id: `${session.id}-${student?.id}`,
      sessionId: session.id,
      date: session.sessionDate,
      timeRange: `${session.startTime}–${session.endTime} WITA`,
      subjectName: session.subjectName,
      topic: session.topic || session.subjectName,
      roomName: session.roomName,
      tutorName: session.tutorName,
      status: resolveStudentSessionStatus({
        isCompleted: session.isCompleted,
        sessionDate: session.sessionDate,
        endTime: session.endTime,
        entryStatus: entry?.status,
        hasEntry: Boolean(entry),
      }),
      note: entry?.note,
    }
  })

  const menungguTutorCount = React.useMemo(() => {
    return allRows.filter((r) => r.status === 'menunggu_tutor').length
  }, [allRows])

  const belumDicatatCount = React.useMemo(() => {
    return allRows.filter((r) => r.status === 'belum_dicatat').length
  }, [allRows])

  const belumDiabsenCount = React.useMemo(() => {
    return allRows.filter((r) => r.status === 'belum_diabsen').length
  }, [allRows])

  const terjadwalCount = React.useMemo(() => {
    return allRows.filter((r) => r.status === 'terjadwal').length
  }, [allRows])

  // Summary counters from unified childData
  const { hadirCount, sakitCount, izinCount, alpaCount, totalCompleted, attendanceRate } = childData

  // Filtered rows for DataTable
  const filteredRows =
    statusFilter === 'ALL'
      ? allRows
      : allRows.filter((r) => r.status === statusFilter)

  // Columns definition
  const columns: ColumnDef<AttendanceRow>[] = [
    {
      accessorKey: 'date',
      header: 'Tanggal & Sesi',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-xs text-[#000000] tabular-nums">
            {row.original.date}
          </p>
          <p className="text-[11px] text-[#555555] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="tabular-nums">{row.original.timeRange}</span>
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'subjectName',
      header: 'Mata Pelajaran & Materi',
      cell: ({ row }) => (
        <div className="space-y-0.5 max-w-sm">
          <p className="font-semibold text-xs text-[#000000]">
            {row.original.subjectName}
          </p>
          <p className="text-[11px] text-[#555555] line-clamp-1">
            {row.original.topic}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'tutorName',
      header: 'Tutor & Ruangan',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-medium text-xs text-[#292524] flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-[#555555]" />
            <span>{row.original.tutorName}</span>
          </p>
          <p className="text-[11px] text-[#555555] flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#555555]" />
            <span>{row.original.roomName}</span>
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'note',
      header: 'Catatan Tutor',
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
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ]

  // Mobile card view
  const renderMobileCard = (row: AttendanceRow) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-[#000000] tabular-nums">
            {row.date}
          </span>
          <span className="text-[11px] text-[#555555] block tabular-nums">
            {row.timeRange}
          </span>
        </div>
        <StatusBadge status={row.status} />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-bold text-[#000000]">{row.subjectName}</p>
        <p className="text-xs text-[#555555]">{row.topic}</p>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#555555] pt-2 border-t border-[#D2D2D2]/60">
        <span>Tutor: {row.tutorName}</span>
        <span>{row.roomName}</span>
      </div>

      {row.note && (
        <div className="p-2 bg-[#F6F6F6] rounded-[6px] text-xs italic text-[#292524]">
          &ldquo;{row.note}&rdquo;
        </div>
      )}
    </div>
  )

  const filterSlot = (
    <div className="flex items-center gap-2">
      <Filter className="w-3.5 h-3.5 text-[#555555]" />
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="h-9 px-3 text-xs bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
        aria-label="Filter status presensi"
      >
        <option value="ALL">Semua Sesi ({allRows.length})</option>
        <option value="hadir">Hadir ({hadirCount})</option>
        <option value="sakit">Sakit ({sakitCount})</option>
        <option value="izin">Izin ({izinCount})</option>
        <option value="alpa">Alpa ({alpaCount})</option>
        {menungguTutorCount > 0 && (
          <option value="menunggu_tutor">
            Menunggu Presensi Tutor ({menungguTutorCount})
          </option>
        )}
        {belumDicatatCount > 0 && (
          <option value="belum_dicatat">
            Belum Dicatat ({belumDicatatCount})
          </option>
        )}
        {belumDiabsenCount > 0 && (
          <option value="belum_diabsen">
            Belum Diabsen ({belumDiabsenCount})
          </option>
        )}
        <option value="terjadwal">Sesi Terjadwal ({terjadwalCount})</option>
      </select>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#CB2957]">
          Rekapitulasi Presensi Digital
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#000000] tracking-tight">
          Riwayat Kehadiran: {student?.name || 'Siswa'}
        </h1>
        <p className="text-xs sm:text-sm text-[#555555]">
          Pencatatan sesi bimbingan harian secara transparan dan tervalidasi langsung oleh tutor pengajar.
        </p>
      </div>

      {/* Summary Counters: Hadir, Sakit, Izin, Alpa, Rate */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Kehadiran % */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#555555]">Persentase</span>
            <CalendarCheck className="w-4 h-4 text-[#000000]" />
          </div>
          <div className="mt-2">
            <span className="font-display font-extrabold text-2xl text-[#000000] tabular-nums">
              {attendanceRate}%
            </span>
            <p className="text-[11px] text-[#555555] mt-0.5">
              {hadirCount} dari {totalCompleted} sesi terlaksana
            </p>
          </div>
        </div>

        {/* Hadir Counter */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#555555]">Hadir</span>
            <CheckCircle2 className="w-4 h-4 text-[#166534]" />
          </div>
          <div className="mt-2">
            <span className="font-display font-extrabold text-2xl text-[#166534] tabular-nums">
              {hadirCount}
            </span>
            <p className="text-[11px] text-[#555555] mt-0.5">Pertemuan aktif</p>
          </div>
        </div>

        {/* Sakit Counter */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#555555]">Sakit</span>
            <AlertCircle className="w-4 h-4 text-[#8C5806]" />
          </div>
          <div className="mt-2">
            <span className="font-display font-extrabold text-2xl text-[#8C5806] tabular-nums">
              {sakitCount}
            </span>
            <p className="text-[11px] text-[#555555] mt-0.5">Surat keterangan</p>
          </div>
        </div>

        {/* Izin Counter */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#555555]">Izin</span>
            <Clock className="w-4 h-4 text-[#3A5A80]" />
          </div>
          <div className="mt-2">
            <span className="font-display font-extrabold text-2xl text-[#3A5A80] tabular-nums">
              {izinCount}
            </span>
            <p className="text-[11px] text-[#555555] mt-0.5">Pemberitahuan wali</p>
          </div>
        </div>

        {/* Alpa Counter */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#555555]">Alpa</span>
            <XCircle className="w-4 h-4 text-[#901B14]" />
          </div>
          <div className="mt-2">
            <span className="font-display font-extrabold text-2xl text-[#901B14] tabular-nums">
              {alpaCount}
            </span>
            <p className="text-[11px] text-[#555555] mt-0.5">Tanpa konfirmasi</p>
          </div>
        </div>
      </div>

      {/* DataTable of Presensi Sesi */}
      <DataTable
        columns={columns}
        data={filteredRows}
        searchPlaceholder="Cari mapel, topik materi, ruangan, atau tutor..."
        filterSlot={filterSlot}
        renderMobileCard={renderMobileCard}
        emptyState="Belum ada rekaman presensi sesi yang sesuai dengan kriteria pencarian."
      />
    </div>
  )
}
