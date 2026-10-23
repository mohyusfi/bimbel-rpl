/**
 * Validasi Metadata & Berkas Modul Pembelajaran (LEARN-01 / Tiket 04)
 * Sesuai PRD: Berkas legal hanya PDF dan PPTX dengan batas ukuran maksimal 20 MB.
 */

export const MAX_MATERIAL_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB (20,971,520 bytes)

export const ALLOWED_MATERIAL_EXTENSIONS = ['.pdf', '.pptx'] as const
export type AllowedExtension = (typeof ALLOWED_MATERIAL_EXTENSIONS)[number]

export const ALLOWED_MATERIAL_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/wps-office.pptx',
  'application/x-wps-office.pptx',
  'application/kspresentation',
] as const

export interface MaterialValidationResult {
  valid: boolean
  fileType?: 'PDF' | 'PPTX'
  error?: string
}

/**
 * Memvalidasi apakah ekstensi dan mime type berkas sesuai format yang diizinkan (.pdf & .pptx)
 */
export function validateMaterialFormat(
  fileName: string,
  mimeType?: string
): { valid: boolean; fileType?: 'PDF' | 'PPTX'; error?: string } {
  if (!fileName || typeof fileName !== 'string') {
    return { valid: false, error: 'Nama berkas tidak valid.' }
  }

  const lowerName = fileName.trim().toLowerCase()
  const isPdf = lowerName.endsWith('.pdf') || mimeType === 'application/pdf'
  const isPptx =
    lowerName.endsWith('.pptx') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/wps-office.pptx' ||
    mimeType === 'application/x-wps-office.pptx' ||
    mimeType === 'application/kspresentation'

  if (!isPdf && !isPptx) {
    return {
      valid: false,
      error: 'Format berkas tidak didukung. Hanya berkas PDF (.pdf) dan Presentasi (.pptx) yang diizinkan.',
    }
  }

  return {
    valid: true,
    fileType: isPptx ? 'PPTX' : 'PDF',
  }
}

/**
 * Memvalidasi batas ukuran berkas modul (maksimal 20 MB)
 */
export function validateMaterialFileSize(
  sizeInBytes: number
): { valid: boolean; error?: string } {
  if (typeof sizeInBytes !== 'number' || isNaN(sizeInBytes) || sizeInBytes < 0) {
    return { valid: false, error: 'Ukuran berkas tidak valid.' }
  }

  if (sizeInBytes === 0) {
    return { valid: false, error: 'Berkas kosong (0 bytes) tidak dapat diunggah.' }
  }

  if (sizeInBytes > MAX_MATERIAL_FILE_SIZE_BYTES) {
    const sizeMb = (sizeInBytes / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `Ukuran berkas (${sizeMb} MB) melebihi batas maksimum 20 MB yang diizinkan.`,
    }
  }

  return { valid: true }
}

/**
 * Validasi komprehensif berkas materi (format legal + batas ukuran <= 20 MB)
 */
export function validateMaterialFile(file: {
  name: string
  size: number
  type?: string
}): MaterialValidationResult {
  if (!file) {
    return { valid: false, error: 'Berkas materi tidak ditemukan.' }
  }

  // 1. Validasi format berkas
  const formatCheck = validateMaterialFormat(file.name, file.type)
  if (!formatCheck.valid) {
    return formatCheck
  }

  // 2. Validasi ukuran berkas
  const sizeCheck = validateMaterialFileSize(file.size)
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

/**
 * Memformat ukuran byte ke string terbaca manusia (misal: 3.7 MB)
 */
export function formatBytesToReadable(bytes: number): string {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '0 MB'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const val = bytes / Math.pow(k, i)
  return `${val.toFixed(1)} ${sizes[i]}`
}
