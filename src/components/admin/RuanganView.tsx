import * as React from 'react'
import { Dialog } from '@base-ui/react/dialog'
import {
  Building2,
  Package,
  Edit,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  useAdminRooms,
  useAdminCourses,
  useAdminSchedules,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { StatusBadge } from '~/components/ui/status-badge'
import { Skeleton } from '~/components/ui/skeleton'
import type { Room, Course } from '~/lib/admin-store'
import { cn, formatRupiah } from '~/lib/utils'

export function RuanganView() {
  const { data: rooms = [], isLoading: isRoomsLoading } = useAdminRooms()
  const { data: courses = [], isLoading: isCoursesLoading } = useAdminCourses()
  const { data: schedules = [] } = useAdminSchedules()

  const { addRoom, updateRoom, toggleRoomActive, updateCourse } = useAdminMutations()

  // Modals state
  const [isAddRoomOpen, setIsAddRoomOpen] = React.useState(false)
  const [editingRoom, setEditingRoom] = React.useState<Room | null>(null)
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null)
  const [isSubmittingRoom, setIsSubmittingRoom] = React.useState(false)
  const [roomError, setRoomError] = React.useState<string | null>(null)
  const [isEditingRoom, setIsEditingRoom] = React.useState(false)
  const [editRoomError, setEditRoomError] = React.useState<string | null>(null)
  const [isSubmittingCourse, setIsSubmittingCourse] = React.useState(false)
  const [courseError, setCourseError] = React.useState<string | null>(null)

  // Room Form State (Add)
  const [roomForm, setRoomForm] = React.useState({
    name: '',
    capacity: 12,
    facilities: '',
  })

  // Room Edit Form State
  const [editRoomForm, setEditRoomForm] = React.useState({
    name: '',
    capacity: 12,
    facilities: '',
  })

  // Course Edit Form State
  const [courseForm, setCourseForm] = React.useState({
    price: 0,
    maxStudents: 12,
    description: '',
  })

  // Handle Add Room
  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingRoom) return
    setRoomError(null)
    setIsSubmittingRoom(true)
    try {
      const cap = Math.min(12, Math.max(1, Number(roomForm.capacity) || 12))
      await addRoom({
        name: roomForm.name.trim(),
        capacity: cap,
        facilities: roomForm.facilities.trim(),
      })
      setIsAddRoomOpen(false)
      setRoomForm({ name: '', capacity: 12, facilities: '' })
    } catch (err: unknown) {
      setRoomError(err instanceof Error ? err.message : 'Gagal menambahkan ruangan.')
    } finally {
      setIsSubmittingRoom(false)
    }
  }

  // Handle Open Room Edit
  const handleOpenRoomEdit = (room: Room) => {
    setEditingRoom(room)
    setEditRoomError(null)
    setEditRoomForm({
      name: room.name,
      capacity: Math.min(12, Math.max(1, room.capacity)),
      facilities: room.facilities,
    })
  }

  // Handle Save Room Edit
  const handleEditRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRoom || isEditingRoom) return

    setEditRoomError(null)
    setIsEditingRoom(true)
    try {
      const cap = Math.min(12, Math.max(1, Number(editRoomForm.capacity) || 12))
      await updateRoom({
        id: editingRoom.id,
        updates: {
          name: editRoomForm.name.trim(),
          capacity: cap,
          facilities: editRoomForm.facilities.trim(),
        },
      })
      setEditingRoom(null)
    } catch (err: unknown) {
      setEditRoomError(err instanceof Error ? err.message : 'Gagal memperbarui data ruangan.')
    } finally {
      setIsEditingRoom(false)
    }
  }

  // Handle Open Course Edit
  const handleOpenCourseEdit = (course: Course) => {
    setEditingCourse(course)
    setCourseError(null)
    setCourseForm({
      price: course.price,
      maxStudents: Math.min(12, Math.max(1, course.maxStudents)),
      description: course.description,
    })
  }

  // Handle Save Course Edit
  const handleCourseEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCourse || isSubmittingCourse) return

    setCourseError(null)
    setIsSubmittingCourse(true)
    try {
      const maxStudents = Math.min(12, Math.max(1, Number(courseForm.maxStudents) || 12))
      await updateCourse({
        id: editingCourse.id,
        updates: {
          price: Number(courseForm.price),
          maxStudents,
          description: courseForm.description.trim(),
        },
      })
      setEditingCourse(null)
    } catch (err: unknown) {
      setCourseError(err instanceof Error ? err.message : 'Gagal memperbarui tarif paket.')
    } finally {
      setIsSubmittingCourse(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D2D2D2]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A81E46] block mb-1">
            Fasilitas & Paket Belajar
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[#000000] tracking-tight leading-tight">
            Ruang Belajar Fisik & Paket Program
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1">
            Manajemen inventaris ruang bimbingan fisik dan master paket program bimbingan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddRoomOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[10px] hover:bg-[#262626] transition-colors self-start sm:self-auto cursor-pointer shrink-0"
        >
          <Building2 className="w-4 h-4" />
          <span>Tambah Ruang Belajar</span>
        </button>
      </div>

      {/* SECTION 1: Ruang Belajar Fisik */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pb-2 border-b border-[#D2D2D2]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#000000] shrink-0" />
            <h2 className="font-display font-bold text-base text-[#000000]">
              Ruang Belajar Fisik Bimbel
            </h2>
          </div>
          <span className="text-xs text-[#555555]">
            Maksimal 12 kursi per ruangan untuk kenyamanan belajar intensif.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {isRoomsLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`room-skeleton-${idx}`}
                data-testid="room-skeleton-card"
                className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-5 w-28" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-[4px] shrink-0" />
                  </div>

                  {/* Progress Bar 1: Kapasitas Kursi Skeleton */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="w-full h-2 rounded-full" />
                  </div>

                  {/* Progress Bar 2: Sesi Terjadwal Skeleton */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="w-full h-2 rounded-full" />
                  </div>

                  <Skeleton className="h-3 w-3/4 pt-1" />
                </div>

                <div className="pt-3 border-t border-[#D2D2D2] flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))
          ) : rooms.length === 0 ? (
            <div className="col-span-full bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-8 text-center text-xs text-[#555555]">
              Belum ada ruang belajar fisik yang terdaftar.
            </div>
          ) : (
            rooms.map((room) => {
              const roomSchedules = schedules.filter((s) => s.roomId === room.id)
              const capacityPct = Math.round((room.capacity / 12) * 100)
              const sessionUsagePct = Math.min(100, Math.round((roomSchedules.length / 10) * 100))

              return (
                <div
                  key={room.id}
                  className={cn(
                    'bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between space-y-4 transition-colors',
                    !room.isActive && 'bg-[#F9F9F9] opacity-80'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono font-semibold text-[#555555] block">
                          {room.id}
                        </span>
                        <h3 className="font-display font-bold text-lg text-[#000000] mt-0.5 truncate">
                          {room.name}
                        </h3>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge
                          status={room.isActive ? 'aktif' : 'nonaktif'}
                          label={room.isActive ? 'Tersedia' : 'Perbaikan'}
                        />
                      </div>
                    </div>

                    {/* Progress Bar 1: Kapasitas Kursi */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#555555]">
                        <span className="truncate">Kapasitas Kursi</span>
                        <span className="font-semibold text-[#000000] tabular-nums shrink-0 whitespace-nowrap">
                          {room.capacity} / 12 kursi
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#F6F6F6] rounded-full overflow-hidden border border-[#D2D2D2]">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            room.isActive ? 'bg-[#000000]' : 'bg-[#A1301C]'
                          )}
                          style={{ width: `${Math.min(100, capacityPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress Bar 2: Sesi Terjadwal */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#555555]">
                        <span className="truncate">Sesi Terjadwal</span>
                        <span className="font-semibold text-[#000000] tabular-nums shrink-0 whitespace-nowrap">
                          {roomSchedules.length} sesi mingguan
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#F6F6F6] rounded-full overflow-hidden border border-[#D2D2D2]">
                        <div
                          className="h-full rounded-full bg-[#CB2957] transition-all duration-300"
                          style={{ width: `${sessionUsagePct}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-[#555555] leading-relaxed pt-1 border-t border-[#D2D2D2]/60">
                      {room.facilities}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#D2D2D2] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenRoomEdit(room)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#000000] hover:text-[#CB2957] transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#555555]" />
                      <span>Edit Ruangan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRoomActive(room.id)}
                      className="text-xs font-medium text-[#555555] hover:text-[#000000] transition-colors cursor-pointer underline shrink-0 whitespace-nowrap"
                    >
                      {room.isActive ? 'Tandai Perbaikan' : 'Aktifkan Kembali'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* SECTION 2: Master Paket Program Bimbel */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pb-2 border-b border-[#D2D2D2]">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#000000] shrink-0" />
            <h2 className="font-display font-bold text-base text-[#000000]">
              Master Paket Program Bimbingan Belajar
            </h2>
          </div>
          <span className="text-xs text-[#555555]">
            Struktur tarif biaya SPP bulanan per jenjang bimbingan.
          </span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F6F6F6] border-b border-[#D2D2D2] text-[#000000] font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Nama paket program</th>
                  <th className="px-5 py-3.5">Tarif SPP bulanan</th>
                  <th className="px-5 py-3.5">Maksimal siswa</th>
                  <th className="px-5 py-3.5">Rombel aktif</th>
                  <th className="px-5 py-3.5">Deskripsi bimbingan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D2D2D2]">
                {isCoursesLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr
                      key={`course-skeleton-${idx}`}
                      data-testid="course-skeleton-row"
                      className="hover:bg-[#F9F9F9] transition-colors"
                    >
                      <td className="px-5 py-4.5">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3.5 w-8 font-mono" />
                        </div>
                      </td>
                      <td className="px-5 py-4.5">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-5 py-4.5">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-5 py-4.5">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-5 py-4.5">
                        <Skeleton className="h-3.5 w-64 max-w-full" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end">
                          <Skeleton className="h-7 w-20 rounded-[8px]" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : courses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-xs text-[#555555]"
                    >
                      Belum ada paket program bimbingan belajar.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-[#F9F9F9] transition-colors">
                      <td className="px-5 py-4.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#000000] block">
                            {course.name}
                          </span>
                          <span className="font-mono text-xs text-[#6B6B6B] tabular-nums">
                            {course.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4.5 font-semibold text-sm text-[#000000] tabular-nums whitespace-nowrap">
                        {formatRupiah(course.price)}
                      </td>
                      <td className="px-5 py-4.5 tabular-nums text-sm font-normal text-[#555555] whitespace-nowrap">
                        {course.maxStudents} siswa / kelas
                      </td>
                      <td className="px-5 py-4.5 tabular-nums text-sm font-normal text-[#555555] whitespace-nowrap">
                        {course.activeClassesCount} rombel
                      </td>
                      <td className="px-5 py-4.5 text-[#555555] max-w-sm leading-relaxed text-xs">
                        {course.description}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenCourseEdit(course)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] hover:border-[#000000] transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#555555]" />
                          <span>Edit Tarif</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DIALOG 1: Tambah Ruangan Baru */}
      <Dialog.Root
        open={isAddRoomOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmittingRoom) {
            setIsAddRoomOpen(false)
            setRoomError(null)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Tambah Ruang Belajar Baru
                </Dialog.Title>
                <Dialog.Close
                  disabled={isSubmittingRoom}
                  render={
                    <button
                      type="button"
                      disabled={isSubmittingRoom}
                      onClick={() => setRoomError(null)}
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleAddRoomSubmit} className="space-y-3.5 text-xs">
                {roomError && (
                  <div
                    className="p-3 bg-[#F6E7E3] border border-[#901B14]/30 rounded-[8px] flex items-start gap-2.5 text-xs text-[#901B14]"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{roomError}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Nama Ruangan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ruang Palu-3"
                    value={roomForm.name}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, name: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Kapasitas Kursi (Maks. 12 Kursi) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={roomForm.capacity}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setRoomForm({
                        ...roomForm,
                        capacity: val > 12 ? 12 : Math.max(1, val),
                      })
                    }}
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Fasilitas Ruangan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: AC Daikin, Smart TV, Whiteboard Magnetik"
                    value={roomForm.facilities}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, facilities: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    disabled={isSubmittingRoom}
                    onClick={() => {
                      setIsAddRoomOpen(false)
                      setRoomError(null)
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRoom}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isSubmittingRoom ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan Ruangan...</span>
                      </>
                    ) : (
                      <span>Simpan Ruangan</span>
                    )}
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG 2: Edit Ruangan */}
      <Dialog.Root
        open={Boolean(editingRoom)}
        onOpenChange={(open) => {
          if (!open && !isEditingRoom) {
            setEditingRoom(null)
            setEditRoomError(null)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Edit Data Ruang Belajar
                </Dialog.Title>
                <Dialog.Close
                  disabled={isEditingRoom}
                  render={
                    <button
                      type="button"
                      disabled={isEditingRoom}
                      onClick={() => setEditRoomError(null)}
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {editingRoom && (
                <form onSubmit={handleEditRoomSubmit} className="space-y-3.5 text-xs">
                  {editRoomError && (
                    <div
                      className="p-3 bg-[#F6E7E3] border border-[#901B14]/30 rounded-[8px] flex items-start gap-2.5 text-xs text-[#901B14]"
                      role="alert"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{editRoomError}</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Nama Ruangan *
                    </label>
                    <input
                      type="text"
                      required
                      value={editRoomForm.name}
                      onChange={(e) =>
                        setEditRoomForm({ ...editRoomForm, name: e.target.value })
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Kapasitas Kursi (Maks. 12 Kursi) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      required
                      value={editRoomForm.capacity}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setEditRoomForm({
                          ...editRoomForm,
                          capacity: val > 12 ? 12 : Math.max(1, val),
                        })
                      }}
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] tabular-nums"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Fasilitas Ruangan *
                    </label>
                    <input
                      type="text"
                      required
                      value={editRoomForm.facilities}
                      onChange={(e) =>
                        setEditRoomForm({ ...editRoomForm, facilities: e.target.value })
                      }
                      className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                    <button
                      type="button"
                      disabled={isEditingRoom}
                      onClick={() => {
                        setEditingRoom(null)
                        setEditRoomError(null)
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isEditingRoom}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isEditingRoom ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan Perubahan...</span>
                        </>
                      ) : (
                        <span>Simpan Perubahan</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG 3: Edit Tarif & Kuota Paket Program */}
      <Dialog.Root
        open={Boolean(editingCourse)}
        onOpenChange={(open) => {
          if (!open && !isSubmittingCourse) {
            setEditingCourse(null)
            setCourseError(null)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Edit Tarif & Ketentuan Paket
                </Dialog.Title>
                <Dialog.Close
                  disabled={isSubmittingCourse}
                  render={
                    <button
                      type="button"
                      disabled={isSubmittingCourse}
                      onClick={() => setCourseError(null)}
                      className="p-1 text-[#555555] hover:text-[#000000] rounded-[6px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {editingCourse && (
                <form onSubmit={handleCourseEditSubmit} className="space-y-3.5 text-xs">
                  {courseError && (
                    <div
                      className="p-3 bg-[#F6E7E3] border border-[#901B14]/30 rounded-[8px] flex items-start gap-2.5 text-xs text-[#901B14]"
                      role="alert"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{courseError}</span>
                    </div>
                  )}

                  <div className="p-3 bg-[#F6F6F6] rounded-[10px] border border-[#D2D2D2]">
                    <div className="font-bold text-[14px] text-[#000000]">
                      {editingCourse.name}
                    </div>
                    <div className="text-xs text-[#555555]">
                      Kode Program: {editingCourse.code}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-medium text-[#000000]">
                        Tarif SPP Bulanan (IDR) *
                      </label>
                      <input
                        type="number"
                        step={25000}
                        required
                        value={courseForm.price}
                        onChange={(e) =>
                          setCourseForm({
                            ...courseForm,
                            price: Number(e.target.value),
                          })
                        }
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] font-bold tabular-nums"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-[#000000]">
                        Maksimal Siswa / Kelas (Maks. 12) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        required
                        value={courseForm.maxStudents}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setCourseForm({
                            ...courseForm,
                            maxStudents: val > 12 ? 12 : Math.max(1, val),
                          })
                        }}
                        className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[#000000]">
                      Deskripsi Bimbingan *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={courseForm.description}
                      onChange={(e) =>
                        setCourseForm({
                          ...courseForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2.5 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                    <button
                      type="button"
                      disabled={isSubmittingCourse}
                      onClick={() => {
                        setEditingCourse(null)
                        setCourseError(null)
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCourse}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isSubmittingCourse ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan Perubahan...</span>
                        </>
                      ) : (
                        <span>Simpan Perubahan</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
