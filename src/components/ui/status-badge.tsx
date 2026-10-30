import * as React from 'react'
import { Clock, AlertCircle, CheckCircle2, XCircle, Calendar } from 'lucide-react'
import { cn } from '~/lib/utils'

export type BadgeStatus =
  | 'menunggu'
  | 'lunas'
  | 'terverifikasi'
  | 'disetujui'
  | 'aktif'
  | 'ditolak'
  | 'nonaktif'
  | 'belum_dibayar'
  | 'bentrok'
  | 'hadir'
  | 'sakit'
  | 'izin'
  | 'alpa'
  | 'terjadwal'
  | 'dibatalkan'
  | 'belum_diabsen'
  | 'menunggu_tutor'
  | 'belum_dicatat'

export interface StatusBadgeProps {
  status: BadgeStatus
  since?: string // ISO timestamp or date string
  lateAfterHours?: number // Default 48 jam
  label?: string // Custom label override
  className?: string
}

export function formatRelativeWait(since: string, lateAfterHours: number = 48) {
  try {
    const diffMs = Date.now() - new Date(since).getTime()
    if (diffMs < 0) return { label: 'Baru masuk', isLate: false }

    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const isLate = diffHours >= lateAfterHours

    if (diffMinutes < 5) {
      return { label: 'Baru masuk', isLate }
    }
    if (diffHours < 1) {
      return { label: `Menunggu ${diffMinutes} menit`, isLate }
    }
    if (diffHours < 24) {
      return { label: `Menunggu ${diffHours} jam`, isLate }
    }
    return { label: `Menunggu ${diffDays} hari`, isLate }
  } catch {
    return { label: 'Menunggu', isLate: false }
  }
}

export function StatusBadge({
  status,
  since,
  lateAfterHours = 48,
  label,
  className,
}: StatusBadgeProps) {
  const normalized = status.toLowerCase()

  // 1. Menunggu (Waiting or Late)
  if (normalized === 'menunggu') {
    let displayLabel = label || 'Menunggu verifikasi'
    let isLate = false

    if (since) {
      const waitInfo = formatRelativeWait(since, lateAfterHours)
      displayLabel = label || waitInfo.label
      isLate = waitInfo.isLate
    }

    if (isLate) {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium text-[#901B14] select-none shrink-0',
            className
          )}
          title="Menunggu melebihi 48 jam"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{displayLabel}</span>
        </span>
      )
    }

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-[#8C5806] select-none shrink-0',
          className
        )}
      >
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{displayLabel}</span>
      </span>
    )
  }

  // 2. Belum dibayar (Warning amber, NOT brand red)
  if (normalized === 'belum_dibayar') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-[#8C5806] select-none shrink-0',
          className
        )}
      >
        <AlertCircle className="w-3.5 h-3.5 text-[#8C5806] shrink-0" aria-hidden="true" />
        <span>{label || 'Belum dibayar'}</span>
      </span>
    )
  }

  // 3. Izin (Info blue)
  if (normalized === 'izin') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-[#3A5A80] select-none shrink-0',
          className
        )}
      >
        <Clock className="w-3.5 h-3.5 text-[#3A5A80] shrink-0" aria-hidden="true" />
        <span>{label || 'Izin'}</span>
      </span>
    )
  }

  // 4. Sakit (Amber warning)
  if (normalized === 'sakit') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-[#8C5806] select-none shrink-0',
          className
        )}
      >
        <AlertCircle className="w-3.5 h-3.5 text-[#8C5806] shrink-0" aria-hidden="true" />
        <span>{label || 'Sakit'}</span>
      </span>
    )
  }

  // 5. Terjadwal / Netral
  if (normalized === 'terjadwal') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-[#292524] select-none shrink-0',
          className
        )}
      >
        <Calendar className="w-3.5 h-3.5 text-[#555555] shrink-0" aria-hidden="true" />
        <span>{label || 'Terjadwal'}</span>
      </span>
    )
  }

  // 6. Dibatalkan
  if (normalized === 'dibatalkan') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-[#555555] select-none shrink-0',
          className
        )}
      >
        <XCircle className="w-3.5 h-3.5 text-[#555555] shrink-0" aria-hidden="true" />
        <span>{label || 'Dibatalkan'}</span>
      </span>
    )
  }

  // 6.1 Belum Diabsen (Neutral gray with Clock icon)
  if (normalized === 'belum_diabsen') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-[#555555] select-none shrink-0',
          className
        )}
      >
        <Clock className="w-3.5 h-3.5 text-[#555555] shrink-0" aria-hidden="true" />
        <span>{label || 'Belum Diabsen'}</span>
      </span>
    )
  }

  // 6.2 Menunggu Presensi Tutor (Warm amber with Clock icon)
  if (normalized === 'menunggu_tutor') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-[#8C5806] select-none shrink-0',
          className
        )}
      >
        <Clock className="w-3.5 h-3.5 text-[#8C5806] shrink-0" aria-hidden="true" />
        <span>{label || 'Menunggu Presensi Tutor'}</span>
      </span>
    )
  }

  // 6.3 Belum Dicatat (Neutral gray with AlertCircle icon)
  if (normalized === 'belum_dicatat') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-[#555555] select-none shrink-0',
          className
        )}
      >
        <AlertCircle className="w-3.5 h-3.5 text-[#555555] shrink-0" aria-hidden="true" />
        <span>{label || 'Belum Dicatat'}</span>
      </span>
    )
  }

  // 7. Done (Lunas, Hadir, Disetujui, Terverifikasi, Aktif)
  if (
    normalized === 'lunas' ||
    normalized === 'hadir' ||
    normalized === 'disetujui' ||
    normalized === 'terverifikasi' ||
    normalized === 'aktif'
  ) {
    const defaultLabels: Record<string, string> = {
      lunas: 'Lunas',
      hadir: 'Hadir',
      terverifikasi: 'Terverifikasi',
      disetujui: 'Disetujui',
      aktif: 'Aktif',
    }
    const displayLabel = label || defaultLabels[normalized] || 'Selesai'

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-[#166534] select-none shrink-0',
          className
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] shrink-0" aria-hidden="true" />
        <span>{displayLabel}</span>
      </span>
    )
  }

  // 8. Rejected or Destructive (Ditolak, Alpa, Bentrok, Nonaktif)
  const defaultRejectedLabels: Record<string, string> = {
    ditolak: 'Ditolak',
    alpa: 'Alpa',
    nonaktif: 'Nonaktif',
    bentrok: 'Bentrok',
  }
  const displayLabel = label || defaultRejectedLabels[normalized] || 'Ditolak'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium text-[#901B14] select-none shrink-0',
        className
      )}
    >
      <XCircle className="w-3.5 h-3.5 text-[#901B14] shrink-0" aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  )
}
