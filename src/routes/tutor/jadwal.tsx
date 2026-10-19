import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ClipboardCheck,
  Search,
  BookOpen,
} from 'lucide-react'
import { useTutorDashboardData } from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { cn } from '~/lib/utils'
import type { Schedule } from '~/lib/admin-store'

export const Route = createFileRoute('/tutor/jadwal')({
  ssr: false,
  component: TutorJadwalPage,
})

const DAYS = ['Semua Hari', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const

function TutorJadwalPage() {
  const { schedules, classes, students } = useTutorDashboardData()
  const [selectedDay, setSelectedDay] = React.useState<string>('Semua Hari')

  const filteredSchedules = selectedDay === 'Semua Hari'
    ? schedules
    : schedules.filter((s) => s.dayOfWeek === selectedDay)

  // Map student count per class
  const getStudentCount = (classId: string) => {
    const cls = classes.find((c) => c.id === classId)
    if (cls && typeof cls.studentCount === 'number') {
      return cls.studentCount
    }
    return students.filter((s) => s.classId === classId).length
  }

  const columns: ColumnDef<Schedule>[] = [
    {
      accessorKey: 'dayOfWeek',
      header: 'Hari & Waktu',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-xs text-[#000000] block">
            {row.original.dayOfWeek}
          </span>
          <span className="font-mono text-[11px] text-[#555555] tabular-nums">
            {row.original.startTime}–{row.original.endTime} WITA
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'subjectName',
      header: 'Mata Pelajaran',
      cell: ({ row }) => (
        <div className="font-semibold text-xs text-[#000000]">
          {row.original.subjectName}
        </div>
      ),
    },
    {
      accessorKey: 'className',
      header: 'Kelas / Rombel',
      cell: ({ row }) => (
        <div className="font-medium text-xs text-[#292524]">
          {row.original.className}
        </div>
      ),
    },
    {
      accessorKey: 'roomName',
      header: 'Ruangan',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-[#555555]">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#888888]" />
          <span>{row.original.roomName}</span>
        </div>
      ),
    },
    {
      id: 'studentCount',
      header: 'Siswa Terdaftar',
      cell: ({ row }) => {
        const count = getStudentCount(row.original.classId)
        return (
          <div className="flex items-center gap-1.5 text-xs text-[#292524]">
            <Users className="w-3.5 h-3.5 shrink-0 text-[#888888]" />
            <span className="tabular-nums font-medium">{count} siswa</span>
          </div>
        )
      },
    },
    {
      id: 'action',
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Link
            to="/tutor/presensi"
            className="inline-flex items-center gap-1.5 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] font-semibold text-xs px-3 py-1.5 rounded-[6px] transition-colors shrink-0"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Presensi Sesi</span>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#555555]">
          PORTAL PENGAJAR
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#000000] tracking-tight mt-1">
          Jadwal Mengajar
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-1.5 leading-relaxed">
          Daftar jadwal bimbingan tatap muka mingguan terstruktur per hari, kelas, dan ruangan.
        </p>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#555555]">Total Sesi Mengajar</span>
            <div className="font-display font-bold text-2xl text-[#000000] tabular-nums mt-0.5">
              {schedules.length}
            </div>
            <span className="text-[11px] text-[#555555]">Sesi per pekan</span>
          </div>
          <div className="w-10 h-10 rounded-full border border-[#D2D2D2] flex items-center justify-center text-[#292524]">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#555555]">Rombel Bimbingan</span>
            <div className="font-display font-bold text-2xl text-[#000000] tabular-nums mt-0.5">
              {new Set(schedules.map((s) => s.classId)).size}
            </div>
            <span className="text-[11px] text-[#555555]">Kelas aktif diampu</span>
          </div>
          <div className="w-10 h-10 rounded-full border border-[#D2D2D2] flex items-center justify-center text-[#292524]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#555555]">Ruangan Digunakan</span>
            <div className="font-display font-bold text-2xl text-[#000000] tabular-nums mt-0.5">
              {new Set(schedules.map((s) => s.roomId)).size}
            </div>
            <span className="text-[11px] text-[#555555]">Kapasitas AC & proyektor</span>
          </div>
          <div className="w-10 h-10 rounded-full border border-[#D2D2D2] flex items-center justify-center text-[#292524]">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Day Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map((day) => {
          const isActive = selectedDay === day
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={cn(
                'px-3.5 py-1.5 rounded-[8px] text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-[#000000] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] border border-[#D2D2D2] text-[#555555] hover:text-[#000000] hover:bg-[#F6F6F6]'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Schedule DataTable */}
      <DataTable
        columns={columns}
        data={filteredSchedules}
        searchPlaceholder="Cari mapel, kelas, atau ruangan..."
        renderMobileCard={(sch) => {
          const count = getStudentCount(sch.classId)
          return (
            <div className="p-4 space-y-3 bg-[#FFFFFF]">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-sm text-[#000000] block">
                    {sch.subjectName}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-[#555555]">
                    <span className="font-medium text-[#292524]">{sch.className}</span>
                    <span className="text-[#D2D2D2]">·</span>
                    <span>{sch.roomName}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-semibold text-xs text-[#000000] block">
                    {sch.dayOfWeek}
                  </span>
                  <span className="text-[11px] text-[#555555] tabular-nums">
                    {sch.startTime}–{sch.endTime} WITA
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#D2D2D2] flex items-center justify-between">
                <span className="text-xs text-[#555555] tabular-nums font-medium">
                  {count} siswa terdaftar
                </span>
                <Link
                  to="/tutor/presensi"
                  className="inline-flex items-center gap-1.5 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] font-semibold text-xs px-3 py-1.5 rounded-[6px] transition-colors"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Presensi Sesi</span>
                </Link>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
