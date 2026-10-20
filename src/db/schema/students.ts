import { pgTable, uuid, varchar, timestamp, index, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { profiles } from './profiles'
import { parents } from './parents'
import { classMembers } from './class_members'
import { attendances } from './attendances'
import { grades } from './grades'

export const gradeLevelEnum = pgEnum('grade_level', ['SD', 'SMP', 'SMA', 'ALUMNI'])
export const packageCodeEnum = pgEnum('package_code', ['UTBK', 'SMA', 'SMP', 'SD'])
export const studentStatusEnum = pgEnum('student_status', ['aktif', 'nonaktif'])

export const students = pgTable(
  'students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id')
      .references(() => parents.id, { onDelete: 'set null' }),
    nis: varchar('nis', { length: 50 }).notNull().unique(),
    originSchool: varchar('origin_school', { length: 255 }).notNull(),
    gradeLevel: gradeLevelEnum('grade_level').notNull(),
    packageCode: packageCodeEnum('package_code').notNull(),
    status: studentStatusEnum('status').default('aktif').notNull(),
    classId: uuid('class_id'),
    joinDate: timestamp('join_date', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('students_profile_id_idx').on(table.profileId),
    index('students_parent_id_idx').on(table.parentId),
    index('students_nis_idx').on(table.nis),
    index('students_status_idx').on(table.status),
  ]
)

export const studentsRelations = relations(students, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [students.profileId],
    references: [profiles.id],
  }),
  parent: one(parents, {
    fields: [students.parentId],
    references: [parents.id],
  }),
  classMembers: many(classMembers),
  attendances: many(attendances),
  grades: many(grades),
}))
