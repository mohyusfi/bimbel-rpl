import { pgTable, uuid, text, integer, timestamp, index, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { students } from './students'
import { payments } from './payments'

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
    programName: varchar('program_name', { length: 255 }).notNull(),
    description: text('description'),
    amount: integer('amount').notNull(),
    dueDate: varchar('due_date', { length: 50 }).notNull(),
    status: varchar('status', { length: 30 }).default('belum_dibayar').notNull(),
    rejectedReason: text('rejected_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('invoices_student_id_idx').on(table.studentId),
    index('invoices_status_idx').on(table.status),
    index('invoices_invoice_number_idx').on(table.invoiceNumber),
    index('invoices_due_date_idx').on(table.dueDate),
    index('invoices_created_at_idx').on(table.createdAt),
    index('invoices_student_status_idx').on(table.studentId, table.status),
  ]
)

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  student: one(students, {
    fields: [invoices.studentId],
    references: [students.id],
  }),
  payments: many(payments),
}))
