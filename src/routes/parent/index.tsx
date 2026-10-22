import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CalendarCheck,
  TrendingUp,
  BookOpen,
  CreditCard,
  Clock,
  MapPin,
  UserCheck,
  ArrowRight,
  Sparkles,
  Calendar,
  MessageSquareQuote,
  CheckCircle2,
} from 'lucide-react'
import { useParentDashboardData } from '~/hooks/use-admin-data'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { StatusBadge } from '~/components/ui/status-badge'
import { formatRupiah } from '~/lib/utils'

export const Route = createFileRoute('/parent/')({
  component: ParentDashboardOverview,
})

function ParentDashboardOverview() {
  const { selectedChild, childData } = useParentDashboardData()
  const {
    student,
    classSchedules,
    sessions,
    attendanceRate,
    totalSessions,
    attendedSessions,
    grades,
    avgGrade,
    invoices,
  } = childData

  // 1. Attendance Today (Check most relevant completed or ongoing session)
  const latestSession = sessions[0] || null
  const childSessionEntry = latestSession?.entries?.find(
    (e) => e.studentId === student?.id
  )
  const attendanceStatus = latestSession
    ? latestSession.isCompleted
      ? childSessionEntry?.status || 'hadir'
      : 'terjadwal'
    : 'terjadwal'

  // 2. Latest Grade & Tutor Feedback
  const latestGrade = grades[0] || null

  // 3. Current active invoice
  const currentInvoice =
    invoices.find((i) => i.status === 'belum_dibayar' || i.status === 'menunggu') ||
    invoices[0] ||
    null

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#CB2957]">
              Pemantauan Akademik Putra-Putri
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Ringkasan Perkembangan: {student?.name || 'Siswa'}
          </h1>
          <p className="text-xs sm:text-sm text-[#555555]">
            Terdaftar di kelas <strong className="text-[#000000]">{student?.className || '-'}</strong> · Sekolah asal: {student?.school || '-'} · NIS: <span className="font-mono text-xs">{student?.nis || '-'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Link
            to="/parent/rapor"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#262626] rounded-[8px] transition-colors cursor-pointer"
          >
            <span>Buka Rapor Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Real-time Attendance Banner for Today (ATTEND-02) */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#D2D2D2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#000000] text-[#FFFFFF] flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#555555]">
                  Status Presensi Hari Ini
                </span>
                <span className="text-[11px] text-[#555555] font-medium">
                  · Sesi Kelas Terjadwal
                </span>
              </div>
              <h2 className="font-display font-bold text-base text-[#000000]">
                {latestSession?.subjectName || 'Sesi Pembelajaran Aktif'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#555555]">Status Putra-Putri:</span>
            <StatusBadge status={attendanceStatus} />
          </div>
        </div>

        {latestSession ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[#555555] block">Mata Pelajaran & Topik:</span>
              <p className="font-semibold text-[#000000] text-sm">
                {latestSession.subjectName}
              </p>
              <p className="text-[11px] text-[#555555] leading-relaxed">
                {latestSession.topic}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[#555555] block">Jadwal & Waktu:</span>
              <div className="flex items-center gap-1.5 font-medium text-[#000000]">
                <Clock className="w-3.5 h-3.5 text-[#555555]" />
                <span className="tabular-nums">
                  {latestSession.sessionDate}, {latestSession.startTime}–{latestSession.endTime} WITA
                </span>
              </div>
              <span className="text-[11px] text-[#555555] block">Zona WITA (UTC+8)</span>
            </div>

            <div className="space-y-1">
              <span className="text-[#555555] block">Ruangan Belajar:</span>
              <div className="flex items-center gap-1.5 font-medium text-[#000000]">
                <MapPin className="w-3.5 h-3.5 text-[#555555]" />
                <span>{latestSession.roomName}</span>
              </div>
              <span className="text-[11px] text-[#555555] block">Lantai 1 Gedung Bimbel</span>
            </div>

            <div className="space-y-1">
              <span className="text-[#555555] block">Tutor Pengajar:</span>
              <div className="flex items-center gap-1.5 font-medium text-[#000000]">
                <UserCheck className="w-3.5 h-3.5 text-[#555555]" />
                <span>{latestSession.tutorName}</span>
              </div>
              {childSessionEntry?.note ? (
                <span className="text-[11px] text-[#166534] font-medium block">
                  Catatan: &ldquo;{childSessionEntry.note}&rdquo;
                </span>
              ) : (
                <span className="text-[11px] text-[#555555] block">Checklist presensi tervalidasi</span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#555555]">
            Tidak ada jadwal bimbingan aktif hari ini.
          </div>
        )}
      </div>

      {/* 4 SummaryMetricCard: Kehadiran (%), Rata-rata Nilai, Evaluasi Terkini, Status SPP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryMetricCard
          title="Tingkat Kehadiran"
          value={attendanceRate}
          unit="%"
          description={`${attendedSessions} dari ${childData.totalCompleted || totalSessions} pertemuan terlaksana`}
          footer={
            <div className="flex items-center justify-between font-medium text-[#292524]">
              <span>Target Lembaga</span>
              <span className="text-[11px] text-[#555555] font-semibold tabular-nums">Min. 85%</span>
            </div>
          }
          icon={CalendarCheck}
          to="/parent/kehadiran"
        />

        <SummaryMetricCard
          title="Rata-rata Nilai"
          value={avgGrade}
          unit="/ 100"
          description={`Akumulasi dari ${grades.length} evaluasi kuis, tugas & simulasi try out`}
          footer={
            <div className="flex items-center justify-between font-medium text-[#292524]">
              <span>Peringkat Kelas</span>
              <span className="text-[11px] text-[#555555] font-semibold">Kelompok Unggulan</span>
            </div>
          }
          icon={TrendingUp}
          to="/parent/rapor"
        />

        <SummaryMetricCard
          title="Evaluasi Terkini"
          value={latestGrade ? latestGrade.score : '-'}
          unit={latestGrade ? '/ 100' : ''}
          description={
            latestGrade
              ? `${latestGrade.subjectName} · ${latestGrade.assessmentTitle}`
              : 'Belum ada catatan nilai'
          }
          footer={
            <div className="flex items-center justify-between font-medium text-[#292524]">
              <span>Tutor Penilai</span>
              <span className="text-[11px] text-[#555555] font-semibold truncate ml-2">
                {latestGrade ? latestGrade.tutorName : '-'}
              </span>
            </div>
          }
          icon={BookOpen}
          to="/parent/rapor"
        />

        <SummaryMetricCard
          title="Status SPP Bulan Ini"
          value={
            currentInvoice?.status === 'lunas'
              ? 'Lunas'
              : currentInvoice?.status === 'menunggu'
                ? 'Verifikasi'
                : 'Belum Bayar'
          }
          variant={currentInvoice?.status === 'belum_dibayar' ? 'urgent' : 'default'}
          description={
            currentInvoice
              ? `${currentInvoice.id} (${formatRupiah(currentInvoice.amount)})`
              : 'Semua kewajiban lunas'
          }
          footer={
            <div className="flex items-center justify-between font-medium text-[#292524]">
              <span>Jatuh Tempo</span>
              <span className="text-[11px] text-[#555555] font-semibold">
                {currentInvoice?.dueDate || 'Tepat Waktu'}
              </span>
            </div>
          }
          icon={CreditCard}
          to="/parent/tagihan"
        />
      </div>

      {/* Two Column Section: Recent Tutor Qualitative Feedback & Class Weekly Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Tutor Qualitative Feedback */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#D2D2D2]">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-[#CB2957] shrink-0" />
                <h3 className="font-display font-bold text-base text-[#000000]">
                  Catatan Evaluasi Tutor Terkini
                </h3>
              </div>
              <Link
                to="/parent/rapor"
                className="text-xs font-semibold text-[#CB2957] hover:underline shrink-0 self-start sm:self-auto"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-3.5">
              {grades.slice(0, 2).map((grd) => (
                <div
                  key={grd.id}
                  className="p-4 rounded-[10px] bg-[#F6F6F6] border border-[#D2D2D2] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#000000]">
                        {grd.subjectName}
                      </p>
                      <p className="text-[11px] text-[#555555]">
                        {grd.assessmentTitle} · {grd.category}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-display font-extrabold text-base text-[#000000] tabular-nums">
                        {grd.score}
                      </span>
                      <span className="text-[11px] text-[#555555]"> / 100</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#292524] italic bg-[#FFFFFF] p-3 rounded-[8px] border border-[#D2D2D2]/60 leading-relaxed">
                    &ldquo;{grd.tutorFeedback}&rdquo;
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#555555] pt-1">
                    <span>Tutor: {grd.tutorName}</span>
                    <span className="tabular-nums">{grd.assessmentDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#D2D2D2]">
            <Link
              to="/parent/rapor"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#000000] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[8px] transition-colors"
            >
              <span>Pantau Grafik & Analisis Rapor Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Class Weekly Schedule Preview */}
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#D2D2D2]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#000000] shrink-0" />
                <h3 className="font-display font-bold text-base text-[#000000]">
                  Jadwal Bimbingan Kelas Minggu Ini
                </h3>
              </div>
              <span className="text-xs text-[#555555] font-medium shrink-0 self-start sm:self-auto">
                {student?.className}
              </span>
            </div>

            <div className="space-y-2.5">
              {classSchedules.length > 0 ? (
                classSchedules.slice(0, 3).map((sched) => (
                  <div
                    key={sched.id}
                    className="p-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#D2D2D2] flex items-center justify-between gap-3 hover:border-[#000000] transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#000000] truncate">
                          {sched.subjectName}
                        </span>
                        <span className="text-[11px] text-[#555555]">
                          · {sched.dayOfWeek}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#555555]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#555555]" />
                          <span className="tabular-nums">
                            {sched.startTime}–{sched.endTime} WITA
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#555555]" />
                          <span>{sched.roomName}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-medium text-[#292524] block">
                        {sched.tutorName}
                      </span>
                      <span className="text-[10px] text-[#555555]">Tutor Pengampu</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#555555]">
                  Belum ada jadwal sesi mingguan yang diinput.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#D2D2D2]">
            <Link
              to="/parent/kehadiran"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#000000] hover:bg-[#F6F6F6] border border-[#D2D2D2] rounded-[8px] transition-colors"
            >
              <span>Lihat Riwayat Presensi Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
