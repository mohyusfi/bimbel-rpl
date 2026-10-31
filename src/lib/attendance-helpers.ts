/**
 * Utilitas dan aturan bisnis untuk modul Presensi Sesi Digital (ATTEND-01 & ATTEND-02)
 */

export interface SessionLockCandidate {
  isCompleted: boolean
  sessionDate: string
  completedAt?: string | Date | null
}

/** Toleransi koreksi presensi oleh Tutor setelah sesi diselesaikan (2 jam). */
export const GRACE_PERIOD_HOURS = 2
const GRACE_PERIOD_MS = GRACE_PERIOD_HOURS * 60 * 60 * 1000

/**
 * Format objek Date ke format string YYYY-MM-DD menggunakan waktu lokal (Kota Palu / WITA).
 * Mencegah pergeseran tanggal akibat konversi UTC pada jam-jam pagi.
 */
export function formatLocalDate(date: Date = new Date()): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Menentukan apakah sebuah sesi telah terkunci permanen (audit lock) bagi Tutor.
 *
 * Aturan Bisnis (Grace Period 2 Jam):
 * 1. Jika sesi belum selesai (isCompleted = false), sesi selalu dapat diedit (false).
 * 2. Jika sesi sudah selesai (isCompleted = true):
 *    - Jika ada completedAt: toleransi edit adalah 2 jam sejak completedAt.
 *    - Jika tidak ada completedAt: menggunakan akhir hari sessionDate (23:59:59) + 2 jam.
 *    - Melewati batas 2 jam, kembalikan true (terkunci).
 */
export function isSessionLockedForTutor(
  session: SessionLockCandidate,
  now: Date = new Date()
): boolean {
  if (!session.isCompleted) {
    return false
  }

  const nowMs = now.getTime()

  if (session.completedAt) {
    const completedAtMs = new Date(session.completedAt).getTime()
    if (!isNaN(completedAtMs)) {
      return nowMs - completedAtMs > GRACE_PERIOD_MS
    }
  }

  // Fallback: Menggunakan batas akhir hari sessionDate (23:59:59 lokal)
  const sessionDateObj = new Date(`${session.sessionDate}T23:59:59`)
  const sessionDateMs = sessionDateObj.getTime()
  if (!isNaN(sessionDateMs)) {
    return nowMs - sessionDateMs > GRACE_PERIOD_MS
  }

  return false
}

/**
 * Menentukan apakah sebuah sesi bimbingan terlewat / overdue (belum selesai tetapi tanggalnya sudah lewat).
 */
export function isSessionOverdue(
  session: SessionLockCandidate,
  today: Date = new Date()
): boolean {
  if (session.isCompleted) {
    return false
  }

  const todayStr = formatLocalDate(today)
  return session.sessionDate < todayStr
}

/**
 * Menghitung persentase kehadiran secara deterministik.
 * Jika totalCompleted <= 0, kembalikan 100%.
 */
export function calculateAttendancePercentage(
  hadirCount: number,
  totalCompleted: number
): number {
  if (totalCompleted <= 0) {
    return 100
  }
  return Math.round((hadirCount / totalCompleted) * 100)
}

const INDONESIAN_MONTH_MAP: Record<string, string> = {
  januari: '01',
  februari: '02',
  maret: '03',
  april: '04',
  mei: '05',
  juni: '06',
  juli: '07',
  agustus: '08',
  september: '09',
  oktober: '10',
  november: '11',
  desember: '12',
}

/**
 * Mengurai string tanggal bergabung/verifikasi siswa (baik format ISO YYYY-MM-DD
 * maupun format teks Indonesia "30 Oktober 2026") menjadi format terstandarisasi YYYY-MM-DD
 * untuk perbandingan leksikografis yang deterministik.
 */
export function parseJoinDateToComparableDate(
  joinDateStr?: string | null
): string | null {
  if (!joinDateStr || typeof joinDateStr !== 'string') {
    return null
  }

  const trimmed = joinDateStr.trim()
  if (!trimmed) {
    return null
  }

  // 1. Format ISO YYYY-MM-DD atau ISO Timestamp
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  }

  // 2. Format teks Indonesia: misal "30 Oktober 2026" atau "5 Mei 2026"
  const idMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (idMatch) {
    const day = idMatch[1].padStart(2, '0')
    const monthKey = idMatch[2].toLowerCase()
    const month = INDONESIAN_MONTH_MAP[monthKey]
    const year = idMatch[3]

    if (month) {
      return `${year}-${month}-${day}`
    }
  }

  // 3. Fallback: coba parsing menggunakan Date bawaan
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    return formatLocalDate(parsed)
  }

  return null
}

/**
 * Menentukan apakah sebuah sesi bimbingan sudah terlewat waktunya
 * berdasarkan tanggal dan jam selesai sesi (WITA / waktu lokal).
 */
export function isSessionPast(
  sessionDate: string,
  endTime?: string,
  now: Date = new Date()
): boolean {
  const todayStr = formatLocalDate(now)

  if (sessionDate < todayStr) {
    return true
  }

  if (sessionDate > todayStr) {
    return false
  }

  // Sesi pada hari yang sama: periksa jam selesai
  if (!endTime) {
    return false
  }

  const [endHourStr, endMinuteStr] = endTime.split(':')
  const endH = parseInt(endHourStr, 10)
  const endM = parseInt(endMinuteStr, 10)

  if (isNaN(endH) || isNaN(endM)) {
    return false
  }

  const currentH = now.getHours()
  const currentM = now.getMinutes()

  return currentH > endH || (currentH === endH && currentM >= endM)
}

/**
 * Menentukan status presensi sesi secara terpadu dari sudut pandang siswa:
 * 1. Sesi telah disubmit tutor (isCompleted = true):
 *    - Jika ada entri siswa: 'hadir' | 'sakit' | 'izin' | 'alpa'
 *    - Jika tidak ada entri siswa: 'belum_dicatat'
 * 2. Sesi belum disubmit tutor (isCompleted = false):
 *    - Jika jam sesi sudah terlewat: 'menunggu_tutor' ("Menunggu Presensi Tutor")
 *    - Jika jam sesi belum mulai / masa depan: 'terjadwal'
 */
export function resolveStudentSessionStatus(params: {
  isCompleted: boolean
  sessionDate: string
  endTime?: string
  entryStatus?: 'hadir' | 'sakit' | 'izin' | 'alpa'
  hasEntry: boolean
  now?: Date
}):
  | 'hadir'
  | 'sakit'
  | 'izin'
  | 'alpa'
  | 'terjadwal'
  | 'menunggu_tutor'
  | 'belum_dicatat' {
  const {
    isCompleted,
    sessionDate,
    endTime,
    entryStatus,
    hasEntry,
    now = new Date(),
  } = params

  if (isCompleted) {
    if (hasEntry && entryStatus) {
      return entryStatus
    }
    return 'belum_dicatat'
  }

  if (isSessionPast(sessionDate, endTime, now)) {
    return 'menunggu_tutor'
  }

  return 'terjadwal'
}

/**
 * Menyaring daftar sesi bimbingan untuk siswa:
 * 1. Hanya sertakan sesi jika tanggal pelaksanaan sesi >= tanggal verifikasi/bergabung siswa
 * 2. Sesi sebelum tanggal verifikasi otomatis dikecualikan, KECUALI jika siswa memiliki
 *    catatan kehadiran eksplisit di sesi tersebut.
 */
export function filterStudentSessionsByJoinDate<
  T extends {
    sessionDate: string
    classId?: string
    entries?: Array<{ studentId: string }>
  },
>(
  sessions: T[],
  params: {
    studentId?: string
    classId?: string
    joinDate?: string | null
  }
): T[] {
  const { studentId, classId, joinDate } = params
  const comparableJoinDate = parseJoinDateToComparableDate(joinDate)

  return sessions.filter((s) => {
    // Siswa secara eksplisit memiliki catatan absensi
    const hasStudentEntry = Boolean(
      studentId && s.entries && s.entries.some((e) => e.studentId === studentId)
    )
    if (hasStudentEntry) {
      return true
    }

    // Jika bukan kelas siswa, abaikan
    const isClassSession = Boolean(classId && s.classId === classId)
    if (!isClassSession) {
      return false
    }

    // Saring berdasarkan tanggal verifikasi/bergabung
    if (comparableJoinDate) {
      return s.sessionDate >= comparableJoinDate
    }

    return true
  })
}

