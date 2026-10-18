import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Award,
  TrendingUp,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Lightbulb,
  Clock,
  Sparkles,
} from 'lucide-react'
import { GRADE_RECORDS, type GradeRecord } from '~/lib/mock-student-data'

export const Route = createFileRoute('/student/nilai')({
  ssr: false,
  component: StudentNilaiPage,
})

function StudentNilaiPage() {
  const [data] = React.useState<GradeRecord[]>(GRADE_RECORDS)
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'score', desc: true },
  ])

  // Summary Metrics
  const totalTests = data.length
  const avgScore = (
    data.reduce((acc, curr) => acc + curr.score, 0) / totalTests
  ).toFixed(1)
  const highestScore = Math.max(...data.map((d) => d.score))
  const highScorerCount = data.filter((d) => d.score >= 85).length

  // Table Columns
  const columns = React.useMemo<ColumnDef<GradeRecord>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Tanggal Evaluasi',
        cell: (info) => (
          <span className="font-mono text-xs text-[#555555] whitespace-nowrap">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'testName',
        header: 'Nama Ujian / Evaluasi',
        cell: (info) => {
          const val = info.getValue<string>()
          const isTryOut = val.toLowerCase().includes('try out')
          return (
            <div className="space-y-0.5">
              <span className="font-bold text-xs sm:text-sm text-[#000000] block">
                {val}
              </span>
              <span className="text-[11px] text-[#555555]">
                {isTryOut ? 'Simulasi Skala Nasional' : 'Evaluasi Mingguan Kelas'}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'subject',
        header: 'Mata Pelajaran',
        cell: (info) => (
          <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-[#F6F6F6] text-[#000000] border border-[#D2D2D2] whitespace-nowrap">
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'score',
        header: ({ column }) => {
          return (
            <button
              type="button"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1 font-bold text-xs uppercase font-archivo hover:text-[#CB2957] transition-colors cursor-pointer"
            >
              <span>Skor Siswa</span>
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#CB2957]" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="w-3.5 h-3.5 text-[#CB2957]" />
              ) : (
                <ArrowUpDown className="w-3.5 h-3.5 text-[#555555]" />
              )}
            </button>
          )
        },
        cell: (info) => {
          const score = info.getValue<number>()
          const isOutstanding = score >= 85
          return (
            <div className="flex items-center gap-2">
              <span
                className={`font-['Archivo'] font-bold text-sm sm:text-base tabular-nums px-2.5 py-0.5 rounded-[6px] border ${
                  isOutstanding
                    ? 'bg-neutral-100 text-black border-black font-black'
                    : 'bg-[#F6F6F6] text-black border-[#D2D2D2]'
                }`}
              >
                {score}
              </span>
              {isOutstanding && (
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-black">
                  Istimewa
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'average',
        header: 'Rata-rata Kelas',
        cell: (info) => {
          const avg = info.getValue<number>()
          const rowScore = info.row.original.score
          const diff = rowScore - avg
          return (
            <div className="text-xs font-mono">
              <span className="text-[#555555] font-semibold">{avg}</span>
              <span className="ml-1.5 text-[11px] font-medium text-neutral-600">
                ({diff >= 0 ? `+${diff}` : diff})
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'tutorNote',
        header: 'Catatan Tutor Pembimbing',
        cell: (info) => (
          <p className="text-xs text-[#333333] font-instrument leading-relaxed max-w-md">
            &ldquo;{info.getValue<string>()}&rdquo;
          </p>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <>
      {/* 1. Editorial Page Header */}
      <div className="dash-page-header">
        <div className="dash-title-group">
          <h1>Rapor Progres &amp; Nilai Siswa</h1>
          <p>
            Pantau rekapitulasi nilai try out nasional dan kuis berkala. Nilai dievaluasi langsung oleh tutor mata pelajaran.
          </p>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-white text-black border border-[#D2D2D2]">
            <TrendingUp className="w-3.5 h-3.5 text-[#CB2957]" />
            <span>Target Skor: 85+ (Passing Grade PTN)</span>
          </div>
        </div>
      </div>

      {/* 2. Editorial Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Rata-Rata Nilai</div>
          <div className="metric-val num-tabular text-black">
            {avgScore} <span style={{ fontSize: '1.1rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>/ 100</span>
          </div>
          <div className="metric-sub text-neutral-600">+14 poin di atas rata-rata kelompok</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Skor Try Out Tertinggi</div>
          <div className="metric-val num-tabular">
            {highestScore} <span style={{ fontSize: '1.1rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>/ 100</span>
          </div>
          <div className="metric-sub">Try Out 3 UTBK-SNBT Nasional</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Evaluasi Terdata</div>
          <div className="metric-val num-tabular">{totalTests} Ujian</div>
          <div className="metric-sub">Konsistensi kehadiran ujian 100%</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Capaian Target (&gt;= 85)</div>
          <div className="metric-val text-black" style={{ fontSize: '1.6rem' }}>
            {highScorerCount} / {totalTests} Tuntas
          </div>
          <div className="metric-sub">Kategori Sangat Memuaskan</div>
        </div>
      </div>

      {/* 3. Rapor Nilai Table Section */}
      <div className="dash-card">
        <div className="dash-card-header flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="dash-card-title">Rekapitulasi Nilai &amp; Catatan Ujian</div>
            <span className="status-tag status-neutral">{table.getFilteredRowModel().rows.length} Data</span>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Cari ujian atau mapel..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-neutral-50 border border-[#D2D2D2] rounded-md text-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => setGlobalFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                aria-label="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-neutral-500">
                    Tidak ada catatan nilai yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-[#D2D2D2] bg-neutral-50 text-xs text-neutral-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Penanda border hitam tegas menandakan capaian skor tuntas istimewa &gt;= 85.
          </span>
          <span className="font-mono text-[11px] text-neutral-500">
            Sistem Rapor Digital Tadulako Cendekia Palu
          </span>
        </div>
      </div>

      {/* 4. Evaluasi Personal & Tips Belajar Container */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div className="dash-card-title">Evaluasi Personal Tutor Pembimbing &amp; Tips Belajar</div>
          <span className="status-tag status-neutral">Pembaruan: 16 Maret 2026</span>
        </div>
        <div className="dash-card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Evaluasi Personal */}
            <div className="p-5 bg-neutral-50 border border-[#D2D2D2] rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-4 h-4 text-[#CB2957]" />
                  <span className="font-semibold text-sm text-black">Catatan Evaluasi Personal Tutor</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed italic bg-white p-4 rounded-lg border border-[#D2D2D2]">
                  &ldquo;Fahri menunjukkan daya serap analitik yang istimewa terutama pada bab Penalaran Kuantitatif dan Mekanika Klasik. Pada simulasi Try Out 3, kecepatan penyelesaian soal meningkat 20%. Sedikit akselerasi perlu difokuskan pada bab stoikiometri larutan dan pemahaman wacana teks panjang pada TPS Bahasa Indonesia.&rdquo;
                </p>
              </div>
              <div className="text-[11px] text-neutral-500 mt-3 pt-3 border-t border-neutral-200">
                Oleh Kak Dian Pratiwi, S.Si &amp; Kak Moh. Yusfi, S.Pd
              </div>
            </div>

            {/* Tips Belajar Efektif */}
            <div className="p-5 bg-white border border-[#D2D2D2] rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-[#CB2957]" />
                  <span className="font-semibold text-sm text-black">Rencana Aksi &amp; Tips Belajar</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-neutral-50 border border-[#D2D2D2]">
                    <Clock className="w-4 h-4 text-[#CB2957] shrink-0 mt-0.5" />
                    <div className="text-xs leading-snug">
                      <strong className="text-black block">Pola Latihan 45–15:</strong>
                      Pola 45 menit pengerjaan soal HOTS tanpa membuka kunci jawaban, lalu 15 menit telaah pembahasan.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-neutral-50 border border-[#D2D2D2]">
                    <BookOpen className="w-4 h-4 text-black shrink-0 mt-0.5" />
                    <div className="text-xs leading-snug">
                      <strong className="text-black block">Klinik Konsultasi PR:</strong>
                      Gunakan slot klinik tatap muka tiap Kamis sore di Ruang Palu-1 untuk menuntaskan materi yang belum tuntas.
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-neutral-500 mt-3 pt-3 border-t border-neutral-200">
                Target Try Out Berikutnya: <strong className="text-[#CB2957]">Skor 95.0+</strong> (24 Oktober 2026)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
