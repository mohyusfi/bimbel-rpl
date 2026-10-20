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
} from 'lucide-react'
import { useTutorDashboardData, useAdminMutations } from '~/hooks/use-admin-data'
import { StatusBadge } from '~/components/ui/status-badge'
import { cn } from '~/lib/utils'
import type { AttendanceEntry, AttendanceStatus, AttendanceSession } from '~/lib/admin-store'

export const Route = createFileRoute('/tutor/presensi')({
  ssr: false,
  component: TutorPresensiPage,
})

export function TutorPresensiPage() {
  const { sessions, students } = useTutorDashboardData()
  const { saveSessionAttendance } = useAdminMutations()

  // Selected session state (defaults to first pending or first session)
  const defaultSessionId = sessions.find((s) => !s.isCompleted)?.id || sessions[0]?.id || ''
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>(defaultSessionId)

  // Sync if sessions load later or defaultSessionId changes
  React.useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      const pending = sessions.find((s) => !s.isCompleted)
      setSelectedSessionId(pending ? pending.id : sessions[0].id)
    }
  }, [sessions, selectedSessionId])

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0]

  // Attendance form state
  const [topic, setTopic] = React.useState<string>('')
  const [entries, setEntries] = React.useState<AttendanceEntry[]>([])
  const [saveSuccess, setSaveSuccess] = React.useState<boolean>(false)
  const [hasAlpaNotice, setHasAlpaNotice] = React.useState<boolean>(false)
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  // Initialize or re-populate entries when selectedSession changes
  React.useEffect(() => {
    if (selectedSession) {
      setTopic(selectedSession.topic || '')
      setSaveSuccess(false)
      setHasAlpaNotice(false)

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
  }, [selectedSession?.id, selectedSession?.topic])

  // Count statuses
  const countHadir = entries.filter((e) => e.status === 'hadir').length
  const countSakit = entries.filter((e) => e.status === 'sakit').length
  const countIzin = entries.filter((e) => e.status === 'izin').length
  const countAlpa = entries.filter((e) => e.status === 'alpa').length

  // Quick mark all as Hadir
  const handleMarkAllHadir = () => {
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        status: 'hadir',
      }))
    )
  }

  // Update status for single student
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId ? { ...entry, status } : entry
      )
    )
  }

  // Update note for single student
  const handleNoteChange = (studentId: string, note: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId ? { ...entry, note } : entry
      )
    )
  }

  // Save attendance
  const handleSave = async () => {
    if (!selectedSession) return
    setIsSaving(true)
    try {
      await saveSessionAttendance({
        sessionId: selectedSession.id,
        topic: topic.trim() || selectedSession.subjectName,
        entries,
      })

      const anyAlpa = entries.some((e) => e.status === 'alpa')
      setHasAlpaNotice(anyAlpa)
      setSaveSuccess(true)

      // Hide success notification after 5 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 5000)
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
          Catat kehadiran digital siswa per sesi pertemuan, input pokok bahasan materi, dan berikan catatan evaluasi kehadiran.
        </p>
      </div>

      {/* Session Selector Strip */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-4 sm:p-5">
        <label className="text-xs font-semibold text-[#000000] block mb-2">
          Pilih Sesi Bimbingan
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {sessions.map((sess) => {
            const isSelected = sess.id === selectedSession?.id
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
                  <StatusBadge
                    status={sess.isCompleted ? 'hadir' : 'terjadwal'}
                    label={sess.isCompleted ? 'Selesai' : 'Belum Absen'}
                  />
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
      </div>

      {selectedSession ? (
        <div className="space-y-6">
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

              <StatusBadge
                status={selectedSession.isCompleted ? 'hadir' : 'terjadwal'}
                label={
                  selectedSession.isCompleted
                    ? 'Presensi Tersimpan'
                    : 'Menunggu Checklist'
                }
              />
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
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Mekanika Dinamika & Hukum Newton Lanjutan"
                className="w-full h-10 px-3.5 text-xs bg-[#FFFFFF] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
              />
              <p className="text-[11px] text-[#555555]">
                Topik ini akan ditampilkan pada laporan kehadiran orang tua dan buku kendali siswa.
              </p>
            </div>
          </div>

          {/* Real-time Status Counters & Quick Action */}
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

              <button
                type="button"
                onClick={handleMarkAllHadir}
                className="inline-flex items-center justify-center gap-1.5 bg-[#FFFFFF] border border-[#D2D2D2] hover:bg-[#F6F6F6] text-[#000000] text-xs font-semibold px-3.5 py-2 rounded-[8px] transition-colors cursor-pointer shrink-0"
              >
                <Check className="w-3.5 h-3.5 text-[#166534]" />
                <span>Tandai Semua Hadir</span>
              </button>
            </div>

            {/* List of Students */}
            <div className="divide-y divide-[#D2D2D2]">
              {entries.map((entry, index) => (
                <div
                  key={entry.studentId}
                  className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FAFAFA] transition-colors"
                >
                  {/* Student Info */}
                  <div className="flex items-start gap-3 min-w-[220px]">
                    <span className="text-xs font-mono font-semibold text-[#555555] pt-0.5 w-5 tabular-nums">
                      {index + 1}.
                    </span>
                    <div>
                      <span className="font-semibold text-xs text-[#000000] block">
                        {entry.studentName}
                      </span>
                      <span className="font-mono text-[11px] text-[#555555]">
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
                          onClick={() => handleStatusChange(entry.studentId, st)}
                          className={cn(
                            'px-3 py-1.5 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer',
                            isActive && st === 'hadir' && 'bg-[#166534] text-[#FFFFFF]',
                            isActive && st === 'sakit' && 'bg-[#85600F] text-[#FFFFFF]',
                            isActive && st === 'izin' && 'bg-[#3A5A80] text-[#FFFFFF]',
                            isActive && st === 'alpa' && 'bg-[#901B14] text-[#FFFFFF]',
                            !isActive && 'text-[#555555] hover:text-[#000000] hover:bg-[#FFFFFF]'
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
                      placeholder="Catatan khusus (opsional)..."
                      value={entry.note || ''}
                      onChange={(e) =>
                        handleNoteChange(entry.studentId, e.target.value)
                      }
                      className="w-full h-8 px-2.5 text-xs bg-[#FFFFFF] border border-[#D2D2D2] rounded-[6px] focus:outline-none focus:border-[#000000]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 sm:p-5 bg-[#F6F6F6] border-t border-[#D2D2D2] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#555555] text-center sm:text-left">
                Pastikan data kehadiran telah dicek sebelum menekan simpan.
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#000000] hover:bg-[#222222] disabled:opacity-50 text-[#FFFFFF] font-semibold text-xs px-5 py-2.5 rounded-[8px] transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Presensi Sesi'}</span>
              </button>
            </div>
          </div>

          {/* Feedback & Notifications */}
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
