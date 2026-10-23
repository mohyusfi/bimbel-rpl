import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Award,
  Sparkles,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useStudentDashboardData } from '~/hooks/use-admin-data'
import type { GradeRecord } from '~/lib/admin-store'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { DataTable } from '~/components/ui/data-table'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/student/nilai')({
  ssr: false,
  component: StudentNilaiPage,
})

function StudentNilaiPage() {
  const { student, grades } = useStudentDashboardData()

  // Academic summary metrics (Plain calculation, no useMemo for React Compiler)
  const totalAssessments = grades.length
  const avgScore =
    totalAssessments > 0
      ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / totalAssessments)
      : 0
  const highestScore =
    totalAssessments > 0 ? Math.max(...grades.map((g) => g.score)) : 0
  const positiveEvaluations = grades.filter((g) => g.score >= 80).length
  const bestRecord =
    totalAssessments > 0
      ? grades.reduce((max, g) => (g.score > max.score ? g : max), grades[0])
      : null

  // Score Progress Chart data (chronological order)
  const chartGrades = [...grades].reverse()
  const chartWidth = 600
  const chartHeight = 200
  const paddingX = 40
  const paddingY = 25
  const innerWidth = chartWidth - paddingX * 2
  const innerHeight = chartHeight - paddingY * 2

  const getY = (val: number) => paddingY + innerHeight - (val / 100) * innerHeight
  const getX = (index: number) => {
    if (chartGrades.length <= 1) return paddingX + innerWidth / 2
    return paddingX + (index / (chartGrades.length - 1)) * innerWidth
  }

  const studentPoints = chartGrades.map((g, idx) => ({
    x: getX(idx),
    y: getY(g.score),
    score: g.score,
    title: g.assessmentTitle,
    date: g.assessmentDate,
  }))

  const classPoints = chartGrades.map((g, idx) => ({
    x: getX(idx),
    y: getY(g.classAverage || 0),
    avg: g.classAverage || 0,
  }))

  const studentPath =
    studentPoints.length > 0 ? `M ${studentPoints.map((p) => `${p.x},${p.y}`).join(' L ')}` : ''
  const classPath =
    classPoints.length > 0 ? `M ${classPoints.map((p) => `${p.x},${p.y}`).join(' L ')}` : ''

  // DataTable columns for grade records
  const columns: ColumnDef<GradeRecord>[] = [
    {
      accessorKey: 'assessmentDate',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[#555555] whitespace-nowrap">
          {row.original.assessmentDate}
        </span>
      ),
    },
    {
      accessorKey: 'assessmentTitle',
      header: 'Nama evaluasi',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-sm text-[#000000] block">
            {row.original.assessmentTitle}
          </span>
          <span className="text-xs text-[#555555]">
            {row.original.category} · {row.original.className}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'subjectName',
      header: 'Mata pelajaran',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-[#292524]">
          {row.original.subjectName}
        </span>
      ),
    },
    {
      accessorKey: 'score',
      header: () => <span className="w-full text-right block">Skor</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="tabular-nums font-bold text-sm text-[#000000]">
            {row.original.score}
          </span>
          <span className="text-[11px] text-[#555555]"> / 100</span>
        </div>
      ),
    },
    {
      accessorKey: 'classAverage',
      header: () => <span className="w-full text-right block">Rata-rata kelas</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="tabular-nums font-mono text-xs text-[#555555]">
            {row.original.classAverage}
          </span>
        </div>
      ),
    },
    {
      id: 'diff',
      header: () => <span className="w-full text-right block">Selisih Kelas</span>,
      cell: ({ row }) => {
        const diff = row.original.score - (row.original.classAverage || 0)
        const isPositive = diff >= 0
        return (
          <div className="text-right">
            <span
              className={cn(
                'inline-flex items-center text-xs font-mono font-medium',
                isPositive ? 'text-[#16a34a]' : 'text-[#dc2626]'
              )}
            >
              {isPositive ? `+${diff}` : `${diff}`}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'tutorFeedback',
      header: 'Catatan & umpan balik tutor',
      cell: ({ row }) => (
        <div className="space-y-1 max-w-sm">
          <p className="text-xs text-[#292524] leading-relaxed">
            "{row.original.tutorFeedback}"
          </p>
          <span className="text-[11px] text-[#555555] block">
            Oleh {row.original.tutorName}
          </span>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Page Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D2D2D2]/60">
        <div>
          <span className="text-xs font-semibold tracking-wider text-[#555555] uppercase block mb-1">
            Akademik & Progres Belajar
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#000000]">
            Nilai & Rapor Hasil Belajar
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1 leading-relaxed">
            Rekapitulasi nilai try out, kuis mingguan, serta catatan evaluasi kualitatif dari tutor pembimbing.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#555555] self-start sm:self-auto shrink-0">
          <GraduationCap className="w-4 h-4 text-[#CB2957]" />
          <span className="font-semibold text-[#000000]">{student?.className || 'UTBK Intensif A'}</span>
        </div>
      </div>

      {/* 2. 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryMetricCard
          title="Rata-rata Skor"
          value={avgScore}
          unit="/ 100"
          description="Rata-rata seluruh evaluasi bimbingan"
          icon={Award}
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">
                {totalAssessments > 0 ? 'Pencapaian evaluasi' : 'Belum ada evaluasi'}
              </span>
              <span className="text-[11px] text-[#555555]">
                {totalAssessments > 0 ? 'Konsisten' : '—'}
              </span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Try Out Tertinggi"
          value={highestScore}
          unit="/ 100"
          description="Skor simulasi try out terbaik"
          icon={Sparkles}
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">
                {bestRecord ? bestRecord.subjectName : 'Belum ada nilai'}
              </span>
              <span className="text-[11px] text-[#555555]">
                {highestScore >= 85 ? 'Predikat A' : highestScore >= 70 ? 'Predikat B' : '—'}
              </span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Total Latihan & Ujian"
          value={`${totalAssessments} Evaluasi`}
          description="Try out berkala, kuis, & tugas"
          icon={BookOpen}
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">Tuntas dikerjakan</span>
              <span className="text-[11px] text-[#555555]">Semester berjalan</span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Evaluasi Pembimbing"
          value={`${positiveEvaluations} Sangat Baik`}
          description="Catatan umpan balik positif dari tutor"
          icon={CheckCircle2}
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">Progres positif</span>
              <span className="text-[11px] text-[#555555]">Tiap pertemuan</span>
            </div>
          }
        />
      </div>

      {/* 3. Visual Score Progress Chart */}
      {chartGrades.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D2D2D2]/60 pb-3">
            <div>
              <h2 className="text-base font-bold font-display text-[#000000] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#CB2957]" />
                <span>Grafik Perkembangan Nilai Belajar</span>
              </h2>
              <p className="text-xs text-[#555555] mt-0.5">
                Tren skor evaluasi mandiri dibandingkan rata-rata rombel kelas.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#000000]" />
                <span className="text-[#000000]">Skor Pribadi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#888888]" />
                <span className="text-[#555555]">Rata-rata Kelas</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 sm:h-56 min-w-[500px]"
            >
              {[100, 75, 50, 25, 0].map((val) => {
                const y = getY(val)
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#E5E5E5"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#777777"
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  </g>
                )
              })}

              {classPath && (
                <path
                  d={classPath}
                  fill="none"
                  stroke="#999999"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}

              {studentPath && (
                <path
                  d={studentPath}
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2.5"
                />
              )}

              {studentPoints.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    fill="#CB2957"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#000000"
                  >
                    {p.score}
                  </text>
                  <text
                    x={p.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#555555"
                  >
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* 4. DataTable of Grades with renderMobileCard */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold font-display text-[#000000]">
            Daftar Rekapitulasi Nilai & Catatan Tutor
          </h2>
          <p className="text-xs text-[#555555] mt-0.5">
            Setiap evaluasi disertai skor pencapaian, perbandingan terhadap rata-rata kelas, dan saran pengembangan diri.
          </p>
        </div>

        <DataTable
          columns={columns}
          data={grades}
          searchPlaceholder="Cari judul ujian, mata pelajaran, atau tutor..."
          emptyState="Belum ada riwayat nilai evaluasi yang tersimpan."
          renderMobileCard={(row) => (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#D2D2D2]/50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#555555]">
                    {row.assessmentDate}
                  </span>
                  <span className="text-[#D2D2D2]">·</span>
                  <span className="text-xs font-semibold text-[#CB2957]">
                    {row.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-base text-[#000000] tabular-nums">
                    {row.score}
                  </span>
                  <span className="text-xs text-[#555555]">/100</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-[#000000]">
                  {row.assessmentTitle}
                </h3>
                <p className="text-xs text-[#555555] mt-0.5">
                  {row.subjectName} · Rata-rata kelas: {row.classAverage}
                </p>
              </div>

              <div className="bg-[#F6F6F6] rounded-[8px] p-2.5 text-xs text-[#292524] leading-relaxed">
                <p className="italic">"{row.tutorFeedback}"</p>
                <span className="text-[11px] text-[#555555] mt-1 block font-medium">
                  — {row.tutorName}
                </span>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  )
}
