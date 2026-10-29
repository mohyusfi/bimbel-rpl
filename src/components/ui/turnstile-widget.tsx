import * as React from 'react'

// Official Cloudflare dummy site key for testing (always passes)
const CLOUDFLARE_DUMMY_SITE_KEY = '1x00000000000000000000AA'
const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact' | 'flexible'
          action?: string
          cdata?: string
          callback?: (token: string) => void
          'error-callback'?: (errorCode: string) => void
          'expired-callback'?: () => void
          execution?: 'render' | 'execute'
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
      getResponse: (widgetId?: string) => string | undefined
    }
  }
}

export interface TurnstileWidgetProps {
  siteKey?: string
  action?: string
  onSuccess: (token: string) => void
  onError?: (errorCode?: string) => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
  className?: string
}

export interface TurnstileWidgetRef {
  reset: () => void
}

/**
 * Komponen Client-side Cloudflare Turnstile Widget
 * Mendukung explicit rendering, stabilitas callback ref, penanganan adblock/CORS, dan dev test bypass
 */
export const TurnstileWidget = React.forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  function TurnstileWidget(
    {
      siteKey,
      action,
      onSuccess,
      onError,
      onExpire,
      theme = 'light',
      size = 'normal',
      className = '',
    },
    ref
  ) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const widgetIdRef = React.useRef<string | null>(null)
    const [loadError, setLoadError] = React.useState<string | null>(null)

    // Simpan referensi callback agar tidak memicu unmount/remount effect setiap render
    const callbacksRef = React.useRef({ onSuccess, onError, onExpire })
    React.useEffect(() => {
      callbacksRef.current = { onSuccess, onError, onExpire }
    })

    const resolvedSiteKey =
      siteKey ||
      import.meta.env.VITE_TURNSTILE_SITE_KEY ||
      (import.meta.env.DEV ? CLOUDFLARE_DUMMY_SITE_KEY : '')

    // Expose reset method via imperative handle
    React.useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.reset(widgetIdRef.current)
            } catch {
              // Ignore reset error
            }
          }
        },
      }),
      []
    )

    React.useEffect(() => {
      let isMounted = true

      const renderWidget = () => {
        if (!containerRef.current || !window.turnstile || !resolvedSiteKey) return

        // Jika widget sudah ter-render, hindari duplikasi
        if (widgetIdRef.current) {
          return
        }

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: resolvedSiteKey,
            theme,
            size,
            action,
            callback: (token: string) => {
              if (isMounted) {
                setLoadError(null)
                callbacksRef.current.onSuccess(token)
              }
            },
            'error-callback': (code: string) => {
              console.warn('[WARN] Turnstile challenge error:', code)
              if (isMounted) {
                setLoadError(code)
                callbacksRef.current.onError?.(code)
              }
            },
            'expired-callback': () => {
              console.warn('[WARN] Turnstile challenge expired')
              if (isMounted) {
                callbacksRef.current.onExpire?.()
              }
            },
          })
          widgetIdRef.current = id
        } catch (err: any) {
          console.error('[ERROR] Gagal merender widget Turnstile:', err?.message)
          if (isMounted) {
            setLoadError('RENDER_FAILED')
          }
        }
      }

      // 1. Periksa apakah script sudah ada di DOM
      const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null

      if (!existingScript) {
        const script = document.createElement('script')
        script.id = SCRIPT_ID
        script.src = SCRIPT_URL
        script.async = true
        script.defer = true
        script.crossOrigin = 'anonymous'
        script.onload = () => {
          if (isMounted) {
            renderWidget()
          }
        }
        script.onerror = () => {
          console.warn('[WARN] Script Turnstile Cloudflare terblokir oleh browser atau ekstensi.')
          if (isMounted) {
            setLoadError('SCRIPT_BLOCKED')
            callbacksRef.current.onError?.('SCRIPT_BLOCKED')
          }
        }
        document.head.appendChild(script)
      } else if (window.turnstile) {
        renderWidget()
      } else {
        existingScript.addEventListener('load', renderWidget, { once: true })
      }

      return () => {
        isMounted = false
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            // Ignore removal error on unmount
          }
          widgetIdRef.current = null
        }
      }
    }, [resolvedSiteKey, theme, size]) // Stabil: TIDAK bergantung pada callback function reference

    const handleDevBypass = () => {
      setLoadError(null)
      callbacksRef.current.onSuccess('1x00000000000000000000AA')
    }

    return (
      <div className={`flex flex-col items-center justify-center my-2 ${className}`}>
        <div
          ref={containerRef}
          className="min-h-[65px] flex items-center justify-center"
          data-testid="turnstile-container"
        />

        {import.meta.env.DEV && !loadError && (
          <div className="mt-1 flex items-center justify-center">
            <button
              type="button"
              onClick={handleDevBypass}
              className="text-[11px] text-[#777777] hover:text-[#111111] underline cursor-pointer"
            >
              [Dev: Isi Token Uji Coba Otomatis]
            </button>
          </div>
        )}

        {loadError && (
          <div className="text-center mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 max-w-sm">
            <p className="font-medium">Verifikasi bot terhambat ({loadError})</p>
            <p className="text-[11px] text-red-600 mt-0.5">
              Jika menggunakan Firefox/Brave atau Adblocker, pastikan proteksi pelacak tidak memblokir <code>challenges.cloudflare.com</code>.
            </p>
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={handleDevBypass}
                className="mt-2 text-xs bg-red-600 text-white px-2.5 py-1 rounded hover:bg-red-700 cursor-pointer"
              >
                Gunakan Kunci Uji Coba Dev (Bypass Lokal)
              </button>
            )}
          </div>
        )}
      </div>
    )
  }
)
