import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { classes } from './classes'
import { tutors } from './tutors'
import { rooms } from './rooms'
import { sessions } from './sessions'

export const schedules = pgTable(
  'schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    subjectName: text('subject_name').default('Sesi Bimbingan'),
    tutorId: uuid('tutor_id').references(() => tutors.id, { onDelete: 'set null' }),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    dayOfWeek: text('day_of_week').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('schedules_class_id_idx').on(table.classId),
    index('schedules_tutor_id_idx').on(table.tutorId),
    index('schedules_room_id_idx').on(table.roomId),
    index('schedules_day_of_week_idx').on(table.dayOfWeek),
  ]
)

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  class: one(classes, {
    fields: [schedules.classId],
    references: [classes.id],
  }),
  tutor: one(tutors, {
    fields: [schedules.tutorId],
    references: [tutors.id],
  }),
  room: one(rooms, {
    fields: [schedules.roomId],
    references: [rooms.id],
  }),
  sessions: many(sessions),
}))
