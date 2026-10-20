/**
 * Validasi Berkas Bukti Transfer Pembayaran SPP (BILL-02 / Tiket 06)
 * Sesuai PRD & Arsitektur Storage:
 * Berkas legal hanya JPG, PNG, dan PDF dengan batas ukuran maksimal 5 MB.
 */

export const MAX_RECEIPT_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB (5,242,880 bytes)

export const ALLOWED_RECEIPT_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'] as const
export type AllowedReceiptExtension = (typeof ALLOWED_RECEIPT_EXTENSIONS)[number]

export const ALLOWED_RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const

export interface ReceiptValidationResult {
  valid: boolean
  fileType?: 'JPG' | 'PNG' | 'PDF'
  error?: string
}

/**
 * Memvalidasi format berkas bukti bayar berdasarkan nama ekstensi dan MIME type.
 * Format legal: JPG/JPEG, PNG, dan PDF.
 */
export function validateReceiptFormat(
  fileName: string,
  mimeType?: string
): { valid: boolean; fileType?: 'JPG' | 'PNG' | 'PDF'; error?: string } {
  if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
    return { valid: false, error: 'Nama berkas tidak valid.' }
  }

  const cleanName = fileName.trim()
  const lastDotIdx = cleanName.lastIndexOf('.')
  if (lastDotIdx === -1 || lastDotIdx === cleanName.length - 1) {
    return {
      valid: false,
      error: 'Berkas tidak memiliki ekstensi yang valid.',
    }
  }

  const ext = cleanName.slice(lastDotIdx).toLowerCase()
  const lowerMime = mimeType?.toLowerCase()

  const isJpg =
    ext === '.jpg' || ext === '.jpeg' || lowerMime === 'image/jpeg' || lowerMime === 'image/jpg'
  const isPng = ext === '.png' || lowerMime === 'image/png'
  const isPdf = ext === '.pdf' || lowerMime === 'application/pdf'

  if (!isJpg && !isPng && !isPdf) {
    return {
      valid: false,
      error:
        'Format berkas tidak didukung. Hanya gambar (JPG, PNG) atau dokumen PDF yang diizinkan sebagai bukti transfer.',
    }
  }

  const fileType: 'JPG' | 'PNG' | 'PDF' = isPdf ? 'PDF' : isPng ? 'PNG' : 'JPG'

  return {
    valid: true,
    fileType,
  }
}

/**
 * Memvalidasi batas ukuran berkas bukti bayar (maksimal 5 MB).
 */
export function validateReceiptFileSize(
  sizeInBytes: number
): { valid: boolean; error?: string } {
  if (typeof sizeInBytes !== 'number' || isNaN(sizeInBytes) || sizeInBytes < 0) {
    return { valid: false, error: 'Ukuran berkas tidak valid.' }
  }

  if (sizeInBytes === 0) {
    return { valid: false, error: 'Berkas kosong (0 bytes) tidak dapat diunggah.' }
  }

  if (sizeInBytes > MAX_RECEIPT_FILE_SIZE_BYTES) {
    const sizeMb = (sizeInBytes / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `Ukuran berkas (${sizeMb} MB) melebihi batas maksimum 5 MB yang diizinkan.`,
    }
  }

  return { valid: true }
}

/**
 * Validasi komprehensif berkas bukti bayar (format legal + batas ukuran <= 5 MB).
 */
export function validateReceiptFile(file: {
  name: string
  size: number
  type?: string
}): ReceiptValidationResult {
  if (!file) {
    return { valid: false, error: 'Berkas bukti transfer tidak ditemukan.' }
  }

  // 1. Validasi format berkas
  const formatCheck = validateReceiptFormat(file.name, file.type)
  if (!formatCheck.valid) {
    return formatCheck
  }

  // 2. Validasi ukuran berkas
  const sizeCheck = validateReceiptFileSize(file.size)
  if (!sizeCheck.valid) {
    return {
      valid: false,
      fileType: formatCheck.fileType,
      error: sizeCheck.error,
    }
  }

  return {
    valid: true,
    fileType: formatCheck.fileType,
  }
}
