import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Clock,
  MapPin,
  Search,
  X,
  Info,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react'
import { SCHEDULE_SESSIONS, type ScheduleSession } from '~/lib/mock-student-data'

export const Route = createFileRoute('/student/jadwal')({
  ssr: false,
  component: StudentJadwalPage,
})

const MONTH_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

const SUBJECT_FILTERS = [
  'Semua',
  'Fisika',
  'Matematika',
  'Kimia',
  'Biologi',
  'Simulasi Try Out',
]

function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null
  return { year, month, day }
}

function formatDayHeading(day: string, dateStr: string): string {
  const parsed = parseDate(dateStr)
  if (!parsed) return day
  const monthName = MONTH_LONG[parsed.month - 1] ?? String(parsed.month)
  return `${day}, ${parsed.day} ${monthName} ${parsed.year}`
}

function formatDateShort(dateStr: string): string {
  const parsed = parseDate(dateStr)
  if (!parsed) return dateStr
  const monthName = MONTH_SHORT[parsed.month - 1] ?? String(parsed.month)
  return `${parsed.day} ${monthName} ${parsed.year}`
}

function formatWeekRange(sessions: ScheduleSession[]): string {
  if (sessions.length === 0) return ''
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
  const first = parseDate(sorted[0].date)
  const last = parseDate(sorted[sorted.length - 1].date)
  if (!first || !last) return ''
  if (first.month === last.month && first.year === last.year) {
    return `${first.day}–${last.day} ${MONTH_LONG[first.month - 1]} ${first.year}`
  }
  return `${first.day} ${MONTH_SHORT[first.month - 1]} – ${last.day} ${MONTH_SHORT[last.month - 1]} ${last.year}`
}

function getInitials(name: string): string {
  return name
    .replace(/^Kak\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

function matchesSubject(subject: string, filter: string): boolean {
  return filter === 'Semua' || subject.toLowerCase().includes(filter.toLowerCase())
}

function SessionStatusBadge({ status }: { status: ScheduleSession['status'] }) {
  if (status === 'Selesai') {
    return (
      <span className="status-badge tone-done">
        <span className="badge-mark">
          <CheckCircle2 />
        </span>
        <span>Selesai</span>
      </span>
    )
  }

  if (status === 'Dibatalkan') {
    return (
      <span className="status-badge tone-rejected">
        <span className="badge-mark">
          <XCircle />
        </span>
        <span>Dibatalkan</span>
      </span>
    )
  }

  return (
    <span className="status-badge tone-neutral">
      <span className="badge-mark">
        <span className="badge-dot" />
      </span>
      <span>Terjadwal</span>
    </span>
  )
}

function StudentJadwalPage() {
  const [query, setQuery] = React.useState<string>('')
  const [subject, setSubject] = React.useState<string>('Semua')

  const sessions = SCHEDULE_SESSIONS

  const subjectCounts: Record<string, number> = { Semua: sessions.length }
  for (const filter of SUBJECT_FILTERS) {
    if (filter === 'Semua') continue
    subjectCounts[filter] = sessions.filter((item) => matchesSubject(item.subject, filter)).length
  }

  const trimmedQuery = query.trim().toLowerCase()
  const visibleSessions = sessions.filter((item) => {
    if (!matchesSubject(item.subject, subject)) return false
    if (!trimmedQuery) return true
    return (
      item.subject.toLowerCase().includes(trimmedQuery) ||
      item.topic.toLowerCase().includes(trimmedQuery) ||
      item.tutor.toLowerCase().includes(trimmedQuery) ||
      item.room.toLowerCase().includes(trimmedQuery) ||
      item.day.toLowerCase().includes(trimmedQuery)
    )
  })

  const dayGroups: { key: string; day: string; date: string; sessions: ScheduleSession[] }[] = []
  for (const item of visibleSessions) {
    const key = `${item.date}-${item.day}`
    const last = dayGroups[dayGroups.length - 1]
    if (last && last.key === key) {
      last.sessions.push(item)
    } else {
      dayGroups.push({ key, day: item.day, date: item.date, sessions: [item] })
    }
  }

  const hasFilter = subject !== 'Semua' || trimmedQuery.length > 0
  const weekRange = formatWeekRange(sessions)

  const resetFilters = () => {
    setQuery('')
    setSubject('Semua')
  }

  return (
    <div className="pb-4">
      <div className="dash-page-header">
        <div className="dash-title-group">
          <h1>Jadwal Bimbingan Les</h1>
          <p>
            Sesi tatap muka di Kampus Tadulako Cendekia Palu · Minggu ini{weekRange ? ` (${weekRange})` : ''} · WITA
          </p>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted mb-5">
        <Info className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
        Ruang dibuka 15 menit sebelum sesi dimulai; kehadiran dicatat langsung oleh tutor pengajar.
      </p>

      <div className="dash-card">
        <div className="dash-card-header flex-col items-stretch gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="mr-1 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Mapel
            </span>
            {SUBJECT_FILTERS.map((filter) => {
              const isActive = subject === filter
              return (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSubject(filter)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  <span>{filter}</span>
                  <span className="num-tabular text-[11px] font-medium opacity-70">
                    {subjectCounts[filter] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2.5 md:shrink-0">
            <div className="relative flex-1 md:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari topik, tutor, atau ruang"
                aria-label="Cari jadwal"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-9 pr-8 text-xs text-[var(--foreground)] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--foreground)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {hasFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn btn-outline btn-sm shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {dayGroups.length > 0 ? (
          <div>
            {dayGroups.map((group) => (
              <section
                key={group.key}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-3 bg-[var(--surface-muted)] px-5 py-2.5 sm:px-6">
                  <h2 className="font-archivo text-sm font-bold tracking-tight text-[var(--foreground)]">
                    {formatDayHeading(group.day, group.date)}
                  </h2>
                  <span className="num-tabular shrink-0 text-[11px] text-muted">
                    {group.sessions.length} sesi
                  </span>
                </div>

                <ul>
                  {group.sessions.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 last:border-b-0 hover:bg-[var(--surface-muted)] sm:flex-row sm:items-center sm:gap-5 sm:px-6"
                    >
                      <div className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--foreground)] sm:w-36">
                        <Clock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                        <span className="num-tabular">{item.time}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-archivo text-sm font-bold text-[var(--foreground)]">
                          {item.subject}
                        </div>
                        <div className="mt-0.5 text-xs leading-snug text-muted">
                          {item.topic}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:w-64 sm:shrink-0">
                        <span className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-[10px] font-bold text-[var(--foreground)]">
                            {getInitials(item.tutor)}
                          </span>
                          <span className="text-xs font-medium text-[var(--foreground)]">
                            {item.tutor}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                          {item.room}
                        </span>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <SessionStatusBadge status={item.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)] text-muted">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              {hasFilter ? (
                <>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Tidak ada sesi yang cocok
                  </p>
                  <p className="text-xs text-muted">
                    Coba ubah kata kunci pencarian atau pilih mata pelajaran lain.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn btn-primary btn-sm mt-2"
                  >
                    Reset filter
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Belum ada jadwal untuk minggu ini
                  </p>
                  <p className="text-xs text-muted">
                    Jadwal sesi bimbingan akan muncul di sini setelah ditetapkan oleh Tata Usaha.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {dayGroups.length > 0 && (
          <div className="flex flex-col justify-between gap-2 border-t border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3 text-xs text-muted sm:flex-row sm:items-center sm:px-6">
            <span>
              Menampilkan{' '}
              <span className="num-tabular font-semibold text-[var(--foreground)]">
                {visibleSessions.length}
              </span>{' '}
              dari {sessions.length} sesi minggu ini
            </span>
            <span className="text-[11px]">
              {weekRange ? `${weekRange} · ` : ''}Zona WITA (Palu)
            </span>
          </div>
        )}
      </div>
    </div>
  )
}