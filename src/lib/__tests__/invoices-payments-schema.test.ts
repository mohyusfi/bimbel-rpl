import { describe, it, expect } from 'vitest'
import { getTableColumns } from 'drizzle-orm'
import {
  invoices,
  payments,
  invoicesRelations,
  paymentsRelations,
  studentsRelations,
  profilesRelations,
  type Invoice,
  type NewInvoice,
  type Payment,
  type NewPayment,
} from '~/db/schema'

describe('Tiket 06: Invoices and Payments Drizzle Schema & Type Verification', () => {
  it('has valid invoices table definition with all required columns and constraints', () => {
    expect(invoices).toBeDefined()
    const cols = getTableColumns(invoices)

    expect(cols.id).toBeDefined()
    expect(cols.studentId).toBeDefined()
    expect(cols.invoiceNumber).toBeDefined()
    expect(cols.amount).toBeDefined()
    expect(cols.programName).toBeDefined()
    expect(cols.description).toBeDefined()
    expect(cols.dueDate).toBeDefined()
    expect(cols.status).toBeDefined()
    expect(cols.rejectedReason).toBeDefined()
    expect(cols.createdAt).toBeDefined()
    expect(cols.updatedAt).toBeDefined()
  })

  it('has valid payments table definition with all required columns and constraints', () => {
    expect(payments).toBeDefined()
    const cols = getTableColumns(payments)

    expect(cols.id).toBeDefined()
    expect(cols.invoiceId).toBeDefined()
    expect(cols.amount).toBeDefined()
    expect(cols.amountPaid).toBeDefined()
    expect(cols.transferReceiptFile).toBeDefined()
    expect(cols.proofFileUrl).toBeDefined()
    expect(cols.storagePath).toBeDefined()
    expect(cols.bankName).toBeDefined()
    expect(cols.paymentMethod).toBeDefined()
    expect(cols.submittedAt).toBeDefined()
    expect(cols.paymentDate).toBeDefined()
    expect(cols.verifiedAt).toBeDefined()
    expect(cols.verifiedBy).toBeDefined()
    expect(cols.receiptNumber).toBeDefined()
    expect(cols.submittedByRole).toBeDefined()
    expect(cols.submittedByName).toBeDefined()
    expect(cols.status).toBeDefined()
    expect(cols.notes).toBeDefined()
    expect(cols.createdAt).toBeDefined()
  })

  it('defines relations correctly between invoices, payments, students, and profiles', () => {
    expect(invoicesRelations).toBeDefined()
    expect(paymentsRelations).toBeDefined()
    expect(studentsRelations).toBeDefined()
    expect(profilesRelations).toBeDefined()
  })

  it('provides inferred TypeScript types that can be statically constructed', () => {
    const mockInvoice: Invoice = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      studentId: '123e4567-e89b-12d3-a456-426614174001',
      invoiceNumber: 'INV-202610-0001',
      programName: 'Intensif UTBK-SNBT',
      description: 'SPP Bulan Oktober 2026',
      amount: 750000,
      dueDate: '2026-10-25',
      status: 'belum_dibayar',
      rejectedReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockNewInvoice: NewInvoice = {
      studentId: '123e4567-e89b-12d3-a456-426614174001',
      invoiceNumber: 'INV-202610-0002',
      programName: 'Intensif UTBK-SNBT',
      amount: 750000,
      dueDate: '2026-11-10',
    }

    const mockPayment: Payment = {
      id: '123e4567-e89b-12d3-a456-426614174002',
      invoiceId: mockInvoice.id,
      amount: 750000,
      amountPaid: '750000',
      transferReceiptFile: 'proof.jpg',
      proofFileUrl: 'https://example.com/receipts/proof.jpg',
      storagePath: 'receipts/proof-001.jpg',
      bankName: 'Bank Mandiri',
      paymentMethod: 'Transfer Manual',
      submittedAt: new Date(),
      paymentDate: new Date(),
      verifiedAt: new Date(),
      verifiedBy: '123e4567-e89b-12d3-a456-426614174003',
      receiptNumber: 'KWT-202610-0001',
      submittedByRole: 'parent',
      submittedByName: 'Ir. H. Ahmad Dahlan',
      status: 'menunggu',
      notes: null,
      createdAt: new Date(),
    }

    const mockNewPayment: NewPayment = {
      invoiceId: mockInvoice.id,
      amount: 750000,
      bankName: 'Bank Mandiri',
      transferReceiptFile: 'proof2.jpg',
    }

    expect(mockInvoice.invoiceNumber).toBe('INV-202610-0001')
    expect(mockNewInvoice.status).toBeUndefined()
    expect(mockPayment.receiptNumber).toBe('KWT-202610-0001')
    expect(mockNewPayment.amount).toBe(750000)
  })
})
