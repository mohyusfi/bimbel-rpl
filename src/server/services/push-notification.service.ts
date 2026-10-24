import { supabase } from '~/lib/supabase/client'

export interface PushSubscriptionItem {
  id?: string
  userId: string
  endpoint: string
  keys: { p256dh: string; auth: string }
  userAgent?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface SendPushPayload {
  title: string
  message: string
  linkUrl?: string
  tag?: string
}

async function getWebPushClient() {
  if (typeof window !== 'undefined') return null
  try {
    const mod = await import('web-push')
    return (mod as any).default || mod
  } catch (err) {
    console.warn('[WARN] Gagal memuat modul web-push:', err)
    return null
  }
}

// In-memory fallback cache for local dev / tests
const memorySubscriptions: Map<string, PushSubscriptionItem> = new Map()

export const pushNotificationService = {
  // Clear memory cache (useful for testing)
  clearMemorySubscriptions() {
    memorySubscriptions.clear()
  },

  async initVapid(): Promise<boolean> {
    const publicKey = process.env.VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@tadulakocendekia.sch.id'

    if (!publicKey || !privateKey) {
      console.warn('[WARN] VAPID keys belum terkonfigurasi. Push notification dinonaktifkan.')
      return false
    }

    try {
      const client = await getWebPushClient()
      if (!client) return false
      client.setVapidDetails(subject, publicKey, privateKey)
      return true
    } catch (err: any) {
      console.error('[ERROR] Gagal menginisialisasi VAPID details:', err?.message || err)
      return false
    }
  },

  async subscribe(input: {
    userId: string
    endpoint: string
    keys: { p256dh: string; auth: string }
    userAgent?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!input.userId || !input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
        return { success: false, error: 'Data langganan tidak lengkap.' }
      }

      const item: PushSubscriptionItem = {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: input.userId,
        endpoint: input.endpoint,
        keys: input.keys,
        userAgent: input.userAgent || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      memorySubscriptions.set(input.endpoint, item)

      // Sync ke Supabase jika client tersedia
      try {
        if (supabase && typeof supabase.from === 'function') {
          await supabase.from('push_subscriptions').upsert(
            {
              user_id: input.userId,
              endpoint: input.endpoint,
              keys: input.keys,
              user_agent: input.userAgent || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'endpoint' }
          )
        }
      } catch (dbErr) {
        // Fallback silently to memory store for test environments
      }

      return { success: true }
    } catch (err: any) {
      console.error('[ERROR] Gagal menyimpan push subscription:', err)
      return { success: false, error: err.message || 'Gagal menyimpan subscription.' }
    }
  },

  async unsubscribe(endpoint: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!endpoint) return { success: false, error: 'Endpoint tidak valid.' }

      memorySubscriptions.delete(endpoint)

      try {
        if (supabase && typeof supabase.from === 'function') {
          await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
        }
      } catch (dbErr) {
        // Fallback silently to memory store for test environments
      }

      return { success: true }
    } catch (err: any) {
      console.error('[ERROR] Gagal menghapus push subscription:', err)
      return { success: false, error: err.message || 'Gagal menghapus subscription.' }
    }
  },

  async getSubscriptionsForUsers(userIds: string[]): Promise<PushSubscriptionItem[]> {
    if (!userIds || userIds.length === 0) return []

    // 1. Coba ambil dari Supabase
    try {
      if (supabase && typeof supabase.from === 'function') {
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id, user_id, endpoint, keys, user_agent, created_at, updated_at')
          .in('user_id', userIds)

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            endpoint: d.endpoint,
            keys: d.keys,
            userAgent: d.user_agent,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }))
        }
      }
    } catch (dbErr) {
      // Fallback to memory store
    }

    // 2. Ambil dari memory store
    const userSet = new Set(userIds)
    const result: PushSubscriptionItem[] = []
    for (const sub of memorySubscriptions.values()) {
      if (userSet.has(sub.userId)) {
        result.push(sub)
      }
    }
    return result
  },

  async removeStaleSubscriptions(endpoints: string[]): Promise<boolean> {
    if (!endpoints || endpoints.length === 0) return true

    endpoints.forEach((ep) => memorySubscriptions.delete(ep))

    try {
      if (supabase && typeof supabase.from === 'function') {
        await supabase.from('push_subscriptions').delete().in('endpoint', endpoints)
      }
      return true
    } catch (err) {
      console.warn('[WARN] Gagal membersihkan stale subscriptions:', err)
      return false
    }
  },

  async sendToUsers(
    userIds: string[],
    payload: SendPushPayload
  ): Promise<{ deliveredCount: number; failedCount: number }> {
    if (!userIds || userIds.length === 0) {
      return { deliveredCount: 0, failedCount: 0 }
    }

    const isReady = await this.initVapid()
    if (!isReady) {
      return { deliveredCount: 0, failedCount: 0 }
    }

    const client = await getWebPushClient()
    if (!client) {
      return { deliveredCount: 0, failedCount: 0 }
    }

    // Batasi target maksimal 10 penerima per panggilan Vercel serverless
    const targetUserIds = userIds.slice(0, 10)
    const subscriptions = await this.getSubscriptionsForUsers(targetUserIds)

    if (subscriptions.length === 0) {
      return { deliveredCount: 0, failedCount: 0 }
    }

    const stringPayload = JSON.stringify(payload)
    const staleEndpoints: string[] = []
    let deliveredCount = 0
    let failedCount = 0

    // Eksekusi paralel dengan timeout 3000ms
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await client.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys as { p256dh: string; auth: string },
            },
            stringPayload,
            { timeout: 3000 }
          )
          deliveredCount++
        } catch (err: any) {
          failedCount++
          // 410 Gone atau 404 Not Found menandakan pengguna telah mencabut izin notifikasi
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            staleEndpoints.push(sub.endpoint)
          }
        }
      })
    )

    if (staleEndpoints.length > 0) {
      await this.removeStaleSubscriptions(staleEndpoints)
    }

    return { deliveredCount, failedCount }
  },
}
