import * as React from 'react'
import { Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
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

  // 2. Done (Lunas, Disetujui, Terverifikasi, Aktif)
  if (
    normalized === 'lunas' ||
    normalized === 'disetujui' ||
    normalized === 'terverifikasi' ||
    normalized === 'aktif'
  ) {
    const defaultLabels: Record<string, string> = {
      lunas: 'Lunas',
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

  // 3. Rejected or Destructive (Ditolak, Bentrok, Nonaktif, Belum Dibayar)
  const defaultRejectedLabels: Record<string, string> = {
    ditolak: 'Ditolak',
    nonaktif: 'Nonaktif',
    bentrok: 'Bentrok',
    belum_dibayar: 'Belum dibayar',
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
