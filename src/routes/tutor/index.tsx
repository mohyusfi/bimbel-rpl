import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Calendar,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { useTutorDashboardData } from '~/hooks/use-admin-data'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { StatusBadge } from '~/components/ui/status-badge'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/tutor/')({
  ssr: false,
  component: TutorDashboardIndex,
})

function TutorDashboardIndex() {
  const {
    tutor,
    schedules,
    sessions,
    materials,
    grades,
    classes,
    students,
  } = useTutorDashboardData()

  const completedSessions = sessions.filter((s) => s.isCompleted)
  const pendingSessions = sessions.filter((s) => !s.isCompleted)

  // Get active or next upcoming session
  const activeSession = pendingSessions[0] || sessions[0]

  // Enrolled student count for active session
  const activeClassStudents = students.filter(
    (s) => s.classId === activeSession?.classId
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#555555]">
          PORTAL PENGAJAR
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#000000] tracking-tight mt-1">
          Ringkasan Mengajar
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-1.5 leading-relaxed">
          Selamat datang kembali,{' '}
          <span className="font-semibold text-[#000000]">
            {tutor?.name || 'Kak Dian Pratiwi, S.Si'}
          </span>
          . Kelola jadwal kelas, catat presensi digital, unggah materi modul, dan input evaluasi belajar.
        </p>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryMetricCard
          title="Sesi Minggu Ini"
          value={schedules.length}
          unit="sesi"
          description="Jadwal mengajar tatap muka mingguan"
          icon={Calendar}
          to="/tutor/jadwal"
          footer={
            <span className="text-[11px] text-[#555555]">
              Tersebar di {new Set(schedules.map((s) => s.classId)).size} rombel bimbingan
            </span>
          }
        />

        <SummaryMetricCard
          title="Presensi Selesai"
          value={`${completedSessions.length}/${sessions.length}`}
          unit="sesi"
          description="Checklist kehadiran tervalidasi"
          icon={ClipboardCheck}
          to="/tutor/presensi"
          footer={
            <span className="text-[11px] text-[#555555]">
              {pendingSessions.length > 0
                ? `${pendingSessions.length} sesi belum dicatat`
                : 'Semua sesi terjadwal telah tervalidasi'}
            </span>
          }
        />

        <SummaryMetricCard
          title="Modul Diunggah"
          value={materials.length}
          unit="berkas"
          description="Modul teori, tugas & bank soal"
          icon={FileText}
          to="/tutor/materi"
          footer={
            <span className="text-[11px] text-[#555555]">
              Dapat diunduh langsung oleh siswa
            </span>
          }
        />

        <SummaryMetricCard
          title="Evaluasi Tercatat"
          value={grades.length}
          unit="nilai"
          description="Rekap skor kuis & try out"
          icon={GraduationCap}
          to="/tutor/nilai"
          footer={
            <span className="text-[11px] text-[#555555]">
              Tersambung ke rapor siswa & orang tua
            </span>
          }
        />
      </div>

      {/* Active / Highlighted Session Card */}
      {activeSession ? (
        <div className="bg-[#FFFFFF] border-l-4 border-l-[#CB2957] border-y border-r border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 shadow-none">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#CB2957] bg-[#CB2957]/10 px-2 py-0.5 rounded-[4px]">
                  Sorotan Sesi Bimbingan
                </span>
                <StatusBadge
                  status={activeSession.isCompleted ? 'hadir' : 'terjadwal'}
                  label={activeSession.isCompleted ? 'Presensi Selesai' : 'Perlu Presensi'}
                />
              </div>

              <div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#000000]">
                  {activeSession.subjectName} — {activeSession.className}
                </h2>
                <p className="text-xs sm:text-sm text-[#555555] mt-1">
                  Topik: {activeSession.topic || 'Belum diisi topik pertemuan'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#555555] pt-1">
                <div className="flex items-center gap-1.5 font-medium text-[#292524]">
                  <Clock className="w-4 h-4 text-[#555555] shrink-0" />
                  <span>
                    {activeSession.dayOfWeek}, {activeSession.startTime}–{activeSession.endTime} WITA
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-[#292524]">
                  <MapPin className="w-4 h-4 text-[#555555] shrink-0" />
                  <span>{activeSession.roomName}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-[#292524]">
                  <Users className="w-4 h-4 text-[#555555] shrink-0" />
                  <span className="tabular-nums">
                    {activeSession.entries.length || activeClassStudents.length} Siswa Terdaftar
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-2 lg:pt-0 shrink-0">
              <Link
                to="/tutor/presensi"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] font-semibold text-xs px-4 py-2.5 rounded-[8px] transition-colors"
              >
                <ClipboardCheck className="w-4 h-4 shrink-0" />
                <span>Checklist Presensi</span>
              </Link>
              <Link
                to="/tutor/nilai"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FFFFFF] border border-[#D2D2D2] text-[#292524] hover:bg-[#F6F6F6] font-semibold text-xs px-4 py-2.5 rounded-[8px] transition-colors"
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Input Nilai</span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Two Column Layout: Weekly Schedule & Quick Material / Grade Overview (xl+, Stacked on 1024px) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Weekly Teaching Schedule Box */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D2D2D2]">
              <div>
                <h3 className="font-display font-bold text-base text-[#000000]">
                  Jadwal Mengajar Pekan Ini
                </h3>
                <p className="text-xs text-[#555555] mt-0.5">
                  Slot waktu bimbingan tatap muka yang diampu
                </p>
              </div>
              <Link
                to="/tutor/jadwal"
                className="text-xs font-semibold text-[#CB2957] hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#D2D2D2]">
              {schedules.slice(0, 4).map((sch) => (
                <div
                  key={sch.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-[#000000] truncate">
                      {sch.subjectName}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#555555]">
                      <span>{sch.className}</span>
                      <span className="text-[#D2D2D2]">·</span>
                      <span>{sch.roomName}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-semibold text-[#000000] block">
                      {sch.dayOfWeek}
                    </span>
                    <span className="text-[11px] text-[#555555] tabular-nums">
                      {sch.startTime}–{sch.endTime} WITA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#D2D2D2] mt-2">
            <Link
              to="/tutor/jadwal"
              className="text-xs font-semibold text-[#292524] hover:text-[#000000] flex items-center justify-between"
            >
              <span>Buka tabel jadwal lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Uploaded Materials & Evaluation Summary */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D2D2D2]">
              <div>
                <h3 className="font-display font-bold text-base text-[#000000]">
                  Modul & Tugas Terbaru
                </h3>
                <p className="text-xs text-[#555555] mt-0.5">
                  Materi ajar yang baru diunggah untuk siswa
                </p>
              </div>
              <Link
                to="/tutor/materi"
                className="text-xs font-semibold text-[#CB2957] hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
              >
                <span>Kelola Modul</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#D2D2D2]">
              {materials.slice(0, 3).map((mat) => (
                <div
                  key={mat.id}
                  className="py-3 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-[#000000] truncate">
                      {mat.title}
                    </p>
                    <p className="text-[#555555] line-clamp-1">
                      {mat.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#555555] pt-0.5">
                      <span className="font-medium text-[#292524]">{mat.className}</span>
                      <span className="text-[#D2D2D2]">·</span>
                      <span>{mat.category}</span>
                      <span className="text-[#D2D2D2]">·</span>
                      <span className="tabular-nums">{mat.fileSize}</span>
                    </div>
                  </div>

                  <span className="text-[11px] text-[#555555] shrink-0 font-medium">
                    {mat.uploadedAt}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#D2D2D2] mt-2 flex items-center justify-between">
            <Link
              to="/tutor/materi"
              className="text-xs font-semibold text-[#292524] hover:text-[#000000] flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Unggah Modul Baru</span>
            </Link>
            <Link
              to="/tutor/nilai"
              className="text-xs font-semibold text-[#292524] hover:text-[#000000] flex items-center gap-1"
            >
              <span>Rekap Nilai Siswa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
