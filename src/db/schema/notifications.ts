import { pgTable, uuid, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './profiles'

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    message: text('message').notNull(),
    type: text('type').notNull(), // 'attendance' | 'billing' | 'academic' | 'announcement' | 'registration' | 'general'
    isRead: boolean('is_read').default(false).notNull(),
    linkUrl: text('link_url'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_type_idx').on(table.type),
    index('notifications_is_read_idx').on(table.isRead),
    index('notifications_created_at_idx').on(table.createdAt),
  ]
)

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
}))
