import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Dialog } from '@base-ui/react/dialog'
import {
  Plus,
  Pin,
  PinOff,
  Trash2,
  X,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  useAdminAnnouncements,
  useAdminMutations,
} from '~/hooks/use-admin-data'
import type { Announcement } from '~/lib/admin-store'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/admin/pengumuman')({
  ssr: false,
  component: AdminPengumumanPage,
})

function AdminPengumumanPage() {
  const [audienceFilter, setAudienceFilter] = React.useState<string>('ALL')
  const { data: announcements = [], isLoading } = useAdminAnnouncements({
    targetAudience: audienceFilter,
    role: 'admin',
  })
  const { addAnnouncement, deleteAnnouncement, togglePinAnnouncement } = useAdminMutations()

  // State Feedback
  const [statusMessage, setStatusMessage] = React.useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [togglingPinId, setTogglingPinId] = React.useState<string | null>(null)

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    title: '',
    content: '',
    targetAudience: 'Semua' as Announcement['targetAudience'],
    isPinned: false,
    broadcast: true,
  })

  const [announcementToDelete, setAnnouncementToDelete] =
    React.useState<Announcement | null>(null)

  // Filtered Announcements
  const filteredAnnouncements = announcements.filter((a) => {
    if (audienceFilter === 'ALL') return true
    return a.targetAudience === audienceFilter
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await addAnnouncement({
        title: form.title,
        content: form.content,
        targetAudience: form.targetAudience,
        isPinned: form.isPinned,
        broadcast: form.broadcast,
      })

      setIsAddModalOpen(false)
      setForm({
        title: '',
        content: '',
        targetAudience: 'Semua',
        isPinned: false,
        broadcast: true,
      })
      setStatusMessage({
        type: 'success',
        text: 'Pengumuman resmi berhasil diterbitkan dan disiarkan.',
      })
      setTimeout(() => setStatusMessage(null), 5000)
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menerbitkan pengumuman.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePin = async (ann: Announcement) => {
    setTogglingPinId(ann.id)
    try {
      await togglePinAnnouncement({
        id: ann.id,
        isPinned: !ann.isPinned,
      })
      setStatusMessage({
        type: 'success',
        text: ann.isPinned
          ? 'Sematan pengumuman dilepas.'
          : 'Pengumuman berhasil disematkan di posisi teratas.',
      })
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal mengubah status semat pengumuman.',
      })
    } finally {
      setTogglingPinId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {statusMessage && (
        <div
          className={cn(
            'flex items-center gap-2.5 p-3 rounded-[10px] text-xs font-medium border transition-all',
            statusMessage.type === 'success'
              ? 'bg-[#EBF7EE] text-[#1E4620] border-[#93D7A2]'
              : 'bg-[#FDF0ED] text-[#A1301C] border-[#F2A89B]'
          )}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C62828]" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D2D2D2]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A81E46] block mb-1">
            Pusat Informasi & Notifikasi
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-[28px] text-[#000000] tracking-tight leading-tight">
            Pengumuman Resmi Anemone
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1">
            Publikasi pengumuman operasional, libur bimbingan, dan jadwal try out untuk seluruh warga Anemone.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[10px] hover:bg-[#262626] transition-colors self-start sm:self-auto cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Terbitkan Pengumuman Baru</span>
        </button>
      </div>

      {/* Filter Audiens Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] p-3 rounded-[14px] border border-[#D2D2D2]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-[#555555]">Target Audiens:</span>
          <div className="inline-flex p-1 bg-[#F6F6F6] rounded-[10px] border border-[#D2D2D2]/60">
            {['ALL', 'Semua', 'Siswa', 'Orang Tua', 'Tutor'].map((aud) => (
              <button
                key={aud}
                type="button"
                onClick={() => setAudienceFilter(aud)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-[8px] transition-all cursor-pointer',
                  audienceFilter === aud
                    ? 'bg-[#000000] text-[#FFFFFF]'
                    : 'text-[#555555] hover:text-[#000000]'
                )}
              >
                {aud === 'ALL' ? 'Semua Kategori' : aud}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-medium text-[#555555] tabular-nums hidden sm:block">
          Total: <strong className="text-[#000000]">{filteredAnnouncements.length}</strong> pengumuman
        </span>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={cn(
                'bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 transition-colors space-y-3',
                ann.isPinned && 'border-l-4 border-l-[#CB2957]'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[#A81E46] text-xs font-bold uppercase tracking-wide">
                      <Pin className="w-3.5 h-3.5 fill-current" />
                      <span>Disematkan</span>
                    </span>
                  )}
                  <span className="text-xs text-[#555555]">
                    Untuk: {ann.targetAudience}
                  </span>
                  <span className="text-xs text-[#555555] tabular-nums">
                    {ann.publishedDate}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#555555]">
                    Oleh: <strong className="text-[#000000]">{ann.author}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={togglingPinId === ann.id}
                    onClick={() => handleTogglePin(ann)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer disabled:opacity-60',
                      ann.isPinned
                        ? 'text-[#CB2957] bg-[#FBEAEF] hover:bg-[#F6DCE3]'
                        : 'text-[#555555] hover:text-[#000000] hover:bg-[#F6F6F6] border border-[#D2D2D2]'
                    )}
                    title={ann.isPinned ? 'Lepas sematan' : 'Sematkan di atas'}
                  >
                    {togglingPinId === ann.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#CB2957]" />
                        <span>{ann.isPinned ? 'Melepas sematan...' : 'Menyematkan...'}</span>
                      </>
                    ) : ann.isPinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5" />
                        <span>Lepas Sematan</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5" />
                        <span>Sematkan</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementToDelete(ann)}
                    className="p-1.5 text-[#555555] hover:text-[#B3261E] hover:bg-[#F6E7E3] rounded-[6px] transition-colors cursor-pointer"
                    title="Hapus pengumuman"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-[#000000]">
                  {ann.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#333333] mt-2 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-xs text-[#555555] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px]">
            Belum ada pengumuman resmi yang diterbitkan untuk kategori ini.
          </div>
        )}
      </div>

      {/* DIALOG: Terbitkan Pengumuman Baru */}
      <Dialog.Root
        open={isAddModalOpen}
        onOpenChange={(open) => !open && setIsAddModalOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-lg bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2D2D2] pb-3">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Terbitkan Pengumuman Resmi Anemone
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

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Judul Pengumuman *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jadwal Simulasi Try Out Akbar UTBK-SNBT 2026"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full h-10 px-3 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Target Audiens *
                  </label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        targetAudience: e.target.value as Announcement['targetAudience'],
                      })
                    }
                    className="w-full h-10 px-3 text-xs font-medium bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000]"
                  >
                    <option value="Semua">Semua (Siswa, Orang Tua & Tutor)</option>
                    <option value="Siswa">Siswa Saja</option>
                    <option value="Orang Tua">Orang Tua / Wali Saja</option>
                    <option value="Tutor">Tutor Pengajar Saja</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#000000]">
                    Isi Pengumuman *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tuliskan isi pengumuman lengkap secara jelas dan santun..."
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                    className="w-full p-2.5 text-xs bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-[#000000] focus:outline-none focus:border-[#000000] leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPinnedCheck"
                    checked={form.isPinned}
                    onChange={(e) =>
                      setForm({ ...form, isPinned: e.target.checked })
                    }
                    className="w-4 h-4 rounded-[4px] accent-[#CB2957] cursor-pointer"
                  />
                  <label
                    htmlFor="isPinnedCheck"
                    className="text-xs text-[#000000] font-medium select-none cursor-pointer"
                  >
                    Sematkan di bagian paling atas (Pinned Announcement)
                  </label>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="broadcastCheck"
                    checked={form.broadcast}
                    onChange={(e) =>
                      setForm({ ...form, broadcast: e.target.checked })
                    }
                    className="w-4 h-4 mt-0.5 rounded-[4px] accent-[#CB2957] cursor-pointer"
                  />
                  <label
                    htmlFor="broadcastCheck"
                    className="text-xs text-[#000000] font-medium select-none cursor-pointer leading-tight"
                  >
                    Siarkan notifikasi waktu-nyata ke lonceng seluruh pengguna terkait (Supabase Realtime Broadcast)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] rounded-[8px] hover:bg-[#262626] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menerbitkan...</span>
                      </>
                    ) : (
                      <span>Terbitkan Sekarang</span>
                    )}
                  </button>
                </div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Announcement Confirmation Dialog */}
      <Dialog.Root
        open={Boolean(announcementToDelete)}
        onOpenChange={(open) => !open && !isDeleting && setAnnouncementToDelete(null)}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <Dialog.Popup className="w-full max-w-md bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D2D2D2]">
                <Dialog.Title className="font-display font-bold text-base text-[#000000]">
                  Hapus pengumuman resmi?
                </Dialog.Title>
                <Dialog.Close
                  render={
                    <button
                      type="button"
                      disabled={isDeleting}
                      className="p-1.5 text-[#555555] hover:text-[#000000] hover:bg-[#F6F6F6] rounded-[6px] cursor-pointer disabled:opacity-50"
                      aria-label="Tutup"
                    />
                  }
                >
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>

              {announcementToDelete && (
                <p className="text-xs text-[#555555] leading-relaxed">
                  Pengumuman &ldquo;{announcementToDelete.title}&rdquo; untuk audiens{' '}
                  {announcementToDelete.targetAudience} akan dihapus secara permanen dari papan informasi.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2D2D2]">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setAnnouncementToDelete(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#000000] bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] hover:bg-[#F6F6F6] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (announcementToDelete) {
                      setIsDeleting(true)
                      try {
                        await deleteAnnouncement(announcementToDelete.id)
                        setAnnouncementToDelete(null)
                        setStatusMessage({
                          type: 'success',
                          text: 'Pengumuman berhasil dihapus secara permanen.',
                        })
                        setTimeout(() => setStatusMessage(null), 4000)
                      } catch (err: any) {
                        setStatusMessage({
                          type: 'error',
                          text: err?.message || 'Gagal menghapus pengumuman.',
                        })
                      } finally {
                        setIsDeleting(false)
                      }
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#A1301C] text-[#FFFFFF] rounded-[8px] hover:bg-[#852717] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <span>Hapus pengumuman</span>
                  )}
                </button>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
