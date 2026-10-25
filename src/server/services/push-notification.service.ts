export interface PushSubscriptionItem {
  id?: string
  userId: string
  userIds?: string[]
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

/**
 * Service Web Push dinonaktifkan untuk menyederhanakan rilis aplikasi.
 * Seluruh pemanggilan menjadi no-op yang aman tanpa operasi database.
 */
export const pushNotificationService = {
  clearMemorySubscriptions() {},

  async initVapid(): Promise<boolean> {
    return false
  },

  async subscribe(_input: {
    userId: string
    extraUserIds?: string[]
    endpoint: string
    keys: { p256dh: string; auth: string }
    userAgent?: string
  }): Promise<{ success: boolean; error?: string }> {
    return { success: true }
  },

  async unsubscribe(_endpoint: string): Promise<{ success: boolean; error?: string }> {
    return { success: true }
  },

  async getSubscriptionsForUsers(_userIds: string[]): Promise<PushSubscriptionItem[]> {
    return []
  },

  async removeStaleSubscriptions(_endpoints: string[]): Promise<boolean> {
    return true
  },

  async sendToUsers(
    _userIds: string[],
    _payload?: SendPushPayload
  ): Promise<{ deliveredCount: number; failedCount: number }> {
    return { deliveredCount: 0, failedCount: 0 }
  },
}
