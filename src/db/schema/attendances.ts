import { pgTable, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sessions } from './sessions'
import { students } from './students'

export const attendances = pgTable(
  'attendances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    status: text('status').default('hadir').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('attendances_session_id_idx').on(table.sessionId),
    index('attendances_student_id_idx').on(table.studentId),
    index('attendances_status_idx').on(table.status),
    uniqueIndex('attendances_session_student_unique').on(table.sessionId, table.studentId),
  ]
)

export const attendancesRelations = relations(attendances, ({ one }) => ({
  session: one(sessions, {
    fields: [attendances.sessionId],
    references: [sessions.id],
  }),
  student: one(students, {
    fields: [attendances.studentId],
    references: [students.id],
  }),
}))
