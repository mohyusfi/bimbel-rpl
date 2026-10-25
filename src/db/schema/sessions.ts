import { pgTable, uuid, text, date, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { schedules } from './schedules'
import { classes } from './classes'
import { tutors } from './tutors'
import { rooms } from './rooms'
import { attendances } from './attendances'

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scheduleId: uuid('schedule_id').references(() => schedules.id, { onDelete: 'cascade' }),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    tutorId: uuid('tutor_id').references(() => tutors.id, { onDelete: 'set null' }),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    sessionDate: date('session_date').notNull(),
    topic: text('topic'),
    isCompleted: boolean('is_completed').default(false).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('sessions_schedule_id_idx').on(table.scheduleId),
    index('sessions_class_id_idx').on(table.classId),
    index('sessions_tutor_id_idx').on(table.tutorId),
    index('sessions_room_id_idx').on(table.roomId),
    index('sessions_session_date_idx').on(table.sessionDate),
  ]
)

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  schedule: one(schedules, {
    fields: [sessions.scheduleId],
    references: [schedules.id],
  }),
  class: one(classes, {
    fields: [sessions.classId],
    references: [classes.id],
  }),
  tutor: one(tutors, {
    fields: [sessions.tutorId],
    references: [tutors.id],
  }),
  room: one(rooms, {
    fields: [sessions.roomId],
    references: [rooms.id],
  }),
  attendances: many(attendances),
}))
