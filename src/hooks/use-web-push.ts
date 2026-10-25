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

/**
 * Web Push dinonaktifkan sesuai kebutuhan rilis.
 * Hook ini mengembalikan state pasif yang aman tanpa efek samping peramban.
 */
export function useWebPush(): UseWebPushReturn {
  return {
    isSupported: false,
    permission: 'unsupported',
    isSubscribed: false,
    isLoading: false,
    error: null,
    subscribeToPush: async () => false,
    unsubscribeFromPush: async () => false,
  }
}
