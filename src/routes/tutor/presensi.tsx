import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  MapPin,
  Users,
  Check,
  Save,
  ChevronDown,
  Info,
  Loader2,
  Lock,
  History,
} from 'lucide-react'
import {
  useTutorDashboardData,
  useAdminMutations,
  useSessionDetails,
} from '~/hooks/use-admin-data'
import { StatusBadge } from '~/components/ui/status-badge'
import { cn } from '~/lib/utils'
import type { AttendanceEntry, AttendanceStatus, AttendanceSession } from '~/lib/admin-store'
import { isSessionLockedForTutor, isSessionOverdue } from '~/lib/attendance-helpers'

export const Route = createFileRoute('/tutor/presensi')({
  ssr: false,
  component: TutorPresensiPage,
})

export function TutorPresensiPage() {
  const { tutor, sessions, students } = useTutorDashboardData()
  const { saveSessionAttendance } = useAdminMutations()

  // Tab: 'pending' (Perlu Presensi) vs 'history' (Riwayat Presensi)
  const [activeTab, setActiveTab] = React.useState<'pending' | 'history'>('pending')

  // Pisahkan sesi menjadi sesi yang belum tervalidasi vs sesi yang sudah selesai
  const pendingSessions = React.useMemo(
    () => sessions.filter((s) => !s.isCompleted),
    [sessions]
  )
  const completedSessions = React.useMemo(
    () => sessions.filter((s) => s.isCompleted),
    [sessions]
  )

  // Selected session state (defaults to first uncompleted session, or first session)
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>('')

  // Sync selected session when sessions change or tab changes
  React.useEffect(() => {
    if (activeTab === 'pending') {
      const current = pendingSessions.find((s) => s.id === selectedSessionId)
      if (!current && pendingSessions.length > 0) {
        setSelectedSessionId(pendingSessions[0].id)
      }
    } else {
      const current = completedSessions.find((s) => s.id === selectedSessionId)
      if (!current && completedSessions.length > 0) {
        setSelectedSessionId(completedSessions[0].id)
      }
    }
  }, [activeTab, pendingSessions, completedSessions, selectedSessionId])

  // Use session detail hook for active session
  const { data: sessionDetail } = useSessionDetails(selectedSessionId)
  const selectedSession =
    sessionDetail || sessions.find((s) => s.id === selectedSessionId) || sessions[0]

  // Attendance form state
  const [topic, setTopic] = React.useState<string>('')
  const [entries, setEntries] = React.useState<AttendanceEntry[]>([])
  const [saveSuccess, setSaveSuccess] = React.useState<boolean>(false)
  const [hasAlpaNotice, setHasAlpaNotice] = React.useState<boolean>(false)
  const [isSaving, setIsSaving] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Cek apakah sesi terpilih terkunci (Audit Lock 24h)
  const isLocked = React.useMemo(() => {
    if (!selectedSession) return false
    return isSessionLockedForTutor(selectedSession)
  }, [selectedSession])

  // Initialize or re-populate entries when selectedSession changes
  React.useEffect(() => {
    if (selectedSession) {
      setTopic(selectedSession.topic || '')
      setSaveSuccess(false)
      setHasAlpaNotice(false)
      setErrorMessage(null)

      if (selectedSession.entries && selectedSession.entries.length > 0) {
        setEntries(selectedSession.entries)
      } else {
        // Fallback: populate from students belonging to this class
        const classStudents = students.filter((s) => s.classId === selectedSession.classId)
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
  }, [selectedSession?.id, selectedSession?.topic, students])

  // Count statuses
  const countHadir = entries.filter((e) => e.status === 'hadir').length
  const countSakit = entries.filter((e) => e.status === 'sakit').length
  const countIzin = entries.filter((e) => e.status === 'izin').length
  const countAlpa = entries.filter((e) => e.status === 'alpa').length

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

  // Update status for single student
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isLocked) return
    setEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId ? { ...entry, status } : entry
      )
    )
  }

  // Update note for single student
  const handleNoteChange = (studentId: string, note: string) => {
    if (isLocked) return
    setEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId ? { ...entry, note } : entry
      )
    )
  }

  // Save attendance
  const handleSave = async () => {
    if (!selectedSession || isLocked) return
    setIsSaving(true)
    setErrorMessage(null)
    const currentId = selectedSession.id
    try {
      await saveSessionAttendance({
        sessionId: currentId,
        topic: topic.trim() || selectedSession.subjectName,
        entries,
      })

      const anyAlpa = entries.some((e) => e.status === 'alpa')
      setHasAlpaNotice(anyAlpa)
      setSaveSuccess(true)

      // Pindahkan langsung ke tab Riwayat Presensi agar pengajar melihat sesi yang telah selesai diarsip
      setActiveTab('history')
      setSelectedSessionId(currentId)

      // Sembunyikan notifikasi sukses setelah 5 detik
      setTimeout(() => {
        setSaveSuccess(false)
      }, 5000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan presensi'
      setErrorMessage(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const displayedSessions = activeTab === 'pending' ? pendingSessions : completedSessions

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#555555]">
          PORTAL PENGAJAR
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#000000] tracking-tight mt-1">
          Presensi Sesi Bimbingan
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-1.5 leading-relaxed">
          Catat kehadiran digital siswa per sesi pertemuan, input pokok bahasan materi, dan berikan catatan evaluasi kehadiran.
        </p>
      </div>

      {/* Tab Switcher: Perlu Presensi vs Riwayat Presensi */}
      <div className="flex items-center gap-2 border-b border-[#D2D2D2] pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer',
            activeTab === 'pending'
              ? 'border-[#000000] text-[#000000]'
              : 'border-transparent text-[#555555] hover:text-[#000000]'
          )}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Perlu Presensi</span>
          <span className="inline-flex items-center justify-center font-mono text-[11px] px-1.5 py-0.5 rounded-full bg-[#EEEEEE] text-[#000000] tabular-nums">
            {pendingSessions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer',
            activeTab === 'history'
              ? 'border-[#000000] text-[#000000]'
              : 'border-transparent text-[#555555] hover:text-[#000000]'
          )}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Presensi</span>
          <span className="inline-flex items-center justify-center font-mono text-[11px] px-1.5 py-0.5 rounded-full bg-[#EEEEEE] text-[#000000] tabular-nums">
            {completedSessions.length}
          </span>
        </button>
      </div>

      {/* Session Selector Strip */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[#000000] block">
            {activeTab === 'pending' ? 'Daftar Sesi Menunggu Presensi' : 'Daftar Sesi Selesai (Arsip)'}
          </label>
          <span className="text-[11px] text-[#555555]">
            Menampilkan {displayedSessions.length} sesi
          </span>
        </div>

        {displayedSessions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#D2D2D2] rounded-[10px] space-y-1">
            <Calendar className="w-6 h-6 mx-auto text-[#888888]" />
            <p className="text-xs font-medium text-[#292524]">
              {activeTab === 'pending'
                ? 'Semua sesi bimbingan telah tervalidasi.'
                : 'Belum ada riwayat sesi bimbingan yang selesai.'}
            </p>
            <p className="text-[11px] text-[#555555]">
              {activeTab === 'pending'
                ? 'Pilih tab Riwayat Presensi untuk meninjau arsip sesi yang telah dicatat.'
                : 'Sesi yang telah disimpan presensinya akan otomatis diarsipkan di sini.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {displayedSessions.map((sess) => {
              const isSelected = sess.id === selectedSession?.id
              const overdue = isSessionOverdue(sess)
              const locked = isSessionLockedForTutor(sess)

              return (
                <button
                  key={sess.id}
                  type="button"
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={cn(
                    'text-left p-3.5 rounded-[10px] border transition-all cursor-pointer flex flex-col justify-between gap-2.5',
                    isSelected
                      ? 'border-2 border-[#000000] bg-[#F6F6F6]'
                      : 'border-[#D2D2D2] bg-[#FFFFFF] hover:border-[#888888]'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-xs text-[#000000] block">
                        {sess.subjectName}
                      </span>
                      <span className="text-[11px] text-[#555555] block">
                        {sess.className} · {sess.roomName}
                      </span>
                    </div>

                    {sess.isCompleted ? (
                      locked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#555555]">
                          <Lock className="w-3.5 h-3.5 text-[#555555]" />
                          <span>Terkunci</span>
                        </span>
                      ) : (
                        <StatusBadge status="hadir" label="Selesai" />
                      )
                    ) : overdue ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#901B14]">
                        <AlertCircle className="w-3.5 h-3.5 text-[#901B14]" />
                        <span>Terlewat</span>
                      </span>
                    ) : (
                      <StatusBadge status="terjadwal" label="Belum Absen" />
                    )}
                  </div>

                  <div className="text-[11px] text-[#555555] flex items-center justify-between pt-1 border-t border-[#D2D2D2]/60">
                    <span>
                      {sess.dayOfWeek}, {sess.sessionDate}
                    </span>
                    <span className="tabular-nums font-mono">
                      {sess.startTime}–{sess.endTime}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedSession ? (
        <div className="space-y-6">
          {/* Audit Lock Banner jika sesi telah terkunci > 24 jam */}
          {isLocked && (
            <div className="flex items-start gap-3 p-4 bg-[#F6F6F6] border border-[#D2D2D2] rounded-[10px] text-xs text-[#555555]">
              <Lock className="w-4 h-4 text-[#555555] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-[#000000] block">
                  Sesi Terkunci Permanen (Batas Toleransi Koreksi 24 Jam Telah Berakhir)
                </span>
                <p className="leading-relaxed">
                  Catatan presensi dan evaluasi topik pada sesi ini berada dalam mode baca-saja (read-only) untuk melindungi integritas arsip rapor siswa. Hubungi Administrator jika memerlukan pembukaan kunci audit resmi.
                </p>
              </div>
            </div>
          )}

          {/* Active Session Detail & Topic Input */}
          <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D2D2D2]">
              <div>
                <span className="text-[11px] font-bold text-[#CB2957] uppercase tracking-wider block">
                  Detail Sesi Terpilih
                </span>
                <h2 className="font-display font-bold text-lg sm:text-xl text-[#000000] mt-0.5">
                  {selectedSession.subjectName} ({selectedSession.className})
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#555555] mt-1">
                  <span>{selectedSession.roomName}</span>
                  <span className="text-[#D2D2D2]">·</span>
                  <span>
                    {selectedSession.dayOfWeek}, {selectedSession.sessionDate}
                  </span>
                  <span className="text-[#D2D2D2]">·</span>
                  <span className="tabular-nums">
                    {selectedSession.startTime}–{selectedSession.endTime} WITA
                  </span>
                </div>
              </div>

              {selectedSession.isCompleted ? (
                isLocked ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#555555]">
                    <Lock className="w-3.5 h-3.5 text-[#555555]" />
                    <span>Arsip Terkunci</span>
                  </span>
                ) : (
                  <StatusBadge status="hadir" label="Tersimpan (Grace Period)" />
                )
              ) : (
                <StatusBadge status="terjadwal" label="Menunggu Checklist" />
              )}
            </div>

            {/* Topic Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="session-topic"
                className="font-semibold text-xs text-[#000000] block"
              >
                Topik Bahasan Pertemuan <span className="text-[#CB2957]">*</span>
              </label>
              <input
                id="session-topic"
                type="text"
                disabled={isLocked}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Mekanika Dinamika & Hukum Newton Lanjutan"
                className="w-full h-10 px-3.5 text-xs bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000] disabled:bg-[#F6F6F6] disabled:text-[#555555] disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-[#555555]">
                Topik ini akan ditampilkan pada laporan kehadiran orang tua dan buku kendali siswa.
              </p>
            </div>
          </div>

          {/* Real-time Status Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  Menyimpan presensi dengan siswa berstatus Alpa akan otomatis mengirimkan notifikasi ketidakhadiran ke akun orang tua/wali siswa terkait.
                </p>
              </div>
            </div>
          )}

          {/* Checklist Table & Student Rows */}
          <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#D2D2D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-base text-[#000000]">
                  Checklist Presensi Siswa
                </h3>
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
                  : 'Pastikan data kehadiran telah dicek sebelum menekan simpan.'}
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
                      <span>Menyimpan Presensi...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#FFFFFF]" />
                      <span>Presensi Tersimpan!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Presensi Sesi</span>
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

          {/* Feedback & Error Notifications */}
          {errorMessage && (
            <div className="p-4 bg-[#FFFFFF] border border-[#901B14] rounded-[10px] space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#901B14]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Gagal menyimpan presensi</span>
              </div>
              <p className="text-xs text-[#555555] pl-6">{errorMessage}</p>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 bg-[#FFFFFF] border border-[#166534] rounded-[10px] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#166534]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Presensi sesi bimbingan berhasil disimpan ke sistem!</span>
              </div>
              <p className="text-xs text-[#555555] pl-6 leading-relaxed">
                Persentase kehadiran siswa otomatis diperbarui dan langsung dapat dilihat oleh siswa maupun orang tua di portal masing-masing.
              </p>
              {hasAlpaNotice && (
                <div className="mt-2 pt-2 border-t border-[#D2D2D2] flex items-start gap-2 text-xs text-[#901B14] pl-6">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Peringatan ketidakhadiran (Alpa) otomatis diteruskan ke notifikasi orang tua siswa terkait.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
