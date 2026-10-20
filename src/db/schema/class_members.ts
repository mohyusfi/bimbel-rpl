import { pgTable, uuid, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { classes } from './classes'
import { students } from './students'

export const classMembers = pgTable(
  'class_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('class_members_class_id_idx').on(table.classId),
    index('class_members_student_id_idx').on(table.studentId),
    uniqueIndex('class_members_class_student_unique').on(table.classId, table.studentId),
  ]
)

export const classMembersRelations = relations(classMembers, ({ one }) => ({
  class: one(classes, {
    fields: [classMembers.classId],
    references: [classes.id],
  }),
  student: one(students, {
    fields: [classMembers.studentId],
    references: [students.id],
  }),
}))
