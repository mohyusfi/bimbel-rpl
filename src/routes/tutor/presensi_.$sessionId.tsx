import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Check,
  Save,
  Loader2,
  Lock,
  Percent,
  Info,
  MapPin,
} from 'lucide-react'
import {
  useTutorDashboardData,
  useAdminMutations,
  useSessionDetails,
} from '~/hooks/use-admin-data'
import { cn } from '~/lib/utils'
import { toast } from '~/components/ui/toast'
import type { AttendanceEntry, AttendanceStatus } from '~/lib/admin-store'
import { isSessionLockedForTutor } from '~/lib/attendance-helpers'

export const Route = createFileRoute('/tutor/presensi_/$sessionId')({
  ssr: false,
  component: TutorPresensiDetailPage,
})

function TutorPresensiDetailPage() {
  const { sessionId } = Route.useParams()
  const { sessions, students } = useTutorDashboardData()
  const { saveSessionAttendance } = useAdminMutations()

  const { data: sessionDetail, isLoading: isLoadingDetail } = useSessionDetails(sessionId)
  const session = sessionDetail || sessions.find((s) => s.id === sessionId)

  // Attendance form state
  const [topic, setTopic] = React.useState<string>('')
  const [entries, setEntries] = React.useState<AttendanceEntry[]>([])
  const [saveSuccess, setSaveSuccess] = React.useState<boolean>(false)
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  // Cek apakah sesi terpilih terkunci (Audit Lock 2 jam)
  const isLocked = React.useMemo(() => {
    if (!session) return false
    return isSessionLockedForTutor(session)
  }, [session])

  // Inisialisasi data topik & daftar kehadiran
  React.useEffect(() => {
    if (session) {
      setTopic(session.topic || '')
      setSaveSuccess(false)

      if (session.entries && session.entries.length > 0) {
        setEntries(session.entries)
      } else {
        // Fallback: dari data siswa yang tergabung di rombel kelas ini
        const classStudents = students.filter((s) => s.classId === session.classId)
        const newEntries: AttendanceEntry[] = classStudents.map((s) => ({
          studentId: s.id,
          studentName: s.name,
          nis: s.nis,
          status: 'hadir',
          note: '',
        }))
        setEntries(newEntries)
      }
    }
  }, [session?.id, session?.topic, session?.entries, students])

  // Hitung jumlah kehadiran
  const countHadir = entries.filter((e) => e.status === 'hadir').length
  const countSakit = entries.filter((e) => e.status === 'sakit').length
  const countIzin = entries.filter((e) => e.status === 'izin').length
  const countAlpa = entries.filter((e) => e.status === 'alpa').length
  const totalStudents = entries.length
  const attendancePercentage = totalStudents > 0 ? Math.round((countHadir / totalStudents) * 100) : 0

  // Quick mark all as Hadir
  const handleMarkAllHadir = () => {
    if (isLocked) return
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        status: 'hadir',
      }))
    )
  }

  // Update status per siswa
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isLocked) return
    setEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId ? { ...entry, status } : entry
      )
    )
  }

  // Update catatan per siswa
  const handleNoteChange = (studentId: string, note: string) => {
    if (isLocked) return
    setEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId ? { ...entry, note } : entry
      )
    )
  }

  // Simpan perubahan presensi
  const handleSave = async () => {
    if (!session || isLocked) return
    setIsSaving(true)
    try {
      await saveSessionAttendance({
        sessionId: session.id,
        topic: topic.trim() || session.subjectName,
        entries,
      })

      const anyAlpa = entries.some((e) => e.status === 'alpa')
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)

      toast.success('Perubahan presensi sesi berhasil disimpan!', {
        description: anyAlpa
          ? 'Data rekapitulasi kehadiran siswa telah diperbarui. Peringatan alpa dan status kehadiran lainnya diteruskan ke notifikasi orang tua/wali terkait.'
          : 'Data rekapitulasi kehadiran siswa telah diperbarui dan diteruskan ke notifikasi orang tua/wali terkait.',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan presensi'
      toast.error('Gagal menyimpan perubahan presensi', {
        description: msg,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingDetail && !session) {
    return (
      <div className="p-12 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#000000]" />
        <p className="text-xs text-[#555555]">Memuat detail sesi bimbingan...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            to="/tutor/presensi"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#555555] hover:text-[#000000] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Presensi Sesi</span>
          </Link>
        </div>
        <div className="p-8 text-center border border-dashed border-[#D2D2D2] rounded-[10px] space-y-2 bg-[#FFFFFF]">
          <AlertCircle className="w-6 h-6 mx-auto text-[#901B14]" />
          <h2 className="font-semibold text-sm text-[#000000]">Sesi Bimbingan Tidak Ditemukan</h2>
          <p className="text-xs text-[#555555]">
            Sesi dengan ID ini tidak terdaftar atau telah dihapus dari sistem.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tombol Navigasi Kembali */}
      <div>
        <Link
          to="/tutor/presensi"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#555555] hover:text-[#000000] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Presensi Sesi</span>
        </Link>
      </div>

      {/* Header Halaman Detail */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#D2D2D2]">
          <div>
            <span className="text-[11px] font-bold text-[#CB2957] uppercase tracking-wider block">
              Detail Arsip Presensi Sesi
            </span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-[#000000] mt-1">
              {session.subjectName} ({session.className})
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#555555] mt-2">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#888888]" />
                <span>{session.roomName}</span>
              </span>
              <span className="text-[#D2D2D2]">·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#888888]" />
                <span>{session.dayOfWeek}, {session.sessionDate}</span>
              </span>
              <span className="text-[#D2D2D2]">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#888888]" />
                <span className="tabular-nums font-mono">{session.startTime}–{session.endTime} WITA</span>
              </span>
              {session.completedAt && (
                <>
                  <span className="text-[#D2D2D2]">·</span>
                  <span className="text-[11px] text-[#555555]">
                    Disimpan: {new Date(session.completedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </>
              )}
            </div>
          </div>

          <div>
            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#555555]">
                <Lock className="w-3.5 h-3.5 text-[#555555]" />
                <span>Arsip Terkunci (Mode Baca-Saja)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#166534]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
                <span>Tersimpan (Grace Period 2 Jam)</span>
              </span>
            )}
          </div>
        </div>

        {/* Audit Lock Banner jika sesi telah terkunci > 2 jam */}
        {isLocked && (
          <div className="flex items-start gap-3 p-4 bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-xs text-[#555555]">
            <Lock className="w-4 h-4 text-[#555555] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-[#000000] block">
                Sesi Terkunci Permanen (Batas Toleransi Koreksi 2 Jam Telah Berakhir)
              </span>
              <p className="leading-relaxed">
                Catatan presensi dan evaluasi topik pada sesi ini berada dalam mode baca-saja (read-only) untuk melindungi integritas arsip rapor siswa. Hubungi Administrator jika memerlukan pembukaan kunci audit resmi.
              </p>
            </div>
          </div>
        )}

        {/* Topik Bahasan Pertemuan */}
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="detail-topic"
            className="font-semibold text-xs text-[#000000] block"
          >
            Topik Bahasan Pertemuan <span className="text-[#CB2957]">*</span>
          </label>
          <input
            id="detail-topic"
            type="text"
            disabled={isLocked}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Contoh: Mekanika Dinamika & Hukum Newton Lanjutan"
            className="w-full h-10 px-3.5 text-xs bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000] disabled:bg-[#F6F6F6] disabled:text-[#555555] disabled:cursor-not-allowed"
          />
          <p className="text-[11px] text-[#555555]">
            Topik ini tercatat pada laporan kehadiran orang tua dan buku kendali siswa.
          </p>
        </div>
      </div>

      {/* Ringkasan Metrik Kehadiran & Persentase */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#166534] block">
              Hadir
            </span>
            <div className="font-display font-bold text-2xl text-[#166534] tabular-nums mt-0.5">
              {countHadir}
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#166534] opacity-80" />
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#85600F] block">
              Sakit
            </span>
            <div className="font-display font-bold text-2xl text-[#85600F] tabular-nums mt-0.5">
              {countSakit}
            </div>
          </div>
          <Clock className="w-5 h-5 text-[#85600F] opacity-80" />
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#3A5A80] block">
              Izin
            </span>
            <div className="font-display font-bold text-2xl text-[#3A5A80] tabular-nums mt-0.5">
              {countIzin}
            </div>
          </div>
          <AlertCircle className="w-5 h-5 text-[#3A5A80] opacity-80" />
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#901B14] block">
              Alpa
            </span>
            <div className="font-display font-bold text-2xl text-[#901B14] tabular-nums mt-0.5">
              {countAlpa}
            </div>
          </div>
          <XCircle className="w-5 h-5 text-[#901B14] opacity-80" />
        </div>

        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[10px] p-3.5 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] font-semibold text-[#000000] block">
              Kehadiran
            </span>
            <div className="font-display font-bold text-2xl text-[#000000] tabular-nums mt-0.5">
              {attendancePercentage}%
            </div>
          </div>
          <Percent className="w-5 h-5 text-[#555555] opacity-80" />
        </div>
      </div>

      {/* Peringatan Visual Jika Ada Siswa Berstatus Alpa */}
      {countAlpa > 0 && !isLocked && (
        <div className="bg-[#FFFFFF] border-l-4 border-l-[#901B14] border border-[#D2D2D2] rounded-[10px] p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#901B14] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-[#901B14]">
              Peringatan: {countAlpa} Siswa Tercatat Alpa (Tanpa Keterangan)
            </p>
            <p className="text-xs text-[#555555] leading-relaxed">
              Pada penyimpanan pertama sesi ini, status kehadiran setiap siswa (termasuk Alpa) otomatis diteruskan ke notifikasi orang tua/wali terkait. Penyuntingan berikutnya dalam masa grace period tidak mengirim ulang notifikasi.
            </p>
          </div>
        </div>
      )}

      {/* Tabel Checklist Presensi Siswa Detail */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#D2D2D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-base text-[#000000]">
              Daftar Hadir Siswa
            </h2>
            <p className="text-xs text-[#555555] mt-0.5">
              Total <span className="font-semibold text-[#000000]">{entries.length} siswa</span> terdaftar di rombel ini
            </p>
          </div>

          {!isLocked && (
            <button
              type="button"
              onClick={handleMarkAllHadir}
              className="inline-flex items-center justify-center gap-1.5 bg-[#FFFFFF] border border-[#D2D2D2] hover:bg-[#F6F6F6] text-[#000000] text-xs font-semibold px-3.5 py-2 rounded-[8px] transition-colors cursor-pointer shrink-0"
            >
              <Check className="w-3.5 h-3.5 text-[#166534]" />
              <span>Tandai Semua Hadir</span>
            </button>
          )}
        </div>

        {/* List of Students */}
        <div className="divide-y divide-[#D2D2D2]">
          {entries.map((entry, index) => {
            const isAlpa = entry.status === 'alpa'
            return (
              <div
                key={entry.studentId}
                className={cn(
                  'p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors',
                  isAlpa ? 'bg-[#FFFBFB] border-l-4 border-l-[#901B14]' : 'hover:bg-[#FAFAFA]'
                )}
              >
                {/* Student Info */}
                <div className="flex items-start gap-3 min-w-[220px]">
                  <span className="text-xs font-mono font-semibold text-[#555555] pt-0.5 w-5 tabular-nums">
                    {index + 1}.
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#000000]">
                        {entry.studentName}
                      </span>
                      {isAlpa && (
                        <span className="text-[11px] font-semibold text-[#901B14] inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-[#901B14]" />
                          <span>Alpa</span>
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-[#555555] block">
                      {entry.nis}
                    </span>
                  </div>
                </div>

                {/* Segmented Status Buttons (4 options) */}
                <div className="flex items-center gap-1 bg-[#F6F6F6] p-1 rounded-[8px] border border-[#D2D2D2] shrink-0 self-start sm:self-auto">
                  {(['hadir', 'sakit', 'izin', 'alpa'] as const).map((st) => {
                    const isActive = entry.status === st
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleStatusChange(entry.studentId, st)}
                        className={cn(
                          'px-3 py-1.5 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed',
                          isActive && st === 'hadir' && 'bg-[#166534] text-[#FFFFFF]',
                          isActive && st === 'sakit' && 'bg-[#85600F] text-[#FFFFFF]',
                          isActive && st === 'izin' && 'bg-[#3A5A80] text-[#FFFFFF]',
                          isActive && st === 'alpa' && 'bg-[#901B14] text-[#FFFFFF]',
                          !isActive && 'text-[#555555] hover:text-[#000000] hover:bg-[#FFFFFF]',
                          isLocked && !isActive && 'hover:text-[#555555] hover:bg-transparent opacity-60'
                        )}
                      >
                        {st}
                      </button>
                    )
                  })}
                </div>

                {/* Note Input */}
                <div className="w-full lg:max-w-xs">
                  <input
                    type="text"
                    disabled={isLocked}
                    placeholder={isLocked ? 'Tidak ada catatan' : 'Catatan khusus (opsional)...'}
                    value={entry.note || ''}
                    onChange={(e) =>
                      handleNoteChange(entry.studentId, e.target.value)
                    }
                    className="w-full h-8 px-2.5 text-xs bg-[#FFFFFF] border border-[#D2D2D2] rounded-[6px] focus:outline-none focus:border-[#000000] disabled:bg-[#F6F6F6] disabled:text-[#555555] disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 bg-[#F6F6F6] border-t border-[#D2D2D2] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#555555] text-center sm:text-left">
            {isLocked
              ? 'Sesi dalam mode arsip baca-saja. Perubahan tidak dapat disimpan.'
              : 'Pastikan data kehadiran telah dicek sebelum menekan simpan perubahan.'}
          </div>

          {!isLocked ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#000000] hover:bg-[#222222] disabled:opacity-50 text-[#FFFFFF] font-semibold text-xs px-5 py-2.5 rounded-[8px] transition-colors cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF]" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#FFFFFF]" />
                  <span>Perubahan Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Presensi</span>
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#555555]">
              <Lock className="w-3.5 h-3.5 text-[#555555]" />
              <span>Arsip Terkunci (Mode Baca-Saja)</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
