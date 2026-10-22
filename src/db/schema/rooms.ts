import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { schedules } from './schedules'
import { sessions } from './sessions'

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomName: text('room_name').notNull(),
    capacity: integer('capacity').default(12).notNull(),
    facilities: text('facilities'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('rooms_room_name_idx').on(table.roomName),
    index('rooms_is_active_idx').on(table.isActive),
  ]
)

export const roomsRelations = relations(rooms, ({ many }) => ({
  schedules: many(schedules),
  sessions: many(sessions),
}))

