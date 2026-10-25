import * as React from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase/client'
import { ADMIN_KEYS } from '~/hooks/use-admin-data'
import { adminStore, type AdminNotification } from '~/lib/admin-store'
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeNotificationsOptions {
  userId?: string | null
  role?: 'admin' | 'tutor' | 'student' | 'parent'
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
        // Deduplikasi ketat berdasarkan kesamaan judul dan isi pesan
        if (n.title === notifData.title && (n.message === notifData.message || (n.type === notifData.type && n.type === 'announcement'))) {
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
    const unsubscribeStore = adminStore.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.notifications })
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

  // Query notifications from cache / store
  const { data: allNotifications = [] } = useQuery<AdminNotification[]>({
    queryKey: ADMIN_KEYS.notifications,
    queryFn: () => adminStore.getState().notifications,
  })

  const notifications = React.useMemo(() => {
    return allNotifications.filter((n) => {
      // 1. If role is explicitly provided
      if (role === 'admin') {
        // Exclude role-specific personal notifications intended for other roles
        if (n.type === 'announcement') {
          const recipientRole = n.metadata?.recipientRole
          if (recipientRole && recipientRole !== 'admin') {
            return false
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
          if (
            userId === 'stu-1' ||
            userId === 'd992d9fc-6f5b-434f-998b-358e54a754b7' ||
            (userId && userId.startsWith('usr-student'))
          ) {
            idsToMatch.add('stu-1')
            idsToMatch.add('d992d9fc-6f5b-434f-998b-358e54a754b7')
          }
        }

        if (role === 'parent') {
          // Add standard demo aliases for Ahmad Dahlan
          if (
            userId === 'par-1' ||
            userId === 'ec6f75cb-887a-442b-b91d-f47f9afc5ab8' ||
            (userId && userId.startsWith('usr-parent'))
          ) {
            idsToMatch.add('par-1')
            idsToMatch.add('ec6f75cb-887a-442b-b91d-f47f9afc5ab8')
          }
        }

        if (role === 'tutor') {
          if (userId === 'tut-1' || (userId && userId.startsWith('usr-tutor'))) {
            idsToMatch.add('tut-1')
          }
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

          // Match by user ID if assigned to specific user
          if (n.userId && idsToMatch.size > 0 && !idsToMatch.has(n.userId)) {
            return false
          }

          return true
        }

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
      adminStore.markNotificationRead(id)
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.notifications })

      try {
        if (client && typeof client.from === 'function') {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
          if (isUuid) {
            await client.from('notifications').update({ is_read: true }).eq('id', id)
          } else {
            await client.from('notifications').update({ is_read: true }).filter('metadata->>announcementId', 'eq', id)
          }
        }
      } catch (err) {
        console.warn('[WARN] Gagal update status is_read notifikasi di Supabase:', err)
      }
    },
    [client, queryClient]
  )

  const markAllAsRead = React.useCallback(async () => {
    // 1. Mark all unread notifications visible in this portal as read in local store
    const unreadTargetIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
    unreadTargetIds.forEach((id) => {
      adminStore.markNotificationRead(id)
    })

    // 2. Call adminStore.markAllNotificationsRead only if user is explicitly resolved
    if (userId) {
      adminStore.markAllNotificationsRead(userId)
    }

    queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.notifications })

    // 3. Persist update is_read = true in Supabase database
    try {
      if (client && typeof client.from === 'function') {
        if (userId) {
          await client.from('notifications').update({ is_read: true }).eq('user_id', userId)
        } else if (unreadTargetIds.length > 0) {
          await client.from('notifications').update({ is_read: true }).in('id', unreadTargetIds)
        } else {
          await client.from('notifications').update({ is_read: true }).eq('is_read', false)
        }
      }
    } catch (err) {
      console.warn('[WARN] Gagal update status markAllAsRead di Supabase:', err)
    }
  }, [client, notifications, queryClient, userId])

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
