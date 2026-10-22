import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import {
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  UserCheck,
  MessageSquareQuote,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react'
import { useParentDashboardData } from '~/hooks/use-admin-data'
import { DataTable } from '~/components/ui/data-table'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import type { GradeRecord } from '~/lib/admin-store'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/parent/rapor')({
  component: ParentReportPage,
})

function ParentReportPage() {
  const { childData } = useParentDashboardData()
  const { student, grades, avgGrade } = childData

  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL')

  // Calculate overall statistics
  const totalEvaluations = grades.length
  const highestGrade =
    grades.length > 0 ? Math.max(...grades.map((g) => g.score)) : 0
  const overallClassAvg =
    grades.length > 0
      ? Math.round(
          grades.reduce((sum, g) => sum + g.classAverage, 0) / grades.length
        )
      : 75
  const diffAvg = avgGrade - overallClassAvg
  const isAboveClassAvg = diffAvg >= 0
  const bestAssessment =
    grades.length > 0
      ? grades.reduce((max, g) => (g.score > max.score ? g : max), grades[0])
      : null

  // Filtered grades for table
  const filteredGrades =
    categoryFilter === 'ALL'
      ? grades
      : grades.filter((g) => g.category === categoryFilter)

  // Columns for evaluation table
  const columns: ColumnDef<GradeRecord>[] = [
    {
      accessorKey: 'assessmentTitle',
      header: 'Evaluasi & Kategori',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-xs text-[#000000]">
            {row.original.assessmentTitle}
          </p>
          <span className="text-[11px] text-[#555555]">
            {row.original.category}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'subjectName',
      header: 'Mata Pelajaran',
      cell: ({ row }) => (
        <span className="font-medium text-xs text-[#292524]">
          {row.original.subjectName}
        </span>
      ),
    },
    {
      accessorKey: 'assessmentDate',
      header: 'Tanggal Evaluasi',
      cell: ({ row }) => (
        <span className="text-xs text-[#555555] tabular-nums">
          {row.original.assessmentDate}
        </span>
      ),
    },
    {
      accessorKey: 'tutorName',
      header: 'Tutor Penilai',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-[#292524]">
          <UserCheck className="w-3.5 h-3.5 text-[#555555] shrink-0" />
          <span>{row.original.tutorName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'classAverage',
      header: () => <div className="text-right">Rata-rata Kelas</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-xs text-[#555555] tabular-nums">
          {row.original.classAverage}
        </div>
      ),
    },
    {
      accessorKey: 'score',
      header: () => <div className="text-right">Nilai Anak</div>,
      cell: ({ row }) => {
        const diff = row.original.score - row.original.classAverage
        const isHigher = diff >= 0

        return (
          <div className="text-right space-y-0.5">
            <span className="font-display font-extrabold text-sm text-[#000000] tabular-nums">
              {row.original.score}
            </span>
            <div
              className={cn(
                'text-[10px] font-semibold tabular-nums flex items-center justify-end gap-0.5',
                isHigher ? 'text-[#166534]' : 'text-[#901B14]'
              )}
            >
              {isHigher ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{isHigher ? `+${diff}` : diff} vs kelas</span>
            </div>
          </div>
        )
      },
    },
  ]

  // Mobile card view
  const renderMobileCard = (row: GradeRecord) => {
    const diff = row.score - row.classAverage
    const isHigher = diff >= 0

    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-[#000000]">{row.assessmentTitle}</p>
            <p className="text-[11px] text-[#555555]">
              {row.subjectName} · {row.category}
            </p>
          </div>
          <div className="text-right">
            <span className="font-display font-extrabold text-base text-[#000000] tabular-nums">
              {row.score}
            </span>
            <span className="text-[11px] text-[#555555]"> / 100</span>
          </div>
        </div>

        <div className="p-2.5 bg-[#F6F6F6] rounded-[8px] text-xs italic text-[#292524] leading-relaxed">
          &ldquo;{row.tutorFeedback}&rdquo;
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#555555] pt-1">
          <span>Tutor: {row.tutorName}</span>
          <span
            className={cn(
              'font-semibold tabular-nums flex items-center gap-0.5',
              isHigher ? 'text-[#166534]' : 'text-[#901B14]'
            )}
          >
            {isHigher ? `+${diff}` : diff} vs Rata-rata ({row.classAverage})
          </span>
        </div>
      </div>
    )
  }

  const filterSlot = (
    <div className="flex items-center gap-2">
      <Filter className="w-3.5 h-3.5 text-[#555555]" />
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="h-9 px-3 text-xs bg-[#F6F6F6] focus:bg-[#FFFFFF] text-[#000000] border border-[#D2D2D2] rounded-[8px] focus:outline-none focus:border-[#000000]"
        aria-label="Filter kategori evaluasi"
      >
        <option value="ALL">Semua Jenis Evaluasi</option>
        <option value="Try Out">Simulasi Try Out</option>
        <option value="Kuis">Kuis Harian</option>
        <option value="Tugas">Tugas Mandiri</option>
      </select>
    </div>
  )

  // Prepare chronological points for SVG Chart
  // Reverse chronological or sorted by date
  const chartGrades = [...grades].reverse()
  const chartWidth = 600
  const chartHeight = 220
  const paddingX = 40
  const paddingY = 30
  const innerWidth = chartWidth - paddingX * 2
  const innerHeight = chartHeight - paddingY * 2

  // Scale functions: 0 to 100 on Y
  const getY = (val: number) => {
    return paddingY + innerHeight - (val / 100) * innerHeight
  }

  const getX = (index: number) => {
    if (chartGrades.length <= 1) return paddingX + innerWidth / 2
    return paddingX + (index / (chartGrades.length - 1)) * innerWidth
  }

  // Construct SVG path for student score & class average
  const studentPoints = chartGrades.map((g, idx) => ({
    x: getX(idx),
    y: getY(g.score),
    score: g.score,
    title: g.assessmentTitle,
    subject: g.subjectName,
    date: g.assessmentDate,
  }))

  const classPoints = chartGrades.map((g, idx) => ({
    x: getX(idx),
    y: getY(g.classAverage),
    avg: g.classAverage,
  }))

  const studentPath =
    studentPoints.length > 0
      ? `M ${studentPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`
      : ''

  const classPath =
    classPoints.length > 0
      ? `M ${classPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`
      : ''

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#CB2957]">
          Laporan Kemajuan Belajar Siswa
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#000000] tracking-tight">
          Rapor & Catatan Tutor: {student?.name || 'Siswa'}
        </h1>
        <p className="text-xs sm:text-sm text-[#555555]">
          Evaluasi kemajuan belajar komprehensif, mencakup skor latihan berkala, perbandingan rata-rata kelas, dan arahan kualitatif dari para tutor.
        </p>
      </div>

      {/* KPI Highlights: Rata-rata Anak, Rata-rata Kelas, Nilai Tertinggi, Total Ujian */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryMetricCard
          title="Rata-rata Anak"
          value={totalEvaluations > 0 ? avgGrade : 0}
          unit="/ 100"
          description="Rata-rata seluruh evaluasi belajar"
          icon={TrendingUp}
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">
                {totalEvaluations > 0
                  ? isAboveClassAvg
                    ? `+${diffAvg} vs kelas`
                    : `${diffAvg} vs kelas`
                  : 'Belum ada data'}
              </span>
              <span className="text-[11px] text-[#555555]">
                {totalEvaluations > 0
                  ? isAboveClassAvg
                    ? 'Di atas rata-rata'
                    : 'Perlu bimbingan'
                  : '—'}
              </span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Rata-rata Kelas"
          value={overallClassAvg}
          unit="/ 100"
          description="Standar kelompok rombel belajar"
          icon={GraduationCap}
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">Benchmark rombel</span>
              <span className="text-[11px] text-[#555555]">
                {student?.className || 'Rombel'}
              </span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Nilai Tertinggi"
          value={totalEvaluations > 0 ? highestGrade : 0}
          unit="/ 100"
          description={
            bestAssessment
              ? `Skor terbaik: ${bestAssessment.subjectName}`
              : 'Belum ada data evaluasi'
          }
          icon={Award}
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">
                {bestAssessment ? bestAssessment.assessmentTitle : 'Try out & kuis'}
              </span>
              <span className="text-[11px] text-[#555555]">
                {highestGrade >= 85 ? 'Predikat A' : highestGrade >= 70 ? 'Predikat B' : '—'}
              </span>
            </div>
          }
        />

        <SummaryMetricCard
          title="Total Evaluasi"
          value={`${totalEvaluations} Ujian`}
          description="Kuis harian & simulasi try out"
          icon={BookOpen}
          footer={
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#292524]">Tercatat di rapor</span>
              <span className="text-[11px] text-[#555555]">Semester berjalan</span>
            </div>
          }
        />
      </div>

      {/* Visual SVG Grade Trend Chart */}
      <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D2D2D2]">
          <div>
            <h2 className="font-display font-bold text-base text-[#000000]">
              Grafik Tren Perkembangan Nilai
            </h2>
            <p className="text-xs text-[#555555] mt-0.5">
              Perbandingan skor latihan dan try out putra-putri dengan rata-rata kelompok belajar.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 rounded-[2px] bg-[#CB2957]" />
              <span className="font-semibold text-[#000000]">Nilai Anak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#555555]" />
              <span className="text-[#555555]">Rata-rata Kelas</span>
            </div>
          </div>
        </div>

        {/* SVG Container */}
        {chartGrades.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#555555]">
            Belum ada data evaluasi untuk menampilkan grafik perkembangan nilai.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[500px]">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible font-sans select-none"
                aria-label="Grafik tren nilai siswa"
              >
                {/* Horizontal Reference Lines (0, 25, 50, 75, 100) */}
                {[0, 25, 50, 75, 100].map((score) => {
                  const y = getY(score)
                  return (
                    <g key={score}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#E5E5E5"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[10px] fill-[#888888] font-mono tabular-nums"
                      >
                        {score}
                      </text>
                    </g>
                  )
                })}

                {/* Class Average Dashed Line */}
                {classPath && (
                  <path
                    d={classPath}
                    fill="none"
                    stroke="#555555"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Student Score Line (Crimson) */}
                {studentPath && (
                  <path
                    d={studentPath}
                    fill="none"
                    stroke="#CB2957"
                    strokeWidth="2.5"
                  />
                )}

                {/* Class Average Point Circles */}
                {classPoints.map((pt, i) => (
                  <circle
                    key={`avg-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#FFFFFF"
                    stroke="#555555"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Student Score Point Circles & Value Labels */}
                {studentPoints.map((pt, i) => (
                  <g key={`stu-${i}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#CB2957"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 9}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-[#000000] tabular-nums"
                    >
                      {pt.score}
                    </text>
                    <text
                      x={pt.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      className="text-[10px] fill-[#555555] font-medium"
                    >
                      {pt.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Cards of Qualitative Tutor Feedback */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-4 h-4 text-[#CB2957]" />
          <h2 className="font-display font-bold text-lg text-[#000000]">
            Catatan Kualitatif & Evaluasi Tutor
          </h2>
        </div>

        {grades.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-6 text-center text-xs text-[#555555]">
            Belum ada catatan kualitatif dari tutor untuk siswa ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grades.map((grd) => (
              <div
                key={grd.id}
                className="bg-[#FFFFFF] border border-[#D2D2D2] rounded-[14px] p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#CB2957]">
                        {grd.subjectName}
                      </span>
                      <h3 className="font-display font-bold text-sm text-[#000000] mt-0.5">
                        {grd.assessmentTitle}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-display font-extrabold text-lg text-[#000000] tabular-nums">
                        {grd.score}
                      </span>
                      <span className="text-xs text-[#555555]"> / 100</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F6F6F6] rounded-[8px] text-xs italic text-[#292524] leading-relaxed">
                    &ldquo;{grd.tutorFeedback}&rdquo;
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D2D2D2]/60 flex items-center justify-between text-[11px] text-[#555555]">
                  <div className="flex items-center gap-1.5 font-medium text-[#292524]">
                    <UserCheck className="w-3.5 h-3.5 text-[#555555]" />
                    <span>{grd.tutorName}</span>
                  </div>
                  <span className="tabular-nums">{grd.assessmentDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DataTable of Evaluation Grades */}
      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-[#000000]">
          Rincian Skor Seluruh Evaluasi
        </h2>
        <DataTable
          columns={columns}
          data={filteredGrades}
          searchPlaceholder="Cari nama ujian, mata pelajaran, atau tutor..."
          filterSlot={filterSlot}
          renderMobileCard={renderMobileCard}
          emptyState="Belum ada riwayat nilai evaluasi yang tersimpan."
        />
      </div>
    </div>
  )
}
