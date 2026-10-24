import * as React from 'react'
import {
  getVapidPublicKeyFn,
  savePushSubscriptionFn,
  removePushSubscriptionFn,
} from '~/server/functions/push-notifications'

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const decode =
    typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob.bind(window)
      : typeof atob === 'function'
        ? atob
        : (str: string) => Buffer.from(str, 'base64').toString('binary')

  const rawData = decode(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export interface UseWebPushReturn {
  isSupported: boolean
  permission: NotificationPermission | 'unsupported'
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  subscribeToPush: (userId: string, extraUserIds?: string[]) => Promise<boolean>
  unsubscribeFromPush: () => Promise<boolean>
}

export function useWebPush(): UseWebPushReturn {
  const [isSupported, setIsSupported] = React.useState(false)
  const [permission, setPermission] = React.useState<
    NotificationPermission | 'unsupported'
  >('unsupported')
  const [isSubscribed, setIsSubscribed] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)

    if (supported) {
      const currentPerm = Notification.permission
      setPermission(currentPerm)

      // Periksa apakah service worker dan subscription aktif sudah ada
      if (typeof navigator.serviceWorker.getRegistration === 'function') {
        navigator.serviceWorker
          .getRegistration()
          .then(async (reg) => {
            if (!reg && currentPerm === 'granted') {
              try {
                reg = await navigator.serviceWorker.register('/sw.js')
              } catch (e) {
                // ignore
              }
            }
            if (reg && reg.pushManager) {
              const sub = await reg.pushManager.getSubscription()
              setIsSubscribed(Boolean(sub))
            } else {
              setIsSubscribed(false)
            }
          })
          .catch(() => {
            setIsSubscribed(false)
          })
      }
    }
  }, [])

  const subscribeToPush = React.useCallback(
    async (userId: string, extraUserIds?: string[]): Promise<boolean> => {
      if (!isSupported) {
        setError('Peramban Anda tidak mendukung Web Push Notification.')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        // 1. Minta izin peramban
        const perm = await Notification.requestPermission()
        setPermission(perm)

        if (perm !== 'granted') {
          setError('Izin notifikasi peramban tidak diberikan.')
          setIsLoading(false)
          return false
        }

        // 2. Ambil VAPID Public Key
        let vapidPublicKey = ''
        try {
          const res = await getVapidPublicKeyFn()
          vapidPublicKey = res.publicKey
        } catch (e) {
          vapidPublicKey =
            (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY || ''
        }

        if (!vapidPublicKey) {
          throw new Error('VAPID Public Key belum terkonfigurasi di server.')
        }

        // 3. Daftarkan Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js')
        await (registration as any).update?.().catch?.(() => {})

        // 4. Berlangganan via PushManager
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as any,
          })
        }

        const subJson = subscription.toJSON()
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
          throw new Error('Token push subscription tidak valid.')
        }

        // 5. Simpan ke server untuk userId dan seluruh target alias pengguna
        const targetIds = Array.from(new Set([userId, ...(extraUserIds || [])].filter(Boolean)))
        for (const targetId of targetIds) {
          try {
            await savePushSubscriptionFn({
              data: {
                userId: targetId,
                endpoint: subJson.endpoint,
                keys: {
                  p256dh: subJson.keys.p256dh,
                  auth: subJson.keys.auth,
                },
                userAgent: navigator.userAgent,
              },
            })
          } catch (syncErr) {
            console.warn('[WARN] Gagal sinkron push subscription untuk id:', targetId, syncErr)
          }
        }

        setIsSubscribed(true)
        setIsLoading(false)
        return true
      } catch (err: any) {
        console.error('[ERROR] Gagal berlangganan Web Push:', err)
        setError(err.message || 'Gagal mengaktifkan notifikasi peramban.')
        setIsLoading(false)
        return false
      }
    },
    [isSupported]
  )

  const unsubscribeFromPush = React.useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        try {
          await removePushSubscriptionFn({
            data: { endpoint: subscription.endpoint },
          })
        } catch (e) {
          // Abaikan jika server error saat remove
        }
      }

      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (err: any) {
      console.error('[ERROR] Gagal membatalkan langganan Web Push:', err)
      setError(err.message || 'Gagal menonaktifkan notifikasi.')
      setIsLoading(false)
      return false
    }
  }, [isSupported])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribeToPush,
    unsubscribeFromPush,
  }
}
