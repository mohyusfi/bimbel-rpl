import * as React from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase/client'
import { ADMIN_KEYS } from '~/hooks/use-admin-data'
import { adminStore, type AdminNotification } from '~/lib/admin-store'
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeNotificationsOptions {
  userId?: string | null
  role?: 'admin' | 'tutor' | 'student' | 'parent'
  userEmail?: string
  childIds?: string[]
  relevantUserIds?: string[]
  client?: SupabaseClient
  enabled?: boolean
  queryClient?: QueryClient
  onNotification?: (notification: any) => void
  autoInvalidate?: boolean
}

export type UseRealtimeNotificationsOptions = RealtimeNotificationsOptions

export interface UseRealtimeNotificationsReturn {
  notifications: AdminNotification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void> | void
  markAllAsRead: () => Promise<void> | void
  isConnected: boolean
  getActiveChannels: () => RealtimeChannel[]
  subscriptionEngine?: typeof setupRealtimeNotifications
}

export interface RealtimeNotificationsSubscription {
  channels: RealtimeChannel[]
  unsubscribe: () => void
}

export function notificationDedupKey(n: AdminNotification): string | null {
  const announcementId =
    (n.metadata?.announcementId as string) ||
    (n.type === 'announcement' ? n.id : null)
  if (announcementId) return `announcement:${announcementId}`

  const invoiceId = n.metadata?.invoiceId as string | undefined
  if (invoiceId) {
    const roles = Array.isArray(n.metadata?.targetRoles)
      ? [...(n.metadata?.targetRoles as string[])].sort().join('|')
      : ''
    return `invoice:${invoiceId}:${roles || 'any'}`
  }

  return null
}

export function mergeNotificationSources(
  inbox: AdminNotification[],
  live: AdminNotification[]
): AdminNotification[] {
  const byKey = new Map<string, AdminNotification>()

  for (const n of live) {
    byKey.set(n.id, n)
  }

  for (const row of inbox) {
    const rowKey = notificationDedupKey(row)
    let wasReadLocally = false

    if (rowKey) {
      for (const [key, existing] of Array.from(byKey.entries())) {
        if (notificationDedupKey(existing) === rowKey) {
          if (existing.isRead) wasReadLocally = true
          byKey.delete(key)
        }
      }
    }

    const directExisting = byKey.get(row.id)
    if (directExisting?.isRead) wasReadLocally = true

    byKey.set(row.id, {
      ...row,
      isRead: wasReadLocally || Boolean(row.isRead),
      __inbox: true,
    } as AdminNotification)
  }

  return Array.from(byKey.values())
}

/**
 * Membuat queryFn TanStack Query untuk kotak masuk lonceng: memuat notifikasi
 * persisten milik pengguna dari Supabase lalu menggabungkannya dengan notifikasi
 * realtime yang sedang ada di store. Bila server tidak terjangkau, fallback ke store.
 */
export function createNotificationQueryFn(
  options: RealtimeNotificationsOptions
): () => Promise<AdminNotification[]> {
  return async () => {
    const live = adminStore.getState().notifications
    const userIds = Array.from(
      new Set(
        [options.userId, ...(options.relevantUserIds || []), ...(options.childIds || [])]
          .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
          .map((v) => v.trim())
      )
    )

    try {
      const { getNotificationInboxFn } = await import(
        '~/server/functions/notification-inbox'
      )
      const res = await getNotificationInboxFn({
        data: { userIds, email: options.userEmail },
      })
      if (res.success && Array.isArray(res.data)) {
        return mergeNotificationSources(res.data as AdminNotification[], live)
      }
    } catch (err) {
      console.warn('[WARN] Gagal memuat kotak masuk notifikasi dari server:', err)
    }

    return live
  }
}

/**
 * Core engine for establishing Supabase Realtime channel subscriptions
 * for notifications and announcements.
 *
 * Subscribes to:
 * 1. `broadcast:announcements` for global bimbel announcements.
 * 2. `user-notifications:${userId}` for targeted personal notifications.
 *
 * Returns an unsubscribe cleanup function that guarantees zero connection leaks.
 */
export function setupRealtimeNotifications(
  options: RealtimeNotificationsOptions = {}
): RealtimeNotificationsSubscription {
  const {
    userId,
    client = supabase,
    enabled = true,
    queryClient,
    onNotification,
  } = options

  if (!enabled || !client || typeof client.channel !== 'function') {
    return {
      channels: [],
      unsubscribe: () => {},
    }
  }

  const channels: RealtimeChannel[] = []

  const handleIncomingNotification = (payload: any) => {
    // Persist into adminStore if payload contains notification details
    const notifData = payload?.new || payload?.payload || payload
    let addedNotif: AdminNotification | null = null

    if (notifData && typeof notifData === 'object' && notifData.title) {
      let meta = notifData.metadata
      if (typeof meta === 'string') {
        try {
          meta = JSON.parse(meta)
        } catch {}
      }

      const currentNotifications = adminStore.getState().notifications
      const annId =
        meta?.announcementId ||
        (notifData.type === 'announcement' ? notifData.id : null)

      const isDuplicate = currentNotifications.some((n) => {
        if (notifData.id && n.id === notifData.id) return true
        if (annId) {
          let existingMeta = n.metadata
          if (typeof existingMeta === 'string') {
            try {
              existingMeta = JSON.parse(existingMeta)
            } catch {}
          }
          const existingAnnId =
            existingMeta?.announcementId || (n.type === 'announcement' ? n.id : null)
          if (existingAnnId === annId) return true
        }
        // Deduplikasi hanya berdasarkan title+message yang benar-benar identik
        // (bukan berdasarkan type=announcement saja, karena bisa memblok notif untuk role berbeda)
        if (n.title === notifData.title && n.message === notifData.message && !annId) {
          return true
        }
        return false
      })

      if (!isDuplicate) {
        addedNotif = adminStore.addNotification({
          id: notifData.id,
          userId: notifData.userId || notifData.user_id,
          title: notifData.title,
          message: notifData.message || '',
          type: notifData.type || 'general',
          linkUrl: notifData.linkUrl || notifData.link_url,
          metadata: meta || notifData.metadata,
        })
      }
    }

    // Invalidate TanStack Query caches if queryClient is available
    if (queryClient && typeof queryClient.invalidateQueries === 'function') {
      const notifType = notifData?.type || payload?.type
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.notifications })

      if (notifType === 'attendance') {
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.attendanceSessions })
      } else if (notifType === 'billing' || notifType === 'payment') {
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.invoices })
      } else if (notifType === 'academic') {
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.gradeRecords })
      } else if (notifType === 'announcement') {
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.announcements })
        queryClient.invalidateQueries({ queryKey: ['portal-announcements'] })
      }

      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    }

    if (typeof onNotification === 'function') {
      try {
        onNotification(addedNotif || notifData || payload)
      } catch (err) {
        console.error('Error in onNotification callback:', err)
      }
    }
  }

  // 1. Channel broadcast:announcements
  if (typeof client.getChannels === 'function') {
    const existing = client.getChannels().find((c) => c.topic === 'realtime:broadcast:announcements')
    if (existing && typeof client.removeChannel === 'function') {
      try {
        client.removeChannel(existing)
      } catch {}
    }
  }

  const broadcastChannel = client.channel('broadcast:announcements')
  broadcastChannel
    .on('broadcast', { event: 'announcement' }, handleIncomingNotification)
    .on('broadcast', { event: 'announcement_deleted' }, (payload: any) => {
      const annId =
        payload?.payload?.announcementId ||
        payload?.payload?.id ||
        payload?.announcementId ||
        payload?.id
      if (annId) {
        adminStore.deleteAnnouncement(annId)
      }
      queryClient?.invalidateQueries({ queryKey: ADMIN_KEYS.announcements })
      queryClient?.invalidateQueries({ queryKey: ['portal-announcements'] })
    })
    .on('broadcast', { event: 'notification' }, handleIncomingNotification)
    .subscribe()

  channels.push(broadcastChannel)

  // 2. Channel user-notifications:${userId} (only for valid non-empty string userId)
  if (userId && typeof userId === 'string' && userId.trim() !== '') {
    const cleanUserId = userId.trim()
    if (typeof client.getChannels === 'function') {
      const existingUserCh = client.getChannels().find((c) => c.topic === `realtime:user-notifications:${cleanUserId}`)
      if (existingUserCh && typeof client.removeChannel === 'function') {
        try {
          client.removeChannel(existingUserCh)
        } catch {}
      }
    }

    const userChannel = client.channel(`user-notifications:${cleanUserId}`)
    userChannel
      .on('broadcast', { event: 'notification' }, handleIncomingNotification)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${cleanUserId}`,
        },
        handleIncomingNotification
      )
      .subscribe()

    channels.push(userChannel)
  }

  const unsubscribe = () => {
    channels.forEach((ch) => {
      try {
        if (typeof client.removeChannel === 'function') {
          client.removeChannel(ch)
        }
      } catch (e) {
        console.warn('Error removing realtime channel:', e)
      }
    })
    channels.length = 0
  }

  return {
    channels,
    unsubscribe,
  }
}

/**
 * React hook to manage real-time notifications via Supabase Realtime channels.
 * Invokes `client.removeChannel(channel)` on unmount to ensure zero connection leaks.
 */
export function useRealtimeNotifications(
  userIdOrOptions?: string | null | RealtimeNotificationsOptions
) {
  const queryClient = useQueryClient()

  const options: RealtimeNotificationsOptions =
    typeof userIdOrOptions === 'string' || userIdOrOptions === null || userIdOrOptions === undefined
      ? { userId: userIdOrOptions ?? undefined }
      : userIdOrOptions

  const {
    userId,
    role,
    userEmail,
    childIds,
    relevantUserIds,
    client = supabase,
    enabled = true,
    onNotification,
  } = options

  const activeChannelsRef = React.useRef<RealtimeChannel[]>([])
  const [isConnected, setIsConnected] = React.useState(false)

  // Subscribe to adminStore updates
  React.useEffect(() => {
    let prevCount = adminStore.getState().notifications.length
    const unsubscribeStore = adminStore.subscribe(() => {
      const currentCount = adminStore.getState().notifications.length
      // Invalidate query hanya jika ada notifikasi baru masuk atau dihapus
      // Mencegah refetch storm yang memicu latensi saat menandai notifikasi telah dibaca
      if (currentCount !== prevCount) {
        prevCount = currentCount
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.notifications })
      }
    })
    return unsubscribeStore
  }, [queryClient])

  // Realtime subscription lifecycle
  React.useEffect(() => {
    const subscription = setupRealtimeNotifications({
      userId,
      client,
      enabled,
      queryClient,
      onNotification,
    })

    activeChannelsRef.current = subscription.channels
    setIsConnected(subscription.channels.length > 0)

    return () => {
      subscription.unsubscribe()
      activeChannelsRef.current = []
      setIsConnected(false)
    }
  }, [userId, client, enabled, queryClient, onNotification])

  // Query notifications from DB inbox (persistent) merged with the realtime store
  const { data: allNotifications = [] } = useQuery<AdminNotification[]>({
    queryKey: ADMIN_KEYS.notifications,
    queryFn: createNotificationQueryFn({
      userId,
      role,
      userEmail,
      childIds,
      relevantUserIds,
    }),
  })

  const notifications = React.useMemo(() => {
    return allNotifications.filter((n) => {
      const declaredRoles = n.metadata?.targetRoles
      if (
        role &&
        Array.isArray(declaredRoles) &&
        declaredRoles.length > 0 &&
        !declaredRoles.includes(role)
      ) {
        return false
      }

      // 1. If role is explicitly provided
      if (role === 'admin') {
        // Exclude role-specific personal notifications intended for other roles
        if (n.type === 'announcement') {
          const target =
            n.metadata?.targetAudience || (n as any).targetAudience || 'Semua'
          // Sembunyikan dari drawer admin jika pengumuman khusus audiens siswa, wali, atau tutor
          if (target !== 'Semua' && target !== 'Admin') {
            return false
          }
          const recipientRole = n.metadata?.recipientRole
          if (recipientRole && recipientRole !== 'admin') {
            return false
          }
          if ((n as any).__inbox) {
            return true
          }
          if (
            n.userId &&
            (n.userId.startsWith('stu-') ||
              n.userId.startsWith('par-') ||
              n.userId.startsWith('tut-') ||
              n.userId.startsWith('usr-student') ||
              n.userId.startsWith('usr-parent') ||
              n.userId.startsWith('usr-tutor'))
          ) {
            return false
          }
        }
        return true
      }

      if (role === 'student' || role === 'parent' || role === 'tutor') {
        // Exclude admin-specific operational notifications
        if (n.type === 'registration') return false
        if (n.type === 'payment' && !n.userId && !n.metadata?.studentId && !n.metadata?.parentId) return false

        // User-specific IDs resolution
        const idsToMatch = new Set<string>()
        if (userId) idsToMatch.add(userId)
        if (relevantUserIds) relevantUserIds.forEach((id) => idsToMatch.add(id))

        if (role === 'student') {
          // Add standard demo aliases for Fahri Ramadhan
          idsToMatch.add('stu-1')
          idsToMatch.add('d992d9fc-6f5b-434f-998b-358e54a754b7')
          idsToMatch.add('943d2c13-0a7f-4e5d-b00d-a930e5bbbfdc')
        }

        if (role === 'parent') {
          // Add standard demo aliases for Ahmad Dahlan
          idsToMatch.add('par-1')
          idsToMatch.add('ec6f75cb-887a-442b-b91d-f47f9afc5ab8')
        }

        if (role === 'tutor') {
          idsToMatch.add('tut-1')
          idsToMatch.add('1dc75962-7771-4c58-85af-5ce40c2eabae')
        }

        // Broadcast announcements are filtered by target audience and role isolation
        if (n.type === 'announcement') {
          const target =
            n.metadata?.targetAudience || (n as any).targetAudience || 'Semua'
          const recipientRole = n.metadata?.recipientRole

          // Must match audience target
          if (target === 'Siswa' && role !== 'student') return false
          if (target === 'Orang Tua' && role !== 'parent') return false
          if (target === 'Tutor' && role !== 'tutor') return false

          // If a specific recipientRole is tagged, must match this role
          if (recipientRole && recipientRole !== role) return false

          // Baris dari kotak masuk DB sudah ter-scope ke pengguna ini
          if ((n as any).__inbox) return true

          // If targeted to a specific user, ensure user ID matches
          if (n.userId && idsToMatch.size > 0 && !idsToMatch.has(n.userId)) {
            return false
          }

          return true
        }

        // Baris dari kotak masuk DB sudah ter-scope ke pengguna ini
        if ((n as any).__inbox) return true

        if (idsToMatch.size > 0) {
          const directMatch =
            (n.userId && idsToMatch.has(n.userId)) ||
            (n.metadata?.studentId && idsToMatch.has(n.metadata.studentId)) ||
            (n.metadata?.parentId && idsToMatch.has(n.metadata.parentId))

          if (directMatch) return true

          // Check child IDs for parent (multi-child)
          if (role === 'parent' && childIds && childIds.length > 0) {
            const childSet = new Set(childIds)
            if (n.userId && childSet.has(n.userId)) return true
            if (n.metadata?.studentId && childSet.has(n.metadata.studentId)) return true
          }

          // If targetRoles in metadata explicitly targets this role and no conflicting user
          if (n.metadata?.targetRoles && Array.isArray(n.metadata.targetRoles)) {
            if (n.metadata.targetRoles.includes(role)) {
              if (role === 'student' && (!n.userId || idsToMatch.has('stu-1') || n.metadata?.studentId === 'stu-1')) return true
              if (role === 'parent' && (!n.userId || idsToMatch.has('par-1') || n.metadata?.parentId === 'par-1')) return true
            }
          }

          return false
        }

        // If userId not yet resolved, show student/academic domain notifications only
        return n.type === 'academic' || n.type === 'attendance' || n.type === 'schedule' || n.type === 'billing'
      }

      // 2. Default behavior (when role is omitted, preserving backwards compatibility)
      if (!userId) return true
      return (
        !n.userId ||
        n.userId === userId ||
        n.metadata?.studentId === userId ||
        n.metadata?.parentId === userId
      )
    })
  }, [allNotifications, userId, role, childIds, relevantUserIds])

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  const markAsRead = React.useCallback(
    async (id: string) => {
      const targetNotif = notifications.find((n) => n.id === id)
      const annId = targetNotif?.metadata?.announcementId as string | undefined

      // 1. Optimistic update di TanStack Query cache (0ms latency di UI)
      queryClient.setQueryData<AdminNotification[]>(ADMIN_KEYS.notifications, (prev) => {
        if (!prev) return []
        return prev.map((n) => {
          if (n.id === id || (annId && n.metadata?.announcementId === annId)) {
            return { ...n, isRead: true }
          }
          return n
        })
      })

      // 2. Tandai di store lokal
      adminStore.markNotificationRead(id, annId)

      // 3. Persist update di database via Server Function (hanya spesifik notifikasi ini)
      try {
        const { markNotificationsReadFn } = await import(
          '~/server/functions/notification-inbox'
        )

        await markNotificationsReadFn({
          data: {
            all: false,
            notificationIds: [id],
            announcementIds: annId ? [annId] : undefined,
            email: userEmail,
          },
        })
      } catch (err) {
        console.warn('[WARN] Gagal update status is_read notifikasi di server:', err)
      }
    },
    [notifications, queryClient, userEmail]
  )

  const markAllAsRead = React.useCallback(async () => {
    // 1. Kumpulkan seluruh notifikasi unread yang tampil di portal ini
    const unreadTargetIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
    if (unreadTargetIds.length === 0) return

    const targetIdSet = new Set(unreadTargetIds)

    const unreadAnnouncementIds = notifications
      .filter((n) => !n.isRead && (n.type === 'announcement' || n.metadata?.announcementId))
      .map((n) => (n.metadata?.announcementId as string) || n.id)
      .filter((id): id is string => typeof id === 'string' && id.trim() !== '')

    // 2. Optimistic update instan di TanStack Query cache (0ms latency, UI langsung bersih)
    queryClient.setQueryData<AdminNotification[]>(ADMIN_KEYS.notifications, (prev) => {
      if (!prev) return []
      return prev.map((n) => {
        if (targetIdSet.has(n.id) || (userId && n.userId === userId)) {
          return { ...n, isRead: true }
        }
        return n
      })
    })

    // 3. Update store lokal dalam 1x panggilan batch (mencegah O(N) re-render cascade)
    adminStore.markAllNotificationsRead(
      userId || undefined,
      unreadTargetIds,
      unreadAnnouncementIds
    )

    // 4. Persist update is_read = true di database via Server Function (bulk mark all)
    try {
      const { markNotificationsReadFn } = await import(
        '~/server/functions/notification-inbox'
      )
      const allUserIds = Array.from(
        new Set(
          [userId, ...(relevantUserIds || []), ...(childIds || [])]
            .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
            .map((v) => v.trim())
        )
      )
      const res = await markNotificationsReadFn({
        data: {
          all: true,
          userIds: allUserIds,
          email: userEmail,
          notificationIds: unreadTargetIds,
          announcementIds: unreadAnnouncementIds,
        },
      })
      if (res?.success) {
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.notifications })
      }
    } catch (err) {
      console.warn('[WARN] Gagal update status markAllAsRead di server:', err)
    }
  }, [childIds, notifications, queryClient, relevantUserIds, userEmail, userId])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
    getActiveChannels: () => activeChannelsRef.current,
    subscriptionEngine: setupRealtimeNotifications,
  }
}
