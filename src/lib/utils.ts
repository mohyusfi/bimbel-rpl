import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts clean 2-letter uppercase initials from an Indonesian name,
 * ignoring common honorifics/titles (Pak, Ibu, Kak, Dr., Drs., Hj., H., Ir., S.Pd, etc.)
 */
export function getInitials(name: string): string {
  if (!name) return 'TC'
  const cleanName = name
    .replace(/,.*/g, '') // Strip trailing academic degrees after comma
    .replace(/\b(Pak|Ibu|Kak|Bapak|Dr|Drs|Hj|H|Ir|Prof|Andi|Muh|M)\b\.?/gi, '')
    .trim()

  const parts = (cleanName || name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'TC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val)
}

/**
 * Memformat string tanggal (ISO YYYY-MM-DD atau format tanggal teks lain)
 * ke format standar tanggal Indonesia (contoh: "10 Nov 2026").
 */
export function formatDueDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const isoDateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch
    const d = new Date(Number(year), Number(month) - 1, Number(day))
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  }
  return dateStr
}

