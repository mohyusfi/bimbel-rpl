import { pgTable, uuid, text, numeric, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { classes } from './classes'

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseCode: text('course_code').notNull(),
    courseName: text('course_name').notNull(),
    price: numeric('price').notNull(),
    description: text('description'),
    maxStudents: integer('max_students').default(12).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('courses_course_code_idx').on(table.courseCode),
  ]
)

export const coursesRelations = relations(courses, ({ many }) => ({
  classes: many(classes),
}))
