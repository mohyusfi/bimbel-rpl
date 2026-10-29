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
 * Mendukung explicit rendering, theme, auto-cleanup, dan fallback test key di dev
 */
export const TurnstileWidget = React.forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  function TurnstileWidget(
    {
      siteKey,
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
            window.turnstile.reset(widgetIdRef.current)
          }
        },
      }),
      []
    )

    React.useEffect(() => {
      let isMounted = true

      const renderWidget = () => {
        if (!containerRef.current || !window.turnstile || !resolvedSiteKey) return

        // Jika widget sudah pernah di-render, jangan render duplikat
        if (widgetIdRef.current) {
          return
        }

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: resolvedSiteKey,
            theme,
            size,
            callback: (token: string) => {
              if (isMounted) {
                onSuccess(token)
              }
            },
            'error-callback': (code: string) => {
              console.warn('[WARN] Turnstile challenge error:', code)
              if (isMounted && onError) {
                onError(code)
              }
            },
            'expired-callback': () => {
              console.warn('[WARN] Turnstile challenge expired')
              if (isMounted && onExpire) {
                onExpire()
              }
            },
          })
          widgetIdRef.current = id
        } catch (err: any) {
          console.error('[ERROR] Gagal merender widget Turnstile:', err?.message)
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
        script.onload = () => {
          if (isMounted) {
            renderWidget()
          }
        }
        script.onerror = () => {
          console.error('[ERROR] Gagal memuat script Turnstile Cloudflare')
          if (isMounted && onError) {
            onError('SCRIPT_LOAD_FAILED')
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
    }, [resolvedSiteKey, theme, size, onSuccess, onError, onExpire])

    return (
      <div
        ref={containerRef}
        className={`min-h-[65px] flex items-center justify-center my-2 ${className}`}
        data-testid="turnstile-container"
      />
    )
  }
)
