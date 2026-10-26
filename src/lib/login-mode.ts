export type LoginMode = 'demo' | 'production'

/**
 * Mengambil mode halaman login saat ini.
 * Dikendalikan oleh environment variable VITE_LOGIN_MODE (nilai: 'demo' | 'production').
 * Default otomatis: 'demo' pada lingkungan development (npm run dev),
 * dan 'production' pada build produksi (npm run build).
 */
export function getLoginMode(): LoginMode {
  const envVal =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_LOGIN_MODE as string | undefined)
      : typeof process !== 'undefined' && process.env
      ? (process.env.VITE_LOGIN_MODE as string | undefined)
      : undefined

  const clean = envVal?.trim()?.toLowerCase()
  if (clean === 'demo' || clean === 'production') {
    return clean
  }

  const isDev =
    typeof import.meta !== 'undefined' && import.meta.env
      ? Boolean(import.meta.env.DEV)
      : typeof process !== 'undefined' && process.env
      ? process.env.NODE_ENV !== 'production'
      : true

  return isDev ? 'demo' : 'production'
}

/**
 * Menentukan apakah mode demo (cepat dengan pemilih role) aktif.
 */
export function isDemoLogin(): boolean {
  return getLoginMode() === 'demo'
}
