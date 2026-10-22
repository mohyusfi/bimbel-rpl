import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Clock,
  MapPin,
  Calendar,
  Info,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useStudentDashboardData, useAttendanceSessions } from '~/hooks/use-admin-data'
import type { Schedule } from '~/lib/admin-store'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'

export const Route = createFileRoute('/student/jadwal')({
  ssr: false,
  component: StudentJadwalPage,
})

function StudentJadwalPage() {
  const { student, classSchedules } = useStudentDashboardData()
  const { data: studentSessions = [] } = useAttendanceSessions()
  const [selectedSubject, setSelectedSubject] = React.useState<string>('Semua')

  // Subject options for filter slot
  const subjects = ['Semua', ...Array.from(new Set(classSchedules.map((s) => s.subjectName)))]

  // Filtered schedules
  const filteredData =
    selectedSubject === 'Semua'
      ? classSchedules
      : classSchedules.filter((s) => s.subjectName === selectedSubject)

  // Columns for DataTable
  const columns: ColumnDef<Schedule>[] = [
    {
      accessorKey: 'dayOfWeek',
      header: 'Hari',
      cell: ({ row }) => (
        <span className="font-bold text-sm text-[#000000]">
          {row.original.dayOfWeek}
        </span>
      ),
    },
    {
      id: 'time',
      header: 'Waktu bimbingan',
      cell: ({ row }) => {
        const nextSession = studentSessions.find(
          (s: any) => s.scheduleId === row.original.id && !s.isCompleted
        )
        return (
          <div className="space-y-0.5">
            <span className="tabular-nums font-mono text-xs text-[#292524] whitespace-nowrap block">
              {row.original.startTime} – {row.original.endTime} WITA
            </span>
            {nextSession && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#CB2957] font-medium block">
                <Clock className="w-3 h-3 shrink-0" />
                Sesi: {nextSession.sessionDate}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'subjectName',
      header: 'Mata pelajaran',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-sm text-[#000000] block">
            {row.original.subjectName}
          </span>
          <span className="text-xs text-[#555555]">
            {row.original.className}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'roomName',
      header: 'Ruang kelas',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-[#292524]">
          <MapPin className="w-3.5 h-3.5 text-[#555555] shrink-0" />
          <span>{row.original.roomName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'tutorName',
      header: 'Tutor pembimbing',
      cell: ({ row }) => (
        <span className="text-sm text-[#292524]">
          {row.original.tutorName}
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

  return (
    <div className="space-y-6">
      {/* 1. Page Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D2D2D2]/60">
        <div>
          <span className="text-xs font-semibold tracking-wider text-[#555555] uppercase block mb-1">
            Akademik & Penjadwalan
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#000000]">
            Jadwal Bimbingan Belajar
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1 leading-relaxed">
            Matriks slot jadwal bimbingan tatap muka mingguan kelas {student?.className || 'UTBK Intensif A'}.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 text-xs text-[#555555]">
          <Calendar className="w-4 h-4 text-[#CB2957]" />
          <span className="font-semibold text-[#000000]">{classSchedules.length} Sesi / Pekan</span>
        </div>
      </div>

      {/* Info Callout */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[12px] p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#CB2957] shrink-0 mt-0.5" />
        <div className="text-xs text-[#555555] leading-relaxed">
          <strong className="text-[#000000]">Ketentuan Kehadiran:</strong> Seluruh sesi bimbingan tatap muka dilaksanakan sesuai waktu WITA di unit bimbingan. Siswa diimbau hadir 10 menit sebelum kelas dimulai untuk mempersiapkan modul dan absensi presensi digital oleh tutor.
        </div>
      </div>

      {/* 2. DataTable with filter slot & renderMobileCard */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Cari mapel, tutor, ruangan, atau hari..."
        filterSlot={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#555555] font-medium hidden sm:inline">
              Mata Pelajaran:
            </span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="h-9 px-3 text-xs bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#000000] cursor-pointer"
            >
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#555555] ml-1">
              <Clock className="w-3.5 h-3.5 text-[#555555]" />
              <span>WITA (UTC+8)</span>
            </div>
          </div>
        }
        renderMobileCard={(row) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#D2D2D2]/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#000000]">
                  {row.dayOfWeek}
                </span>
                <span className="text-[#A8A8A8] font-normal">/</span>
                <span className="font-mono text-xs tabular-nums text-[#555555]">
                  {row.startTime}–{row.endTime} WITA
                </span>
              </div>
              <StatusBadge status="terjadwal" label="Terjadwal" />
            </div>

            <div>
              <h3 className="font-semibold text-sm text-[#000000]">
                {row.subjectName}
              </h3>
              <p className="text-xs text-[#555555] mt-0.5">
                {row.className}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-[#555555] pt-1">
              <span>{row.tutorName}</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#555555]" />
                <span>{row.roomName}</span>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}