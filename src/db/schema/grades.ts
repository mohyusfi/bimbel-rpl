import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { students } from './students'
import { classes } from './classes'
import { tutors } from './tutors'

export const grades = pgTable(
  'grades',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    tutorId: uuid('tutor_id').references(() => tutors.id, { onDelete: 'set null' }),
    subjectName: text('subject_name').notNull(),
    assessmentTitle: text('assessment_title').notNull(),
    category: text('category').notNull(), // 'Try Out' | 'Kuis' | 'Tugas'
    score: integer('score').notNull(), // 0 - 100
    classAverage: integer('class_average'),
    tutorFeedback: text('tutor_feedback'),
    assessmentDate: text('assessment_date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('grades_student_id_idx').on(table.studentId),
    index('grades_class_id_idx').on(table.classId),
    index('grades_tutor_id_idx').on(table.tutorId),
    index('grades_category_idx').on(table.category),
    index('grades_assessment_title_idx').on(table.assessmentTitle),
  ]
)

export const gradesRelations = relations(grades, ({ one }) => ({
  student: one(students, {
    fields: [grades.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [grades.classId],
    references: [classes.id],
  }),
  tutor: one(tutors, {
    fields: [grades.tutorId],
    references: [tutors.id],
  }),
}))
