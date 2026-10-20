import { pgTable, uuid, text, integer, numeric, timestamp, index, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { invoices } from './invoices'
import { profiles } from './profiles'

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    amountPaid: numeric('amount_paid'),
    transferReceiptFile: text('transfer_receipt_file'),
    proofFileUrl: text('proof_file_url'),
    storagePath: text('storage_path'),
    bankName: varchar('bank_name', { length: 100 }),
    paymentMethod: varchar('payment_method', { length: 100 }).default('Transfer Bank'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    paymentDate: timestamp('payment_date', { withTimezone: true }).defaultNow(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: uuid('verified_by').references(() => profiles.id, { onDelete: 'set null' }),
    receiptNumber: varchar('receipt_number', { length: 50 }).unique(),
    submittedByRole: varchar('submitted_by_role', { length: 20 }), // 'student' | 'parent'
    submittedByName: varchar('submitted_by_name', { length: 255 }),
    status: varchar('status', { length: 30 }).default('menunggu').notNull(), // 'menunggu' | 'lunas' | 'ditolak'
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payments_invoice_id_idx').on(table.invoiceId),
    index('payments_verified_by_idx').on(table.verifiedBy),
    index('payments_receipt_number_idx').on(table.receiptNumber),
    index('payments_submitted_at_idx').on(table.submittedAt),
  ]
)

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  verifiedByProfile: one(profiles, {
    fields: [payments.verifiedBy],
    references: [profiles.id],
  }),
}))
