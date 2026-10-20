import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { courses } from './courses'
import { tutors } from './tutors'
import { classMembers } from './class_members'
import { schedules } from './schedules'
import { sessions } from './sessions'
import { materials } from './materials'
import { grades } from './grades'

export const classes = pgTable(
  'classes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
    tutorId: uuid('tutor_id').references(() => tutors.id, { onDelete: 'set null' }),
    className: text('class_name').notNull(),
    academicYear: text('academic_year'),
    capacity: integer('capacity').default(12).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('classes_course_id_idx').on(table.courseId),
    index('classes_tutor_id_idx').on(table.tutorId),
  ]
)

export const classesRelations = relations(classes, ({ one, many }) => ({
  course: one(courses, {
    fields: [classes.courseId],
    references: [courses.id],
  }),
  tutor: one(tutors, {
    fields: [classes.tutorId],
    references: [tutors.id],
  }),
  members: many(classMembers),
  schedules: many(schedules),
  sessions: many(sessions),
  materials: many(materials),
  grades: many(grades),
}))
