import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Dialog } from '@base-ui/react/dialog'
import {
  CalendarPlus,
  Calendar,
  AlertTriangle,
  Trash2,
  X,
  Sparkles,
  Plus,
  DoorClosed,
  UserCheck,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import {
  useAdminSchedules,
  useAdminClasses,
  useAdminTutors,
  useAdminRooms,
  useAdminSubjects,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { StatusBadge } from '~/components/ui/status-badge'
import {
  detectScheduleConflicts,
  type Schedule,
  type PackageCode,
} from '~/lib/admin-store'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/admin/jadwal')({
  ssr: false,
  component: AdminJadwalPage,
})

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const

function AdminJadwalPage() {
  const { data: schedules = [] } = useAdminSchedules()
  const { data: classes = [] } = useAdminClasses()
  const { data: tutors = [] } = useAdminTutors()
  const { data: rooms = [] } = useAdminRooms()
  const { data: subjects = [] } = useAdminSubjects()

  const { addSchedule, deleteSchedule, addClass } = useAdminMutations()

  // View state
  const [activeView, setActiveView] = React.useState<
    'matrix' | 'table' | 'classes'
  >('matrix')

  // Filters
  const [selectedDayFilter, setSelectedDayFilter] = React.useState<string>('ALL')
  const [selectedRoomFilter, setSelectedRoomFilter] =
    React.useState<string>('ALL')
  const [selectedTutorFilter, setSelectedTutorFilter] =
    React.useState<string>('ALL')

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false)
  const [scheduleForm, setScheduleForm] = React.useState({
    classId: '',
    subjectName: '',
    tutorId: '',
    roomId: '',
    dayOfWeek: 'Senin' as (typeof DAYS)[number],
    startTime: '16:00',
    endTime: '17:30',
  })

  // Add Class Modal
  const [isAddClassModalOpen, setIsAddClassModalOpen] = React.useState(false)
  const [classForm, setClassForm] = React.useState({
    name: '',
    courseCode: 'UTBK' as PackageCode,
    courseName: 'Intensif UTBK-SNBT',
    capacity: 12,
    tutorName: '',
  })

  // Delete confirmation state
  const [scheduleToDelete, setScheduleToDelete] = React.useState<Schedule | null>(null)

  // Set default initial values for schedule modal when opened
  const handleOpenScheduleModal = () => {
    const firstClass = classes[0]
    const firstTutor = tutors[0]
    const firstRoom = rooms[0]
    const firstSubject = subjects[0]

    setScheduleForm({
      classId: firstClass?.id || '',
      subjectName: firstSubject?.name || 'Fisika UTBK',
      tutorId: firstTutor?.id || '',
      roomId: firstRoom?.id || '',
      dayOfWeek: 'Senin',
      startTime: '16:00',
      endTime: '17:30',
    })
    setIsScheduleModalOpen(true)
  }

  // Real-Time Conflict Detection (SCHED-02)
  const conflictResult = !isScheduleModalOpen
    ? { hasConflict: false }
    : detectScheduleConflicts(scheduleForm, schedules, rooms)

  // Conflict Simulation button: Instant demo of 2-layer conflict
  const handleTriggerConflictSimulation = () => {
    const firstClass = classes[0]
    const firstTutor = tutors.find((t) => t.id === 'tut-2') || tutors[0]
    const firstRoom = rooms.find((r) => r.id === 'rm-1') || rooms[0]

    setScheduleForm({
      classId: firstClass?.id || '',
      subjectName: 'Simulasi Bentrok 2-Lapis',
      tutorId: firstTutor?.id || '',
      roomId: firstRoom?.id || '',
      dayOfWeek: 'Senin',
      startTime: '16:00',
      endTime: '17:30',
    })
    setIsScheduleModalOpen(true)
  }

  const handleApplySuggestedRoom = (suggestedRoomId: string) => {
    setScheduleForm((prev) => ({ ...prev, roomId: suggestedRoomId }))
  }

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (conflictResult.hasConflict) return

    const targetClass = classes.find((c) => c.id === scheduleForm.classId)
    const targetTutor = tutors.find((t) => t.id === scheduleForm.tutorId)
    const targetRoom = rooms.find((r) => r.id === scheduleForm.roomId)

    if (!targetClass || !targetTutor || !targetRoom) return

    try {
      await addSchedule({
        classId: targetClass.id,
        className: targetClass.name,
        subjectName: scheduleForm.subjectName,
        tutorId: targetTutor.id,
        tutorName: targetTutor.name,
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        dayOfWeek: scheduleForm.dayOfWeek,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
      })
      setIsScheduleModalOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan jadwal'
      alert(message)
    }
  }

  const handleAddClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pkgNames: Record<PackageCode, string> = {
      UTBK: 'Intensif UTBK-SNBT',
      SMA: 'SMA Sukses',
      SMP: 'SMP Prestasi',
      SD: 'SD Cendekia',
    }
    await addClass({
      name: classForm.name,
      courseCode: classForm.courseCode,
      courseName: pkgNames[classForm.courseCode],
      capacity: Number(classForm.capacity),
      tutorName: classForm.tutorName || tutors[0]?.name || 'Tutor Pendamping',
    })
    setIsAddClassModalOpen(false)
    setClassForm({
      name: '',
      courseCode: 'UTBK',
      courseName: 'Intensif UTBK-SNBT',
      capacity: 12,
      tutorName: '',
    })
  }

  // Filtered schedules for views
  const filteredSchedules = schedules.filter((sch) => {
    const matchDay =
      selectedDayFilter === 'ALL' || sch.dayOfWeek === selectedDayFilter
    const matchRoom =
      selectedRoomFilter === 'ALL' || sch.roomId === selectedRoomFilter
    const matchTutor =
      selectedTutorFilter === 'ALL' || sch.tutorId === selectedTutorFilter
    return matchDay && matchRoom && matchTutor
  })

  // Filter state helpers
  const isFilterActive =
    selectedDayFilter !== 'ALL' ||
    selectedRoomFilter !== 'ALL' ||
    selectedTutorFilter !== 'ALL'

  const handleResetFilters = () => {
    setSelectedDayFilter('ALL')
    setSelectedRoomFilter('ALL')
    setSelectedTutorFilter('ALL')
  }

  // TanStack Table columns for 'table' view
  const tableColumns: ColumnDef<Schedule>[] = [
    {
      accessorKey: 'dayOfWeek',
      header: 'Hari & waktu',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-sm text-[#000000] block leading-snug">
            {row.original.dayOfWeek}
          </span>
          <span className="font-mono text-xs text-[#6B6B6B] tabular-nums mt-0.5 inline-block">
            {row.original.startTime}–{row.original.endTime} WITA
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'className',
      header: 'Kelas & rombel',
      cell: ({ row }) => (
        <span className="font-normal text-sm text-[#292524]">
          {row.original.className}
        </span>
      ),
    },
    {
      accessorKey: 'subjectName',
      header: 'Mata pelajaran',
      cell: ({ getValue }) => (
        <span className="text-sm font-normal text-[#555555]">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'roomName',
      header: 'Ruang belajar',
      cell: ({ getValue }) => (
        <span className="text-sm font-normal text-[#292524]">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'tutorName',
      header: 'Tutor pengampu',
      cell: ({ getValue }) => (
        <span className="text-sm font-normal text-[#292524]">
          {getValue() as string}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setScheduleToDelete(row.original)}
          className="p-1.5 text-[#555555] hover:text-[#B3261E] hover:bg-[#F6E7E3] rounded-[6px] transition-colors cursor-pointer"
          title="Hapus sesi"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D2D2D2]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A81E46] block mb-1">
            Manajemen Penjadwalan
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[#000000] tracking-tight leading-tight">
            Master Jadwal Bimbingan & Kelas
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1">
            Pengaturan sesi bimbingan mingguan dengan validasi bentrok ruangan dan tutor 2-lapis.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleTriggerConflictSimulation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] hover:bg-[#F6F6F6] hover:border-[#000000] transition-colors cursor-pointer"
            title="Demonstrasi instan deteksi bentrok ruangan & tutor"
          >
            <Sparkles className="w-4 h-4 text-[#A81E46]" />
            <span>Simulasi Konflik</span>
          </button>

          <button
            type="button"
            onClick={handleOpenScheduleModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[10px] hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Tetapkan Jadwal Baru</span>
          </button>
        </div>
      </div>

      {/* Control Bar Terpadu (Dual-Tier: View Switcher + Grid Filter) */}
      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#D2D2D2] shadow-none overflow-hidden">
        {/* Tier 1: View Switcher & Status Counter */}
        <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented View Switcher */}
          <div className="inline-flex p-1 bg-[#F6F6F6] rounded-[10px] border border-[#D2D2D2]/60 self-start">
            <button
              type="button"
              onClick={() => setActiveView('matrix')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer',
                activeView === 'matrix'
                  ? 'bg-[#000000] text-[#FFFFFF]'
                  : 'text-[#555555] hover:text-[#000000]'
              )}
            >
              Matriks Mingguan
            </button>
            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer',
                activeView === 'table'
                  ? 'bg-[#000000] text-[#FFFFFF]'
                  : 'text-[#555555] hover:text-[#000000]'
              )}
            >
              Tabel Sesi
            </button>
            <button
              type="button"
              onClick={() => setActiveView('classes')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer',
                activeView === 'classes'
                  ? 'bg-[#000000] text-[#FFFFFF]'
                  : 'text-[#555555] hover:text-[#000000]'
              )}
            >
              Rombel & Kelas (<span className="tabular-nums">{classes.length}</span>)
            </button>
          </div>

          {/* Tier 1 Right: Active Sessions Counter */}
          <div className="flex items-center gap-2 self-start sm:self-center text-xs text-[#555555]">
            {activeView !== 'classes' ? (
              <span>
                Menampilkan{' '}
                <strong className="font-semibold text-[#000000] tabular-nums">
                  {filteredSchedules.length}
                </strong>{' '}
                sesi aktif
                {filteredSchedules.length !== schedules.length && (
                  <span className="text-[#888888]"> (dari total {schedules.length})</span>
                )}
              </span>
            ) : (
              <span>
                Total{' '}
                <strong className="font-semibold text-[#000000] tabular-nums">
                  {classes.length}
                </strong>{' '}
                rombel bimbingan
              </span>
            )}
          </div>
        </div>

        {/* Tier 2: Filter Controls (Visible when not in 'classes' view) */}
        {activeView !== 'classes' && (
          <div className="border-t border-[#D2D2D2]/60 bg-[#FAFAFA] p-3 sm:p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Filter 1: Hari */}
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 w-4 h-4 text-[#555555] pointer-events-none" />
                <select
                  id="filter-jadwal-hari"
                  value={selectedDayFilter}
                  onChange={(e) => setSelectedDayFilter(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-medium bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Hari (Senin–Sabtu)</option>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      Hari {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#555555] pointer-events-none" />
              </div>

              {/* Filter 2: Ruangan */}
              <div className="relative flex items-center">
                <DoorClosed className="absolute left-3 w-4 h-4 text-[#555555] pointer-events-none" />
                <select
                  id="filter-jadwal-ruangan"
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-medium bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Ruangan</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#555555] pointer-events-none" />
              </div>

              {/* Filter 3: Tutor */}
              <div className="relative flex items-center">
                <UserCheck className="absolute left-3 w-4 h-4 text-[#555555] pointer-events-none" />
                <select
                  id="filter-jadwal-tutor"
                  value={selectedTutorFilter}
                  onChange={(e) => setSelectedTutorFilter(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-medium bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] transition-colors appearance-none cursor-pointer"
                >
                  <option value="ALL">Semua Tutor</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#555555] pointer-events-none" />
              </div>
            </div>

            {/* Reset Filter Button if any filter active */}
            {isFilterActive && (
              <div className="mt-2.5 pt-2.5 border-t border-[#D2D2D2]/50 flex items-center justify-between">
                <span className="text-[11px] text-[#555555]">
                  Filter sedang aktif membatasi sesi yang ditampilkan.
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
        )}
      </div>

      {/* VIEW 1: Matriks Mingguan (Senin–Sabtu Grid) */}
      {activeView === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.filter(
            (day) => selectedDayFilter === 'ALL' || selectedDayFilter === day
          ).map((day) => {
            const daySchedules = filteredSchedules.filter(
              (s) => s.dayOfWeek === day
            )

            return (
              <div
                key={day}
                className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] overflow-hidden flex flex-col"
              >
                <div className="px-4 py-3 bg-[#F6F6F6] border-b border-[#D2D2D2] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#000000]" />
                    <h3 className="font-display font-bold text-sm text-[#000000]">
                      {day}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[#555555] tabular-nums">
                    {daySchedules.length} sesi
                  </span>
                </div>

                <div className="p-3.5 space-y-3 flex-1 divide-y divide-[#D2D2D2]/50">
                  {daySchedules.length > 0 ? (
                    daySchedules.map((sch) => (
                      <div
                        key={sch.id}
                        className="pt-3 first:pt-0 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-[13px] text-[#000000] leading-snug">
                            {sch.className}
                          </span>
                          <span className="font-mono text-xs text-[#555555] tabular-nums whitespace-nowrap leading-tight">
                            {sch.startTime}–{sch.endTime}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-[#555555]">
                          {sch.subjectName}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-xs text-[#555555]">
                          <span className="font-semibold text-[#000000]">
                            {sch.roomName}
                          </span>
                          <span className="text-[#555555]">
                            {sch.tutorName}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-[#555555]">
                      Tidak ada sesi bimbingan pada hari {day}.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VIEW 2: Tabel Sesi (TanStack Table) */}
      {activeView === 'table' && (
        <DataTable
          columns={tableColumns}
          data={filteredSchedules}
          searchPlaceholder="Cari kelas, mata pelajaran, ruangan, atau tutor..."
        />
      )}

      {/* VIEW 3: Rombel & Kelas */}
      {activeView === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#555555]">
              Daftar rombel aktif per jenjang untuk penempatan calon siswa baru.
            </p>
            <button
              type="button"
              onClick={() => setIsAddClassModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rombel Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const occupancyPct = Math.round(
                (cls.studentCount / cls.capacity) * 100
              )
              const isFull = cls.studentCount >= cls.capacity

              return (
                <div
                  key={cls.id}
                  className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#A81E46] block">
                        {cls.courseName}
                      </span>
                      <h4 className="font-display font-bold text-base text-[#000000] mt-0.5">
                        {cls.name}
                      </h4>
                    </div>
                    <StatusBadge
                      status={isFull ? 'ditolak' : 'aktif'}
                      label={isFull ? 'Penuh' : 'Tersedia'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#555555]">
                      <span>Keterisian kursi</span>
                      <span className="tabular-nums font-semibold text-[#000000]">
                        {cls.studentCount} / {cls.capacity} siswa ({occupancyPct}%)
                      </span>
                    </div>
                    {/* Clean progress bar */}
                    <div className="w-full h-2 bg-[#F6F6F6] rounded-full overflow-hidden border border-[#D2D2D2]">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          isFull ? 'bg-[#A1301C]' : 'bg-[#000000]'
                        )}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#D2D2D2] text-xs text-[#555555] flex items-center justify-between">
                    <span>Tutor Pendamping:</span>
                    <span className="font-semibold text-[#000000]">
                      {cls.tutorName}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* DIALOG 1: Tetapkan Jadwal Baru (dengan SCHED-02 Conflict Engine) */}
      <Dialog.Root
        open={isScheduleModalOpen}
        onOpenChange={(open) => !open && setIsScheduleModalOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 shadow-xl space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <div>
                  <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                    Tetapkan Jadwal Bimbingan Baru
                  </Dialog.Title>
                  <p className="text-[11px] text-[#555555] mt-0.5">
                    Sistem otomatis mengevaluasi bentrok ruangan dan tutor secara real-time.
                  </p>
                </div>
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

              {/* REAL-TIME CONFLICT ALERT CALLOUT (SCHED-02) */}
              {conflictResult.hasConflict && (
                <div className="p-3.5 bg-[#F6E7E3] border border-[#A1301C] rounded-[10px] space-y-2 text-xs text-[#A1301C]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#A1301C] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-[#A1301C]">
                        Peringatan Bentrok Jadwal Terdeteksi!
                      </p>
                      {conflictResult.timeError && (
                        <p>{conflictResult.timeError}</p>
                      )}
                      {conflictResult.roomConflict && (
                        <p>
                          <strong>Bentrok Ruangan:</strong>{' '}
                          {conflictResult.roomConflict.roomName} sudah digunakan
                          oleh kelas{' '}
                          <strong>
                            {conflictResult.roomConflict.className}
                          </strong>{' '}
                          pada hari {conflictResult.roomConflict.dayOfWeek},{' '}
                          {conflictResult.roomConflict.startTime}–
                          {conflictResult.roomConflict.endTime} WITA.
                        </p>
                      )}
                      {conflictResult.tutorConflict && (
                        <p>
                          <strong>Bentrok Tutor:</strong>{' '}
                          {conflictResult.tutorConflict.tutorName} sudah
                          mengajar kelas{' '}
                          <strong>
                            {conflictResult.tutorConflict.className}
                          </strong>{' '}
                          pada jam tersebut ({conflictResult.tutorConflict.startTime}–
                          {conflictResult.tutorConflict.endTime} WITA).
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Automatic empty room suggestion button */}
                  {conflictResult.suggestedRooms &&
                    conflictResult.suggestedRooms.length > 0 && (
                      <div className="pt-2 border-t border-[#A1301C]/30 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] text-[#A1301C] font-semibold">
                          Solusi Ruangan Kosong Tersedia:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {conflictResult.suggestedRooms.map((sr) => (
                            <button
                              key={sr.id}
                              type="button"
                              onClick={() => handleApplySuggestedRoom(sr.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#FFFFFF] bg-[#000000] rounded-[6px] hover:bg-[#262626] transition-colors cursor-pointer"
                            >
                              Gunakan {sr.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Rombel / Kelas *
                    </label>
                    <select
                      value={scheduleForm.classId}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          classId: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      required
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.courseName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Mata Pelajaran *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Fisika UTBK"
                      value={scheduleForm.subjectName}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          subjectName: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Tutor Pengampu *
                    </label>
                    <select
                      value={scheduleForm.tutorId}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          tutorId: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      required
                    >
                      {tutors.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.education.split('—')[0].trim()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Ruang Belajar Fisik *
                    </label>
                    <select
                      value={scheduleForm.roomId}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          roomId: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                      required
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (Kapasitas: {r.capacity} kursi)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">Hari *</label>
                    <select
                      value={scheduleForm.dayOfWeek}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          dayOfWeek: e.target.value as Schedule['dayOfWeek'],
                        })
                      }
                      className="w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Jam Mulai *
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.startTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] tabular-nums"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Jam Selesai *
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.endTime}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          endTime: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] tabular-nums"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={conflictResult.hasConflict}
                    className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Simpan Jadwal Bimbingan
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG 2: Tambah Rombel Baru */}
      <Dialog.Root
        open={isAddClassModalOpen}
        onOpenChange={(open) => !open && setIsAddClassModalOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Tambah Rombel / Kelas Baru
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

              <form onSubmit={handleAddClassSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Nama Rombel / Kelas *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: UTBK Intensif C"
                    value={classForm.name}
                    onChange={(e) =>
                      setClassForm({ ...classForm, name: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Paket Program *
                    </label>
                    <select
                      value={classForm.courseCode}
                      onChange={(e) =>
                        setClassForm({
                          ...classForm,
                          courseCode: e.target.value as PackageCode,
                        })
                      }
                      className="w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    >
                      <option value="UTBK">Intensif UTBK-SNBT</option>
                      <option value="SMA">SMA Sukses</option>
                      <option value="SMP">SMP Prestasi</option>
                      <option value="SD">SD Cendekia</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Kapasitas Maksimal *
                    </label>
                    <input
                      type="number"
                      min={6}
                      max={12}
                      value={classForm.capacity}
                      onChange={(e) =>
                        setClassForm({
                          ...classForm,
                          capacity: Number(e.target.value),
                        })
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] tabular-nums"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Tutor Wali Pendamping
                  </label>
                  <select
                    value={classForm.tutorName}
                    onChange={(e) =>
                      setClassForm({ ...classForm, tutorName: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  >
                    <option value="">Pilih tutor...</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    onClick={() => setIsAddClassModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
                  >
                    Simpan Rombel
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={Boolean(scheduleToDelete)}
        onOpenChange={(open) => !open && setScheduleToDelete(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D2D2D2]">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Hapus jadwal bimbingan?
                </Dialog.Title>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      className="p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#F6F6F6] rounded-[6px] cursor-pointer"
                      aria-label="Tutup"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {scheduleToDelete && (
                <p className="text-xs text-[#555555] leading-relaxed">
                  Anda akan menghapus sesi {scheduleToDelete.subjectName} untuk kelas{' '}
                  {scheduleToDelete.className} ({scheduleToDelete.dayOfWeek},{' '}
                  {scheduleToDelete.startTime}–{scheduleToDelete.endTime} WITA di{' '}
                  {scheduleToDelete.roomName}). Tindakan ini tidak dapat dibatalkan.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                <button
                  type="button"
                  onClick={() => setScheduleToDelete(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (scheduleToDelete) {
                      await deleteSchedule(scheduleToDelete.id)
                      setScheduleToDelete(null)
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-[#A1301C] text-[#FFFFFF] rounded-[8px] hover:bg-[#852717] transition-colors cursor-pointer"
                >
                  Hapus jadwal
                </button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
