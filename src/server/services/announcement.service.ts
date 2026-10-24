import { supabase } from '~/lib/supabase/client'
import { pushNotificationService } from './push-notification.service'

export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export type TargetAudience = 'Semua' | 'Siswa' | 'Orang Tua' | 'Tutor'

export interface CreateAnnouncementInput {
  title: string
  content: string
  targetAudience: TargetAudience
  isPinned?: boolean
  broadcast?: boolean
  author?: string
}

export interface AnnouncementItem {
  id: string
  title: string
  content: string
  targetAudience: TargetAudience
  isPinned: boolean
  author: string
  publishedDate: string
  createdAt?: string
}

export interface AnnouncementFilter {
  targetAudience?: string
  role?: 'admin' | 'student' | 'parent' | 'tutor' | string
}

interface NotificationRowInsert {
  user_id: string
  title: string
  message: string
  type: string
  link_url?: string
  metadata?: Record<string, unknown>
}

// Fallback in-memory cache for server-side testing / offline fallback
const serverAnnouncementCache: Map<string, AnnouncementItem> = new Map()

let cachedAdminClient: any = null
let cachedAdminClientExpiresAt = 0

async function getServerDbClient() {
  if (cachedAdminClient && Date.now() < cachedAdminClientExpiresAt) {
    return cachedAdminClient
  }
  try {
    const { getIsolatedAdminClient } = await import('./billing.service')
    cachedAdminClient = await getIsolatedAdminClient()
    cachedAdminClientExpiresAt = Date.now() + 10 * 60 * 1000
    return cachedAdminClient
  } catch {
    return supabase
  }
}

export const announcementService = {
  /**
   * Menerbitkan pengumuman resmi baru ke Supabase, menyimpannya di riwayat notifikasi,
   * menyiarkan melalui Supabase Realtime, dan mengirimkan Web Push.
   */
  async createAnnouncement(
    input: CreateAnnouncementInput
  ): Promise<ServerResult<AnnouncementItem>> {
    try {
      if (!input.title?.trim() || !input.content?.trim()) {
        return { success: false, error: 'Judul dan isi pengumuman wajib diisi.' }
      }

      const announcementId = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const author = input.author?.trim() || 'Hj. Nuraini, S.Pd'
      const isPinned = Boolean(input.isPinned)
      const broadcast = input.broadcast !== false
      const targetAudience = input.targetAudience || 'Semua'

      const publishedDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date())

      const announcementData: AnnouncementItem = {
        id: announcementId,
        title: input.title.trim(),
        content: input.content.trim(),
        targetAudience,
        isPinned,
        author,
        publishedDate,
        createdAt: new Date().toISOString(),
      }

      // 1. Simpan ke cache memori server
      serverAnnouncementCache.set(announcementId, announcementData)

      // 2. Kumpulkan daftar profile_id penerima berdasarkan target audiens
      const dbClient = await getServerDbClient()
      const targetUserProfiles: Array<{ id: string; role: string }> = []

      // Dapatkan profil dari Supabase atau mock profil
      try {
        const { data: profilesData } = await dbClient
          .from('profiles')
          .select('id, role, email')

        if (profilesData && profilesData.length > 0) {
          for (const p of profilesData) {
            const role = p.role
            if (role === 'admin') {
              targetUserProfiles.push({ id: p.id, role: 'admin' })
            } else if (targetAudience === 'Semua') {
              targetUserProfiles.push({ id: p.id, role })
            } else if (targetAudience === 'Siswa' && role === 'student') {
              targetUserProfiles.push({ id: p.id, role })
            } else if (targetAudience === 'Orang Tua' && role === 'parent') {
              targetUserProfiles.push({ id: p.id, role })
            } else if (targetAudience === 'Tutor' && role === 'tutor') {
              targetUserProfiles.push({ id: p.id, role })
            }
          }
        }
      } catch (profErr) {
        console.warn('[WARN] Gagal query profiles untuk pengumuman:', profErr)
      }

      // Pastikan ada fallback profil demo jika database kosong
      if (targetUserProfiles.length === 0) {
        targetUserProfiles.push({ id: '943d2c13-0a7f-4e5d-b00d-a930e5bbbfdc', role: 'student' })
        targetUserProfiles.push({ id: 'ec6f75cb-887a-442b-b91d-f47f9afc5ab8', role: 'parent' })
        targetUserProfiles.push({ id: '11111111-1111-1111-1111-111111111111', role: 'admin' })
      }

      // 3. Simpan baris notifikasi ke tabel notifications di Supabase
      const notifRows: any[] = []
      const targetUserIds: string[] = []

      for (const recipient of targetUserProfiles) {
        targetUserIds.push(recipient.id)
        let linkUrl = '/admin/pengumuman'
        if (recipient.role === 'student') linkUrl = '/student'
        else if (recipient.role === 'parent') linkUrl = '/parent'
        else if (recipient.role === 'tutor') linkUrl = '/tutor'

        notifRows.push({
          user_id: recipient.id,
          title: announcementData.title,
          message:
            announcementData.content.length > 140
              ? `${announcementData.content.substring(0, 137)}...`
              : announcementData.content,
          type: 'announcement',
          link_url: linkUrl,
          metadata: {
            announcementId,
            targetAudience,
            recipientRole: recipient.role,
            isPinned,
            author,
            publishedDate,
            fullContent: announcementData.content,
          },
        })
      }

      if (notifRows.length > 0) {
        try {
          await dbClient.from('notifications').insert(notifRows)
        } catch (dbErr) {
          console.warn('[WARN] Gagal insert notifikasi pengumuman ke database:', dbErr)
        }
      }

      // 4. Siaran Realtime WebSocket & Web Push
      if (broadcast) {
        // Realtime Broadcast
        try {
          const channel = supabase.channel('broadcast:announcements')
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel
                .send({
                  type: 'broadcast',
                  event: 'announcement',
                  payload: {
                    id: announcementId,
                    title: announcementData.title,
                    message: announcementData.content,
                    type: 'announcement',
                    linkUrl: '/admin/pengumuman',
                    targetAudience,
                    isPinned,
                    author,
                    publishedDate,
                    metadata: {
                      announcementId,
                      targetAudience,
                      isPinned,
                      author,
                      publishedDate,
                    },
                  },
                })
                .then(() => {
                  setTimeout(() => {
                    try {
                      supabase.removeChannel(channel)
                    } catch {}
                  }, 1200)
                })
                .catch((err) => {
                  console.warn('[WARN] Gagal mengirim broadcast announcement:', err)
                  try {
                    supabase.removeChannel(channel)
                  } catch {}
                })
            }
          })
        } catch (broadcastErr) {
          console.warn('[WARN] Realtime broadcast error:', broadcastErr)
        }

        // Web Push Notification
        try {
          if (targetUserIds.length > 0) {
            await pushNotificationService.sendToUsers(targetUserIds, {
              title: `Pengumuman: ${announcementData.title}`,
              message:
                announcementData.content.length > 120
                  ? `${announcementData.content.substring(0, 117)}...`
                  : announcementData.content,
              linkUrl: '/admin/pengumuman',
              tag: `ann-${announcementId}`,
            })
          }
        } catch (pushErr) {
          console.warn('[WARN] Gagal mengirim web push pengumuman:', pushErr)
        }
      }

      return { success: true, data: announcementData }
    } catch (err: any) {
      console.error('[ERROR] Gagal menerbitkan pengumuman:', err)
      return {
        success: false,
        error: err?.message || 'Terjadi kesalahan sistem saat menerbitkan pengumuman.',
      }
    }
  },

  /**
   * Mengambil daftar pengumuman resmi bimbel dari Supabase / adminStore
   * dengan deduplikasi dan penyaringan berdasarkan peran atau target audiens.
   */
  async getAnnouncements(
    filter?: AnnouncementFilter
  ): Promise<ServerResult<AnnouncementItem[]>> {
    try {
      const itemsMap = new Map<string, AnnouncementItem>()

      // 1. Ambil data dari Supabase tabel notifications (type = 'announcement')
      try {
        const dbClient = await getServerDbClient()
        const { data, error } = await dbClient
          .from('notifications')
          .select('*')
          .eq('type', 'announcement')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          for (const row of data) {
            const meta = (row.metadata || {}) as any
            if (meta.isDeleted) continue

            const annId = meta.announcementId || row.id
            const rawTitle = row.title.replace(/^Pengumuman Bimbel:\s*/, '').replace(/^Pengumuman:\s*/, '')
            const targetAud = meta.targetAudience || 'Semua'
            const cached = serverAnnouncementCache.get(annId)
            const isPinned = cached !== undefined ? cached.isPinned : Boolean(meta.isPinned)
            const author = meta.author || 'Hj. Nuraini, S.Pd'
            const publishedDate =
              meta.publishedDate ||
              new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date(row.created_at || Date.now()))

            const content = meta.fullContent || row.message

            // Gunakan key kombinasi title + annId untuk deduplikasi baris ganda
            const dedupKey = annId || rawTitle
            if (!itemsMap.has(dedupKey)) {
              itemsMap.set(dedupKey, {
                id: annId,
                title: rawTitle,
                content,
                targetAudience: targetAud,
                isPinned,
                author,
                publishedDate,
                createdAt: row.created_at,
              })
            }
          }
        }
      } catch (dbErr) {
        console.warn('[WARN] Gagal mengambil pengumuman dari database Supabase:', dbErr)
      }

      // 2. Gabungkan dengan data cache server jika ada pengumuman baru yang belum tersimpan di database
      for (const [key, sa] of serverAnnouncementCache.entries()) {
        if (!itemsMap.has(key)) {
          itemsMap.set(key, sa)
        }
      }

      let announcements = Array.from(itemsMap.values())

      // 3. Filter berdasarkan Role
      if (filter?.role && filter.role !== 'admin') {
        const userRole = filter.role
        announcements = announcements.filter((item) => {
          if (item.targetAudience === 'Semua') return true
          if (userRole === 'student' && item.targetAudience === 'Siswa') return true
          if (userRole === 'parent' && item.targetAudience === 'Orang Tua') return true
          if (userRole === 'tutor' && item.targetAudience === 'Tutor') return true
          return false
        })
      }

      // 4. Filter berdasarkan Target Audiens eksplisit
      if (filter?.targetAudience && filter.targetAudience !== 'ALL') {
        announcements = announcements.filter(
          (item) => item.targetAudience === filter.targetAudience
        )
      }

      // 5. Urutkan: isPinned = true di urutan paling atas, lalu tanggal terbaru
      announcements.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      })

      return { success: true, data: announcements }
    } catch (err: any) {
      console.error('[ERROR] Gagal memuat pengumuman:', err)
      return {
        success: false,
        error: err?.message || 'Terjadi kesalahan sistem saat memuat pengumuman.',
      }
    }
  },

  /**
   * Menyematkan atau melepas sematan (pinned) pengumuman resmi bimbel.
   */
  async togglePinAnnouncement(
    announcementId: string,
    isPinned: boolean
  ): Promise<ServerResult<boolean>> {
    try {
      // 1. Update di cache server
      const cached = serverAnnouncementCache.get(announcementId)
      if (cached) {
        cached.isPinned = isPinned
      }

      // 2. Update di Supabase notifications
      try {
        const dbClient = await getServerDbClient()
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(announcementId)
        let query = dbClient.from('notifications').select('id, metadata')
        if (isUUID) {
          query = query.or(`id.eq.${announcementId},metadata->>announcementId.eq.${announcementId}`)
        } else {
          query = query.filter('metadata->>announcementId', 'eq', announcementId)
        }

        const { data: rows } = await query
        const matchingRows = (rows || []) as Array<{ id: string; metadata?: Record<string, unknown> | null }>

        if (matchingRows.length > 0) {
          await Promise.all(
            matchingRows.map((r) =>
              dbClient
                .from('notifications')
                .update({ metadata: { ...(r.metadata || {}), isPinned } })
                .eq('id', r.id)
            )
          )
        }
      } catch (dbErr) {
        console.warn('[WARN] Gagal update pin di database Supabase:', dbErr)
      }

      return { success: true, data: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status semat pengumuman.'
      return { success: false, error: msg }
    }
  },

  /**
   * Menghapus pengumuman resmi secara permanen dari Supabase dan menyiarkan sinyal realtime.
   */
  async deleteAnnouncement(
    announcementId: string
  ): Promise<ServerResult<boolean>> {
    try {
      // 1. Hapus dari cache server
      serverAnnouncementCache.delete(announcementId)

      // 2. Hapus / Tandai dihapus dari Supabase notifications
      try {
        const dbClient = await getServerDbClient()
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(announcementId)
        let query = dbClient.from('notifications').select('id, metadata')
        if (isUUID) {
          query = query.or(`id.eq.${announcementId},metadata->>announcementId.eq.${announcementId}`)
        } else {
          query = query.filter('metadata->>announcementId', 'eq', announcementId)
        }

        const { data: rows } = await query
        const matchingRows = (rows || []) as Array<{ id: string; metadata?: Record<string, unknown> | null }>

        if (matchingRows.length > 0) {
          const idsToDelete = matchingRows.map((r) => r.id)

          if (idsToDelete.length > 0) {
            // Update type to announcement_deleted and mark isDeleted: true (RLS-safe batch update)
            await dbClient
              .from('notifications')
              .update({
                type: 'announcement_deleted',
                metadata: { isDeleted: true },
              })
              .in('id', idsToDelete)

            // Attempt hard delete if permission allows
            try {
              await dbClient.from('notifications').delete().in('id', idsToDelete)
            } catch {
              // RLS might block DELETE, but soft update above ensures it is excluded
            }
          }
        }
      } catch (dbErr) {
        console.warn('[WARN] Gagal menghapus pengumuman dari database Supabase:', dbErr)
      }

      // 3. Siarkan sinyal realtime bahwa pengumuman telah dihapus
      try {
        const channel = supabase.channel('broadcast:announcements')
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel
              .send({
                type: 'broadcast',
                event: 'announcement_deleted',
                payload: {
                  announcementId,
                  id: announcementId,
                  type: 'announcement_deleted',
                },
              })
              .then(() => {
                setTimeout(() => {
                  try {
                    supabase.removeChannel(channel)
                  } catch {}
                }, 1000)
              })
              .catch(() => {
                try {
                  supabase.removeChannel(channel)
                } catch {}
              })
          }
        })
      } catch (broadcastErr) {
        console.warn('[WARN] Gagal menyiarkan penghapusan pengumuman:', broadcastErr)
      }

      return { success: true, data: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus pengumuman.'
      return { success: false, error: msg }
    }
  },
}
