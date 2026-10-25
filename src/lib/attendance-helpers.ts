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
