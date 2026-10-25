import { supabase } from '~/lib/supabase/client'

export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export interface InboxNotification {
  id: string
  userId?: string
  title: string
  message: string
  type: string
  linkUrl?: string
  isRead: boolean
  metadata?: Record<string, any>
  createdAt?: string
  timestamp: string
}

export interface NotificationInboxQuery {
  userIds?: string[]
  email?: string
}

export interface MarkNotificationReadInput {
  all?: boolean
  notificationIds?: string[]
  announcementIds?: string[]
  userIds?: string[]
  email?: string
}

interface NotificationRow {
  id: string
  user_id: string | null
  title: string | null
  message: string | null
  type: string | null
  link_url: string | null
  is_read: boolean | null
  metadata: Record<string, any> | null
  created_at: string | null
}

let cachedInboxClient: unknown = null
let cachedInboxClientExpiresAt = 0

export function resetInboxDbClientCache() {
  cachedInboxClient = null
  cachedInboxClientExpiresAt = 0
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

async function getInboxDbClient() {
  if (cachedInboxClient && Date.now() < cachedInboxClientExpiresAt) {
    return cachedInboxClient
  }
  try {
    const { getIsolatedAdminClient } = await import('./billing.service')
    cachedInboxClient = await getIsolatedAdminClient()
    cachedInboxClientExpiresAt = Date.now() + 10 * 60 * 1000
    return cachedInboxClient
  } catch {
    return supabase
  }
}

/**
 * Memuat kotak masuk notifikasi (lonceng) milik seorang pengguna langsung dari
 * tabel `notifications`. Sumber data ini wajib ada karena store in-memory hanya
 * berisi event realtime sesi berjalan (tidak dipersist).
 */
export const notificationService = {
  async getInbox(
    query: NotificationInboxQuery
  ): Promise<ServerResult<InboxNotification[]>> {
    try {
      const dbClient = (await getInboxDbClient()) as any

      const ids = new Set<string>()
      for (const id of query.userIds || []) {
        // Kolom notifications.user_id bertipe uuid: id legacy non-UUID (par-1, stu-1,
        // tut-1, dst.) membuat PostgREST gagal 400. Saring hanya UUID valid.
        if (typeof id === 'string' && isUuid(id.trim())) ids.add(id.trim())
      }

      if (query.email && query.email.trim() !== '') {
        try {
          const { data: profiles } = await dbClient
            .from('profiles')
            .select('id')
            .eq('email', query.email.trim())
          for (const p of (profiles || []) as Array<{ id?: string }>) {
            if (p?.id && isUuid(p.id)) ids.add(p.id)
          }
        } catch (profileErr) {
          console.warn('[WARN] Gagal resolusi profile_id untuk kotak masuk notifikasi:', profileErr)
        }
      }

      if (ids.size === 0) {
        return { success: true, data: [] }
      }

      const { data, error } = await dbClient
        .from('notifications')
        .select('id, user_id, title, message, type, link_url, is_read, metadata, created_at')
        .in('user_id', Array.from(ids))
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        throw error
      }

      const rows: InboxNotification[] = ((data || []) as NotificationRow[])
        .filter((row) => {
          if (row.type === 'announcement_deleted') return false
          const meta = row.metadata
          if (meta && (meta as { isDeleted?: boolean }).isDeleted) return false
          return true
        })
        .map((row) => ({
          id: row.id,
          userId: row.user_id || undefined,
          title: row.title || '',
          message: row.message || '',
          type: row.type || 'general',
          linkUrl: row.link_url || undefined,
          isRead: Boolean(row.is_read),
          metadata: row.metadata || undefined,
          createdAt: row.created_at || undefined,
          timestamp: row.created_at || 'Baru saja',
        }))

      return { success: true, data: rows }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat kotak masuk notifikasi.'
      return { success: false, error: msg }
    }
  },

  async markAsRead(
    input: MarkNotificationReadInput
  ): Promise<ServerResult<{ count: number }>> {
    try {
      const dbClient = (await getInboxDbClient()) as any

      const userIds = new Set<string>()
      for (const id of input.userIds || []) {
        if (typeof id === 'string' && isUuid(id.trim())) {
          userIds.add(id.trim())
        }
      }

      if (input.email && input.email.trim() !== '') {
        try {
          const { data: profiles } = await dbClient
            .from('profiles')
            .select('id')
            .eq('email', input.email.trim())
          for (const p of (profiles || []) as Array<{ id?: string }>) {
            if (p?.id && isUuid(p.id)) userIds.add(p.id)
          }
        } catch (profileErr) {
          console.warn('[WARN] Gagal resolusi profile_id untuk markAsRead:', profileErr)
        }
      }

      const notifIds = new Set<string>()
      const announcementIds = new Set<string>()

      for (const rawId of input.notificationIds || []) {
        if (typeof rawId !== 'string') continue
        const id = rawId.trim()
        if (isUuid(id)) {
          notifIds.add(id)
        } else {
          announcementIds.add(id)
          if (id.startsWith('notif-ann-')) {
            const stripped = id.replace(/^notif-ann-/, '')
            const parts = stripped.split('-')
            if (parts.length >= 2) {
              announcementIds.add(`${parts[0]}-${parts[1]}`)
            }
          }
        }
      }

      for (const annId of input.announcementIds || []) {
        if (typeof annId === 'string' && annId.trim()) {
          announcementIds.add(annId.trim())
        }
      }

      let updatedCount = 0

      const hasTargetIds = notifIds.size > 0 || announcementIds.size > 0
      const isBulkMarkAll = Boolean(input.all) || !hasTargetIds

      // 1. Update massal berdasarkan user_id (hanya jika secara eksplisit mark all unread)
      if (isBulkMarkAll && userIds.size > 0) {
        const { data, error } = await dbClient
          .from('notifications')
          .update({ is_read: true })
          .in('user_id', Array.from(userIds))
          .eq('is_read', false)
          .select('id')

        if (!error && Array.isArray(data)) {
          updatedCount += data.length
        }
      }

      // 2. Update berdasarkan ID notifikasi spesifik
      if (notifIds.size > 0) {
        const { data, error } = await dbClient
          .from('notifications')
          .update({ is_read: true })
          .in('id', Array.from(notifIds))
          .eq('is_read', false)
          .select('id')

        if (!error && Array.isArray(data)) {
          updatedCount += data.length
        }
      }

      // 3. Update berdasarkan announcementId di metadata jika ID bukan UUID
      for (const annId of Array.from(announcementIds)) {
        let query = dbClient
          .from('notifications')
          .update({ is_read: true })
          .filter('metadata->>announcementId', 'eq', annId)
          .eq('is_read', false)

        if (userIds.size > 0) {
          query = query.in('user_id', Array.from(userIds))
        }

        const { data } = await query.select('id')
        if (Array.isArray(data)) {
          updatedCount += data.length
        }
      }

      return { success: true, data: { count: updatedCount } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status notifikasi.'
      return { success: false, error: msg }
    }
  },
}
