/**
 * Pembentuk notifikasi presensi ke orang tua/wali (ATTEND-01).
 *
 * Fungsi murni ini dipakai bersama oleh service server (attendance.service) dan
 * store klien (admin-store) sehingga aturan notifikasi dapat diuji terisolasi.
 */

export type AttendanceStatusKey = 'hadir' | 'sakit' | 'izin' | 'alpa'

export interface AttendanceNotificationEntry {
  studentId: string
  studentName: string
  status: AttendanceStatusKey | string
}

export interface AttendanceParentRecipient {
  studentId: string
  parentProfileId: string
}

export interface AttendanceNotificationSession {
  id: string
  subjectName?: string
  dayOfWeek?: string
  startTime?: string
}

export interface AttendanceNotificationDraft {
  userId: string
  title: string
  message: string
  type: 'attendance'
  linkUrl: string
  metadata: {
    sessionId: string
    studentId: string
    status: string
    targetRoles: string[]
  }
}

const STATUS_LABEL: Record<string, string> = {
  hadir: 'Hadir',
  sakit: 'Sakit',
  izin: 'Izin',
  alpa: 'Alpa',
}

/**
 * Menerjemahkan status presensi menjadi label ramah tampilan. Nilai tak dikenal
 * jatuh kembali ke "Hadir" agar tidak pernah menampilkan status kosong.
 */
export function attendanceStatusLabel(status: string): string {
  return STATUS_LABEL[String(status || '').toLowerCase()] || 'Hadir'
}

/**
 * Membangun draf notifikasi presensi untuk SETIAP siswa yang memiliki orang tua
 * terhubung, apa pun statusnya (hadir/sakit/izin/alpa). Satu siswa menghasilkan
 * tepat satu draf per orang tua (anti-duplikasi dalam satu payload).
 */
export function buildAttendanceNotifications(params: {
  session: AttendanceNotificationSession
  entries: AttendanceNotificationEntry[]
  recipients: AttendanceParentRecipient[]
}): AttendanceNotificationDraft[] {
  const { session, entries, recipients } = params

  if (!session?.id || entries.length === 0 || recipients.length === 0) {
    return []
  }

  const parentByStudent = new Map<string, string>()
  for (const recipient of recipients) {
    if (recipient.studentId && recipient.parentProfileId) {
      parentByStudent.set(recipient.studentId, recipient.parentProfileId)
    }
  }

  const drafts: AttendanceNotificationDraft[] = []
  const seen = new Set<string>()

  for (const entry of entries) {
    const parentProfileId = parentByStudent.get(entry.studentId)
    if (!parentProfileId) continue

    const dedupKey = `${parentProfileId}::${entry.studentId}`
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)

    const label = attendanceStatusLabel(entry.status)
    const subject = session.subjectName || 'bimbingan belajar'
    const scheduleText = session.dayOfWeek
      ? ` (${session.dayOfWeek}${session.startTime ? `, ${session.startTime} WITA` : ''})`
      : ''

    drafts.push({
      userId: parentProfileId,
      title: `Presensi ${entry.studentName}: ${label}`,
      message: `${entry.studentName} tercatat ${label} pada sesi ${subject}${scheduleText}.`,
      type: 'attendance',
      linkUrl: '/parent/kehadiran',
      metadata: {
        sessionId: session.id,
        studentId: entry.studentId,
        status: entry.status,
        targetRoles: ['parent'],
      },
    })
  }

  return drafts
}
