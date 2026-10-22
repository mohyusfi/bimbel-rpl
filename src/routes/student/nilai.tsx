import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Award,
  Sparkles,
  BookOpen,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useStudentDashboardData } from '~/hooks/use-admin-data'
import type { GradeRecord } from '~/lib/admin-store'
import { SummaryMetricCard } from '~/components/dashboard/SummaryMetricCard'
import { DataTable } from '~/components/ui/data-table'

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

      {/* 3. DataTable of Grades with renderMobileCard */}
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
