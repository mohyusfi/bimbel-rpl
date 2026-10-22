import * as React from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase/client'
import { ADMIN_KEYS } from '~/hooks/use-admin-data'
import { adminStore, type AdminNotification } from '~/lib/admin-store'
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeNotificationsOptions {
  userId?: string | null
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
      const currentNotifications = adminStore.getState().notifications
      if (!notifData.id || !currentNotifications.some((n) => n.id === notifData.id)) {
        addedNotif = adminStore.addNotification({
          id: notifData.id,
          userId: notifData.userId || notifData.user_id,
          title: notifData.title,
          message: notifData.message || '',
          type: notifData.type || 'general',
          linkUrl: notifData.linkUrl || notifData.link_url,
          metadata: notifData.metadata,
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
  const broadcastChannel = client.channel('broadcast:announcements')
  broadcastChannel
    .on('broadcast', { event: 'announcement' }, handleIncomingNotification)
    .on('broadcast', { event: 'notification' }, handleIncomingNotification)
    .subscribe()

  channels.push(broadcastChannel)

  // 2. Channel user-notifications:${userId} (only for valid non-empty string userId)
  if (userId && typeof userId === 'string' && userId.trim() !== '') {
    const userChannel = client.channel(`user-notifications:${userId.trim()}`)
    userChannel
      .on('broadcast', { event: 'notification' }, handleIncomingNotification)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId.trim()}`,
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
    if (!userId) return allNotifications
    return allNotifications.filter(
      (n) =>
        !n.userId ||
        n.userId === userId ||
        n.metadata?.studentId === userId ||
        n.metadata?.parentId === userId
    )
  }, [allNotifications, userId])

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  const markAsRead = React.useCallback(
    (id: string) => {
      adminStore.markNotificationRead(id)
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.notifications })
    },
    [queryClient]
  )

  const markAllAsRead = React.useCallback(() => {
    adminStore.markAllNotificationsRead(userId ?? undefined)
    queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.notifications })
  }, [queryClient, userId])

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
