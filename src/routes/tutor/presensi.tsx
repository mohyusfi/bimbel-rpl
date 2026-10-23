import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  Check,
  Save,
  Info,
  Loader2,
  Lock,
  History,
  Eye,
  Search,
} from 'lucide-react'
import {
  useTutorDashboardData,
  useAdminMutations,
  useSessionDetails,
} from '~/hooks/use-admin-data'
import { StatusBadge } from '~/components/ui/status-badge'
import { toast } from '~/components/ui/toast'
import { cn } from '~/lib/utils'
import type { AttendanceEntry, AttendanceStatus } from '~/lib/admin-store'
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
  const [searchQuery, setSearchQuery] = React.useState<string>('')

  // Pisahkan sesi menjadi sesi yang belum tervalidasi vs sesi yang sudah selesai
  const pendingSessions = React.useMemo(
    () => sessions.filter((s) => !s.isCompleted),
    [sessions]
  )
  const completedSessions = React.useMemo(
    () => sessions.filter((s) => s.isCompleted),
    [sessions]
  )

  // Filter riwayat sesi selesai berdasarkan kata kunci pencarian
  const filteredCompletedSessions = React.useMemo(() => {
    if (!searchQuery.trim()) return completedSessions
    const q = searchQuery.toLowerCase()
    return completedSessions.filter(
      (s) =>
        s.subjectName.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        (s.topic && s.topic.toLowerCase().includes(q)) ||
        s.roomName.toLowerCase().includes(q)
    )
  }, [completedSessions, searchQuery])

  // Selected session state untuk tab 'pending'
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>('')

  // Sync selected session untuk pending sessions
  React.useEffect(() => {
    if (activeTab === 'pending') {
      const current = pendingSessions.find((s) => s.id === selectedSessionId)
      if (!current && pendingSessions.length > 0) {
        setSelectedSessionId(pendingSessions[0].id)
      }
    }
  }, [activeTab, pendingSessions, selectedSessionId])

  // Use session detail hook for active pending session
  const { data: sessionDetail } = useSessionDetails(selectedSessionId)
  const selectedSession =
    sessionDetail || pendingSessions.find((s) => s.id === selectedSessionId) || pendingSessions[0]

  // Attendance form state (tab pending)
  const [topic, setTopic] = React.useState<string>('')
  const [entries, setEntries] = React.useState<AttendanceEntry[]>([])
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  // Cek apakah sesi terpilih terkunci (Audit Lock 24h)
  const isLocked = React.useMemo(() => {
    if (!selectedSession) return false
    return isSessionLockedForTutor(selectedSession)
  }, [selectedSession])

  // Initialize or re-populate entries when selectedSession changes
  React.useEffect(() => {
    if (selectedSession && activeTab === 'pending') {
      setTopic(selectedSession.topic || '')

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
  }, [selectedSession?.id, selectedSession?.topic, selectedSession?.entries, students, activeTab])

  // Count statuses (tab pending)
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
    const currentId = selectedSession.id
    try {
      await saveSessionAttendance({
        sessionId: currentId,
        topic: topic.trim() || selectedSession.subjectName,
        entries,
      })

      const anyAlpa = entries.some((e) => e.status === 'alpa')

      // Pindahkan ke tab Riwayat Presensi dengan toast sukses
      setActiveTab('history')

      toast.success('Presensi sesi bimbingan berhasil disimpan ke arsip sistem!', {
        description: anyAlpa
          ? 'Data kehadiran otomatis masuk ke arsip. Peringatan alpa otomatis diteruskan ke notifikasi orang tua.'
          : 'Data kehadiran siswa otomatis masuk ke daftar riwayat arsip dan dapat ditinjau kapan saja.',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan presensi'
      toast.error('Gagal memproses presensi', {
        description: msg,
      })
    } finally {
      setIsSaving(false)
    }
  }

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
          Catat kehadiran digital siswa per sesi pertemuan, input pokok bahasan materi, dan tinjau riwayat arsip presensi.
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

      {/* TAMPILAN TAB 1: PERLU PRESENSI */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {/* Section A (Pending Cards) */}
          <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-[#000000] block">
                Daftar Sesi Menunggu Presensi
              </label>
              <span className="text-[11px] text-[#555555]">
                Menampilkan {pendingSessions.length} sesi
              </span>
            </div>

            {pendingSessions.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#D2D2D2] rounded-[10px] space-y-1">
                <Calendar className="w-6 h-6 mx-auto text-[#888888]" />
                <p className="text-xs font-medium text-[#292524]">
                  Semua sesi bimbingan telah tervalidasi.
                </p>
                <p className="text-[11px] text-[#555555]">
                  Pilih tab Riwayat Presensi untuk meninjau arsip tabel sesi yang telah dicatat.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {pendingSessions.map((sess) => {
                  const isSelected = sess.id === selectedSession?.id
                  const overdue = isSessionOverdue(sess)

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

                        {overdue ? (
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

          {/* Section B (Form Checklist Presensi untuk Tab Pending) */}
          {selectedSession && pendingSessions.length > 0 && (
            <div className="space-y-6">
              {/* Detail Sesi & Input Topik */}
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

                  <StatusBadge status="terjadwal" label="Menunggu Checklist" />
                </div>

                {/* Input Topik */}
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

              {/* Status Counters */}
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

              {/* Warning Alpa */}
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

              {/* Checklist Table */}
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
                    Pastikan data kehadiran telah dicek sebelum menekan simpan presensi.
                  </div>

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
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan Presensi Sesi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAMPILAN TAB 2: RIWAYAT PRESENSI (Section A Table) */}
      {activeTab === 'history' && (
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#000000]">
                Daftar Sesi Selesai (Arsip)
              </h2>
              <p className="text-xs text-[#555555] mt-0.5">
                Menampilkan {filteredCompletedSessions.length} dari {completedSessions.length} sesi selesai
              </p>
            </div>

            {/* Filter Pencarian */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari mata pelajaran / rombel / topik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
              />
            </div>
          </div>

          {filteredCompletedSessions.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#D2D2D2] rounded-[10px] space-y-1">
              <Calendar className="w-6 h-6 mx-auto text-[#888888]" />
              <p className="text-xs font-medium text-[#292524]">
                {completedSessions.length === 0
                  ? 'Belum ada riwayat sesi bimbingan yang selesai.'
                  : 'Tidak ada riwayat sesi yang sesuai dengan filter pencarian.'}
              </p>
              <p className="text-[11px] text-[#555555]">
                {completedSessions.length === 0
                  ? 'Sesi yang telah disimpan presensinya akan otomatis diarsipkan di tabel ini.'
                  : 'Silakan bersihkan filter kata kunci untuk menampilkan semua sesi arsip.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-5">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-y border-[#D2D2D2] bg-[#F6F6F6] text-[11px] font-semibold text-[#555555] uppercase tracking-wider">
                    <th className="py-2.5 px-4 sm:px-5">Tanggal & Waktu</th>
                    <th className="py-2.5 px-4">Mata Pelajaran & Rombel</th>
                    <th className="py-2.5 px-4">Topik Bahasan</th>
                    <th className="py-2.5 px-4">Rekap Kehadiran</th>
                    <th className="py-2.5 px-4">Status Audit</th>
                    <th className="py-2.5 px-4 sm:px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2D2D2]">
                  {filteredCompletedSessions.map((sess) => {
                    const locked = isSessionLockedForTutor(sess)
                    const entries = sess.entries || []
                    const h = entries.filter((e) => e.status === 'hadir').length
                    const s = entries.filter((e) => e.status === 'sakit').length
                    const i = entries.filter((e) => e.status === 'izin').length
                    const a = entries.filter((e) => e.status === 'alpa').length
                    const total = entries.length

                    return (
                      <tr key={sess.id} className="hover:bg-[#FAFAFA] transition-colors">
                        {/* Tanggal & Waktu */}
                        <td className="py-3 px-4 sm:px-5 align-top">
                          <span className="font-medium text-xs text-[#000000] block">
                            {sess.dayOfWeek}, {sess.sessionDate}
                          </span>
                          <span className="text-[11px] font-mono text-[#555555] block tabular-nums mt-0.5">
                            {sess.startTime}–{sess.endTime} WITA
                          </span>
                        </td>

                        {/* Mata Pelajaran & Rombel */}
                        <td className="py-3 px-4 align-top">
                          <span className="font-semibold text-xs text-[#000000] block">
                            {sess.subjectName}
                          </span>
                          <span className="text-[11px] text-[#555555] block mt-0.5">
                            {sess.className} · {sess.roomName}
                          </span>
                        </td>

                        {/* Topik Bahasan */}
                        <td className="py-3 px-4 align-top max-w-[220px]">
                          <span className="text-xs text-[#292524] line-clamp-2" title={sess.topic}>
                            {sess.topic || '—'}
                          </span>
                        </td>

                        {/* Rekap Kehadiran */}
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[#166534] font-medium" title="Hadir">{h} H</span>
                            <span className="text-[#888888]">·</span>
                            <span className="text-[#85600F] font-medium" title="Sakit">{s} S</span>
                            <span className="text-[#888888]">·</span>
                            <span className="text-[#3A5A80] font-medium" title="Izin">{i} I</span>
                            <span className="text-[#888888]">·</span>
                            <span className="text-[#901B14] font-medium" title="Alpa">{a} A</span>
                            <span className="text-[#555555] text-[11px] font-mono">({total})</span>
                          </div>
                        </td>

                        {/* Status Audit */}
                        <td className="py-3 px-4 align-top">
                          {locked ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#555555]">
                              <Lock className="w-3.5 h-3.5 text-[#555555]" />
                              <span>Terkunci</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#166534]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
                              <span>Tersimpan</span>
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 sm:px-5 align-top text-right">
                          <Link
                            to="/tutor/presensi/$sessionId"
                            params={{ sessionId: sess.id }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold text-[#000000] border border-[#D2D2D2] hover:bg-[#F6F6F6] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#555555]" />
                            <span>Lihat Detail</span>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
