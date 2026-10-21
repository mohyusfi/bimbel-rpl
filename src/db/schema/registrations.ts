import { pgTable, uuid, varchar, text, timestamp, index, pgEnum } from 'drizzle-orm/pg-core'
import { packageCodeEnum } from './students'

export const registrationStatusEnum = pgEnum('registration_status', [
  'menunggu',
  'terverifikasi',
  'ditolak',
])

export const registrations = pgTable(
  'registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    registrationNumber: varchar('registration_number', { length: 50 }).unique(),
    studentName: varchar('student_name', { length: 255 }).notNull(),
    studentEmail: varchar('student_email', { length: 255 }).notNull(),
    studentPhone: varchar('student_phone', { length: 50 }).notNull(),
    studentSchool: varchar('student_school', { length: 255 }).notNull(),
    packageCode: packageCodeEnum('package_code').notNull(),
    packageName: varchar('package_name', { length: 255 }).notNull(),
    parentName: varchar('parent_name', { length: 255 }).notNull(),
    parentEmail: varchar('parent_email', { length: 255 }),
    parentPhone: varchar('parent_phone', { length: 50 }).notNull(),
    parentJob: varchar('parent_job', { length: 255 }),
    parentAddress: text('parent_address'),
    status: registrationStatusEnum('status').default('menunggu').notNull(),
    rejectedReason: text('rejected_reason'),
    assignedClassId: uuid('assigned_class_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('registrations_student_email_idx').on(table.studentEmail),
    index('registrations_status_idx').on(table.status),
    index('registrations_created_at_idx').on(table.createdAt),
  ]
)
