import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Dialog } from '@base-ui/react/dialog'
import {
  Building2,
  Package,
  Edit,
  X,
} from 'lucide-react'
import {
  useAdminRooms,
  useAdminCourses,
  useAdminSchedules,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import { StatusBadge } from '~/components/ui/status-badge'
import type { Room, Course } from '~/lib/admin-store'
import { cn, formatRupiah } from '~/lib/utils'

export const Route = createFileRoute('/admin/ruangan')({
  ssr: false,
  component: AdminRuanganPage,
})

function AdminRuanganPage() {
  const { data: rooms = [] } = useAdminRooms()
  const { data: courses = [] } = useAdminCourses()
  const { data: schedules = [] } = useAdminSchedules()

  const { addRoom, toggleRoomActive, updateCourse } = useAdminMutations()

  // Modals state
  const [isAddRoomOpen, setIsAddRoomOpen] = React.useState(false)
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null)

  // Room Form State
  const [roomForm, setRoomForm] = React.useState({
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
    await addRoom({
      name: roomForm.name,
      capacity: Number(roomForm.capacity),
      facilities: roomForm.facilities,
    })
    setIsAddRoomOpen(false)
    setRoomForm({ name: '', capacity: 12, facilities: '' })
  }

  // Handle Open Course Edit
  const handleOpenCourseEdit = (course: Course) => {
    setEditingCourse(course)
    setCourseForm({
      price: course.price,
      maxStudents: course.maxStudents,
      description: course.description,
    })
  }

  // Handle Save Course Edit
  const handleCourseEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCourse) return

    await updateCourse({
      id: editingCourse.id,
      updates: {
        price: Number(courseForm.price),
        maxStudents: Number(courseForm.maxStudents),
        description: courseForm.description,
      },
    })
    setEditingCourse(null)
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
        <div className="flex items-center justify-between pb-2 border-b border-[#D2D2D2]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#000000]" />
            <h2 className="font-display font-bold text-base text-[#000000]">
              Ruang Belajar Fisik Bimbel
            </h2>
          </div>
          <span className="text-xs text-[#555555]">
            Maksimal 12 kursi per ruangan untuk kenyamanan belajar intensif.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.map((room) => {
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
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-[#555555] block">
                        {room.id}
                      </span>
                      <h3 className="font-display font-bold text-lg text-[#000000] mt-0.5">
                        {room.name}
                      </h3>
                    </div>
                    <StatusBadge
                      status={room.isActive ? 'aktif' : 'nonaktif'}
                      label={room.isActive ? 'Tersedia' : 'Perbaikan'}
                    />
                  </div>

                  {/* Progress Bar 1: Kapasitas Kursi */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#555555]">
                      <span>Kapasitas Kursi</span>
                      <span className="font-semibold text-[#000000] tabular-nums">
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
                    <div className="flex items-center justify-between text-xs text-[#555555]">
                      <span>Sesi Terjadwal</span>
                      <span className="font-semibold text-[#000000] tabular-nums">
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

                <div className="pt-3 border-t border-[#D2D2D2] flex items-center justify-between">
                  <span className="text-[11px] text-[#555555]">
                    Status Ruangan:
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRoomActive(room.id)}
                    className="text-xs font-semibold text-[#000000] hover:text-[#A81E46] transition-colors cursor-pointer underline"
                  >
                    {room.isActive ? 'Tandai Perbaikan' : 'Aktifkan Kembali'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: Master Paket Program Bimbel */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#D2D2D2]">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#000000]" />
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
                {courses.map((course) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DIALOG 1: Tambah Ruangan Baru */}
      <Dialog.Root
        open={isAddRoomOpen}
        onOpenChange={(open) => !open && setIsAddRoomOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Tambah Ruang Belajar Fisik
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

              <form onSubmit={handleAddRoomSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Nama Ruangan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ruang Palu-5"
                    value={roomForm.name}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, name: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Kapasitas Kursi (Standar 12 Kursi) *
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={16}
                    required
                    value={roomForm.capacity}
                    onChange={(e) =>
                      setRoomForm({
                        ...roomForm,
                        capacity: Number(e.target.value),
                      })
                    }
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
                    placeholder="Contoh: AC 1.5 PK, TV Display 55 inch, Whiteboard magnetik"
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
                    onClick={() => setIsAddRoomOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
                  >
                    Simpan Ruangan
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG 2: Edit Tarif & Kuota Paket Program */}
      <Dialog.Root
        open={Boolean(editingCourse)}
        onOpenChange={(open) => !open && setEditingCourse(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Edit Tarif & Ketentuan Paket
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

              {editingCourse && (
                <form onSubmit={handleCourseEditSubmit} className="space-y-3.5 text-xs">
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
                        Maksimal Siswa / Kelas *
                      </label>
                      <input
                        type="number"
                        min={6}
                        max={16}
                        required
                        value={courseForm.maxStudents}
                        onChange={(e) =>
                          setCourseForm({
                            ...courseForm,
                            maxStudents: Number(e.target.value),
                          })
                        }
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
                      onClick={() => setEditingCourse(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer"
                    >
                      Simpan Perubahan
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
