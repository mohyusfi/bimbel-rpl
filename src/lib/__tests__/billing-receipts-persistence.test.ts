import { describe, it, expect, beforeEach } from 'vitest'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getTableColumns } from 'drizzle-orm'
import {
  adminStore,
  type Invoice as StoreInvoice,
} from '../admin-store'
import {
  validateReceiptFile,
  validateReceiptFormat,
  validateReceiptFileSize,
  MAX_RECEIPT_FILE_SIZE_BYTES,
  ALLOWED_RECEIPT_EXTENSIONS,
  ALLOWED_RECEIPT_MIME_TYPES,
} from '../receipt-validator'
import {
  invoices,
  payments,
  invoicesRelations,
  paymentsRelations,
  studentsRelations,
  profilesRelations,
  type Invoice as DrizzleInvoice,
  type NewInvoice,
  type Payment as DrizzlePayment,
  type NewPayment,
} from '../../db/schema'
import {
  useAdminInvoices,
  useInvoices,
  useInvoiceDetails,
  useAdminSummary,
  useStudentDashboardData,
  useParentDashboardData,
  uploadAndSubmitPaymentProof,
  useCreateInvoiceMutation,
  useVerifyInvoiceMutation,
  useRejectInvoiceMutation,
  useSubmitPaymentProofMutation,
  ADMIN_KEYS,
} from '../../hooks/use-admin-data'

// Test harness untuk mengeksekusi TanStack Query hook dalam lingkungan pengujian SSR
function renderHookWithClient<T>(hookFn: () => T): T {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  const state = adminStore.getState()
  queryClient.setQueryData(ADMIN_KEYS.session, {
    activeStudentId: state.activeStudentId,
    activeTutorId: state.activeTutorId,
    activeParentId: state.activeParentId,
    selectedChildId: state.selectedChildId,
    student: state.students.find((s) => s.id === state.activeStudentId) || state.students[0],
    tutor: state.tutors.find((t) => t.id === state.activeTutorId) || state.tutors[0],
    parent: state.parents.find((p) => p.id === state.activeParentId) || state.parents[0],
    selectedChild: state.students.find((s) => s.id === state.selectedChildId) || state.students[0],
  })
  queryClient.setQueryData(ADMIN_KEYS.tutors, state.tutors)
  queryClient.setQueryData(ADMIN_KEYS.students, state.students)
  queryClient.setQueryData(ADMIN_KEYS.schedules, state.schedules)
  queryClient.setQueryData(ADMIN_KEYS.classes, state.classes)
  queryClient.setQueryData(ADMIN_KEYS.attendance, state.attendanceSessions)
  queryClient.setQueryData(ADMIN_KEYS.materials, state.learningMaterials)
  queryClient.setQueryData(ADMIN_KEYS.grades, state.gradeRecords)
  queryClient.setQueryData(ADMIN_KEYS.parents, state.parents)
  queryClient.setQueryData(ADMIN_KEYS.invoices, state.invoices)
  queryClient.setQueryData(ADMIN_KEYS.notifications, state.notifications)

  let result!: T
  function TestHarness() {
    result = hookFn()
    return null
  }

  renderToString(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(TestHarness)
    )
  )

  return result
}

describe('Tiket 06 — Siklus Tagihan SPP, Bukti Bayar Storage, & Kwitansi Resmi', () => {
  beforeEach(() => {
    // Reset state store ke kondisi awal bersih sebelum setiap pengujian
    adminStore.resetToDefault()
  })

  // =========================================================================
  // 1. PEMBUATAN TAGIHAN LES BARU (createInvoice) DENGAN STATUS AWAL 'belum_dibayar'
  // =========================================================================
  describe('1. Pembuatan Tagihan Les Baru (createInvoice)', () => {
    it('membuat tagihan baru dengan status default "belum_dibayar" dan nomor INV-...', () => {
      const initialCount = adminStore.getState().invoices.length

      const newInv = adminStore.createInvoice({
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        programName: 'Intensif UTBK-SNBT',
        amount: 500000,
        dueDate: '10 Mei 2026',
      })

      expect(newInv).toBeDefined()
      expect(newInv.id).toMatch(/^INV-2026-\d{4}$/)
      expect(newInv.status).toBe('belum_dibayar')
      expect(newInv.amount).toBe(500000)
      expect(newInv.studentName).toBe('Fahri Ramadhan')
      expect(newInv.nis).toBe('TC-2026-001')
      expect(newInv.programName).toBe('Intensif UTBK-SNBT')
      expect(newInv.dueDate).toBe('10 Mei 2026')

      // Kwitansi dan verifikasi belum boleh ada di tahap awal
      expect(newInv.receiptNumber).toBeUndefined()
      expect(newInv.verifiedAt).toBeUndefined()
      expect(newInv.verifiedBy).toBeUndefined()
      expect(newInv.transferReceiptFile).toBeUndefined()

      // Memastikan tersimpan di state store pada antrean paling awal (LIFO)
      const stateInvoices = adminStore.getState().invoices
      expect(stateInvoices.length).toBe(initialCount + 1)
      expect(stateInvoices[0].id).toBe(newInv.id)
    })

    it('membuat beberapa tagihan sekaligus untuk siswa berbeda dengan ID unik berurutan', () => {
      const inv1 = adminStore.createInvoice({
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        programName: 'Intensif UTBK-SNBT',
        amount: 450000,
        dueDate: '10 Mei 2026',
      })

      const inv2 = adminStore.createInvoice({
        studentId: 'stu-2',
        studentName: 'Alya Salsabila',
        nis: 'TC-2026-002',
        programName: 'Intensif UTBK-SNBT',
        amount: 450000,
        dueDate: '10 Mei 2026',
      })

      expect(inv1.id).not.toBe(inv2.id)
      expect(inv1.id).toMatch(/^INV-2026-\d{4}$/)
      expect(inv2.id).toMatch(/^INV-2026-\d{4}$/)
      expect(inv1.status).toBe('belum_dibayar')
      expect(inv2.status).toBe('belum_dibayar')
    })
  })

  // =========================================================================
  // 2. SIKLUS STATUS TAGIHAN & AKSI ADMINISTRATOR / PENGGUNA
  // =========================================================================
  describe('2. Siklus Status Tagihan SPP', () => {
    it('transisi belum_dibayar -> menunggu saat bukti transfer diunggah', () => {
      // 1. Buat invoice baru
      const invoice = adminStore.createInvoice({
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        programName: 'Intensif UTBK-SNBT',
        amount: 450000,
        dueDate: '10 Mei 2026',
      })
      expect(invoice.status).toBe('belum_dibayar')

      // 2. Siswa / Orang Tua mengunggah bukti bayar
      const uploadSuccess = adminStore.submitPaymentProof({
        invoiceId: invoice.id,
        fileName: 'struk_transfer_bsi_mei.jpg',
        bankName: 'Bank Syariah Indonesia (BSI)',
        paymentMethod: 'Transfer Mobile Banking BSI',
        submittedByRole: 'parent',
        submittedByName: 'Ir. H. Ahmad Dahlan',
      })

      expect(uploadSuccess).toBe(true)

      // 3. Periksa status invoice setelah unggah
      const updatedInv = adminStore.getState().invoices.find((i) => i.id === invoice.id)
      expect(updatedInv).toBeDefined()
      expect(updatedInv?.status).toBe('menunggu')
      expect(updatedInv?.transferReceiptFile).toBe('struk_transfer_bsi_mei.jpg')
      expect(updatedInv?.bankName).toBe('Bank Syariah Indonesia (BSI)')
      expect(updatedInv?.paymentMethod).toBe('Transfer Mobile Banking BSI')
      expect(updatedInv?.submittedByRole).toBe('parent')
      expect(updatedInv?.submittedByName).toBe('Ir. H. Ahmad Dahlan')
      expect(updatedInv?.submittedAt).toBeDefined()
      expect(updatedInv?.rejectedReason).toBeUndefined()

      // 4. Periksa notifikasi sistem yang terpicu
      const latestNotif = adminStore.getState().notifications[0]
      expect(latestNotif).toBeDefined()
      expect(latestNotif.title).toContain('Bukti')
    })

    it('transisi menunggu -> lunas saat disetujui Admin dengan penomoran resmi KWT-...', () => {
      // Ambil invoice berstatus 'menunggu' dari data default
      const pendingInv = adminStore.getState().invoices.find((i) => i.status === 'menunggu')
      expect(pendingInv).toBeDefined()
      const invId = pendingInv!.id

      // Admin melakukan verifikasi pembayaran
      const verifySuccess = adminStore.verifyInvoice(invId)
      expect(verifySuccess).toBe(true)

      // Periksa status dan atribut kwitansi
      const verifiedInv = adminStore.getState().invoices.find((i) => i.id === invId)
      expect(verifiedInv).toBeDefined()
      expect(verifiedInv?.status).toBe('lunas')
      expect(verifiedInv?.receiptNumber).toBeDefined()
      expect(verifiedInv?.receiptNumber).toMatch(/^KWT-\d{4,6}-\d{4}$/)
      expect(verifiedInv?.verifiedAt).toContain('WITA')
      expect(verifiedInv?.verifiedBy).toBe('Hj. Nuraini, S.Pd')

      // Periksa notifikasi pelunasan dan kwitansi resmi
      const notif = adminStore.getState().notifications.find((n) => n.message.includes(verifiedInv!.receiptNumber!))
      expect(notif).toBeDefined()
      expect(notif?.title).toContain('Terverifikasi Lunas')
      expect(notif?.message).toContain(verifiedInv!.receiptNumber!)
    })

    it('transisi menunggu -> ditolak saat ditolak Admin dengan alasan tercatat rapi', () => {
      // Ambil invoice berstatus 'menunggu'
      const pendingInv = adminStore.getState().invoices.find((i) => i.status === 'menunggu')
      expect(pendingInv).toBeDefined()
      const invId = pendingInv!.id
      const rejectReason = 'Foto struk buram dan nominal transfer kurang Rp 50.000.'

      // Admin menolak pembayaran
      const rejectSuccess = adminStore.rejectInvoice(invId, rejectReason)
      expect(rejectSuccess).toBe(true)

      // Periksa status dan alasan penolakan
      const rejectedInv = adminStore.getState().invoices.find((i) => i.id === invId)
      expect(rejectedInv).toBeDefined()
      expect(rejectedInv?.status).toBe('ditolak')
      expect(rejectedInv?.rejectedReason).toBe(rejectReason)
      // Kwitansi tidak boleh diterbitkan jika ditolak
      expect(rejectedInv?.receiptNumber).toBeUndefined()
    })

    it('siklus pemulihan: tagihan ditolak dapat diunggah ulang bukti baru dan kemudian disetujui lunas', () => {
      // Ambil invoice berstatus ditolak
      const rejectedInv = adminStore.getState().invoices.find((i) => i.status === 'ditolak')
      expect(rejectedInv).toBeDefined()
      const invId = rejectedInv!.id

      // 1. Wali murid mengunggah ulang bukti bayar baru yang benar
      const reUploadSuccess = adminStore.submitPaymentProof({
        invoiceId: invId,
        fileName: 'struk_revisi_lunas_jelas.png',
        bankName: 'BSI Cabang Palu Hasanuddin',
        paymentMethod: 'Transfer BSI',
        submittedByRole: 'parent',
        submittedByName: 'Ir. H. Ahmad Dahlan',
      })
      expect(reUploadSuccess).toBe(true)

      const reSubmittedInv = adminStore.getState().invoices.find((i) => i.id === invId)
      expect(reSubmittedInv?.status).toBe('menunggu')
      expect(reSubmittedInv?.transferReceiptFile).toBe('struk_revisi_lunas_jelas.png')
      // Alasan penolakan sebelumnya wajib dibersihkan
      expect(reSubmittedInv?.rejectedReason).toBeUndefined()

      // 2. Admin memverifikasi bukti yang baru
      const verifySuccess = adminStore.verifyInvoice(invId)
      expect(verifySuccess).toBe(true)

      const finalInv = adminStore.getState().invoices.find((i) => i.id === invId)
      expect(finalInv?.status).toBe('lunas')
      expect(finalInv?.receiptNumber).toMatch(/^KWT-\d{4,6}-\d{4}$/)
      expect(finalInv?.verifiedAt).toBeDefined()
    })

    it('menangani ID tagihan fiktif/tidak ditemukan secara aman (edge case)', () => {
      const nonExistentId = 'INV-9999-9999'

      const verifyRes = adminStore.verifyInvoice(nonExistentId)
      expect(verifyRes).toBe(false)

      const rejectRes = adminStore.rejectInvoice(nonExistentId, 'Alasan coba-coba')
      expect(rejectRes).toBe(false)

      const submitRes = adminStore.submitPaymentProof({
        invoiceId: nonExistentId,
        fileName: 'test.jpg',
        bankName: 'BSI',
        paymentMethod: 'Transfer',
        submittedByRole: 'student',
        submittedByName: 'Siswa Test',
      })
      expect(submitRes).toBe(false)
    })
  })

  // =========================================================================
  // 3. VALIDASI BERKAS BUKTI BAYAR (receipt-validator)
  // =========================================================================
  describe('3. Validasi Berkas Bukti Bayar (receipt-validator)', () => {
    describe('Validasi Format Legal (JPG, PNG, PDF)', () => {
      it('mengizinkan berkas JPG/JPEG dengan ekstensi huruf kecil maupun kapital', () => {
        const res1 = validateReceiptFormat('struk-transfer.jpg', 'image/jpeg')
        expect(res1.valid).toBe(true)
        expect(res1.fileType).toBe('JPG')
        expect(res1.error).toBeUndefined()

        const res2 = validateReceiptFormat('BUKTI_BAYAR_MANDIRI.JPEG')
        expect(res2.valid).toBe(true)
        expect(res2.fileType).toBe('JPG')

        const res3 = validateReceiptFormat('Struk-Atm.Jpg')
        expect(res3.valid).toBe(true)
        expect(res3.fileType).toBe('JPG')
      })

      it('mengizinkan berkas PNG dengan ekstensi huruf kecil maupun kapital', () => {
        const res1 = validateReceiptFormat('screenshot_qris_bsi.png', 'image/png')
        expect(res1.valid).toBe(true)
        expect(res1.fileType).toBe('PNG')
        expect(res1.error).toBeUndefined()

        const res2 = validateReceiptFormat('BUKTI_TRANSFER_BCA.PNG')
        expect(res2.valid).toBe(true)
        expect(res2.fileType).toBe('PNG')
      })

      it('mengizinkan berkas PDF dokumen transfer resmi', () => {
        const res1 = validateReceiptFormat('bukti_transfer_bank_resmi.pdf', 'application/pdf')
        expect(res1.valid).toBe(true)
        expect(res1.fileType).toBe('PDF')
        expect(res1.error).toBeUndefined()

        const res2 = validateReceiptFormat('E-RECEIPT_OCTOBER_2026.PDF')
        expect(res2.valid).toBe(true)
        expect(res2.fileType).toBe('PDF')
      })

      it('menolak berkas tanpa ekstensi atau nama tidak valid', () => {
        const res1 = validateReceiptFormat('')
        expect(res1.valid).toBe(false)
        expect(res1.error).toContain('tidak valid')

        const res2 = validateReceiptFormat('struk_tanpa_ekstensi')
        expect(res2.valid).toBe(false)
        expect(res2.error).toContain('tidak memiliki ekstensi')

        const res3 = validateReceiptFormat('berkas_titik_akhir.')
        expect(res3.valid).toBe(false)
        expect(res3.error).toContain('tidak memiliki ekstensi')
      })

      it('menolak format berkas ilegal yang tidak didukung', () => {
        const illegalFiles = [
          { name: 'malware.exe', mime: 'application/x-msdownload' },
          { name: 'document.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          { name: 'spreadsheet.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          { name: 'presentasi.pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
          { name: 'animasi.gif', mime: 'image/gif' },
          { name: 'gambar.webp', mime: 'image/webp' },
          { name: 'vektor.svg', mime: 'image/svg+xml' },
          { name: 'arsip.zip', mime: 'application/zip' },
          { name: 'script.sh', mime: 'application/x-sh' },
        ]

        for (const file of illegalFiles) {
          const res = validateReceiptFormat(file.name, file.mime)
          expect(res.valid).toBe(false)
          expect(res.error).toContain('Format berkas tidak didukung')
        }
      })
    })

    describe('Validasi Batas Ukuran Berkas Bukti (Maksimal 5 MB)', () => {
      it('mengonfirmasi konstanta batas maksimal tepat 5 MB', () => {
        expect(MAX_RECEIPT_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024)
        expect(ALLOWED_RECEIPT_EXTENSIONS).toContain('.jpg')
        expect(ALLOWED_RECEIPT_EXTENSIONS).toContain('.jpeg')
        expect(ALLOWED_RECEIPT_EXTENSIONS).toContain('.png')
        expect(ALLOWED_RECEIPT_EXTENSIONS).toContain('.pdf')
        expect(ALLOWED_RECEIPT_MIME_TYPES).toContain('image/jpeg')
        expect(ALLOWED_RECEIPT_MIME_TYPES).toContain('image/png')
        expect(ALLOWED_RECEIPT_MIME_TYPES).toContain('application/pdf')
      })

      it('menolak berkas kosong (0 bytes) atau ukuran negatif/tidak valid', () => {
        const zeroRes = validateReceiptFileSize(0)
        expect(zeroRes.valid).toBe(false)
        expect(zeroRes.error).toContain('Berkas kosong (0 bytes)')

        const negRes = validateReceiptFileSize(-100)
        expect(negRes.valid).toBe(false)
        expect(negRes.error).toContain('tidak valid')

        const nanRes = validateReceiptFileSize(NaN)
        expect(nanRes.valid).toBe(false)
        expect(nanRes.error).toContain('tidak valid')
      })

      it('mengizinkan ukuran berkas bukti yang berada dalam batas <= 5 MB', () => {
        // 500 KB
        expect(validateReceiptFileSize(500 * 1024).valid).toBe(true)
        // 2 MB
        expect(validateReceiptFileSize(2 * 1024 * 1024).valid).toBe(true)
        // 4.99 MB
        expect(validateReceiptFileSize(5 * 1024 * 1024 - 100).valid).toBe(true)
        // Tepat 5 MB (5,242,880 bytes)
        expect(validateReceiptFileSize(MAX_RECEIPT_FILE_SIZE_BYTES).valid).toBe(true)
      })

      it('menolak berkas bukti yang melebihi batas 5 MB dengan pesan error informatif', () => {
        // 5 MB + 1 byte
        const resOver1 = validateReceiptFileSize(MAX_RECEIPT_FILE_SIZE_BYTES + 1)
        expect(resOver1.valid).toBe(false)
        expect(resOver1.error).toContain('melebihi batas maksimum 5 MB')

        // 6 MB
        const res6Mb = validateReceiptFileSize(6 * 1024 * 1024)
        expect(res6Mb.valid).toBe(false)
        expect(res6Mb.error).toContain('6.0 MB')
        expect(res6Mb.error).toContain('melebihi batas maksimum 5 MB')

        // 12 MB
        const res12Mb = validateReceiptFileSize(12 * 1024 * 1024)
        expect(res12Mb.valid).toBe(false)
        expect(res12Mb.error).toContain('12.0 MB')
      })
    })

    describe('Validasi Komprehensif validateReceiptFile', () => {
      it('berhasil jika format legal dan ukuran berkas di bawah 5 MB', () => {
        const result = validateReceiptFile({
          name: 'bukti-bsi-lunas.jpg',
          size: 1.5 * 1024 * 1024,
          type: 'image/jpeg',
        })
        expect(result.valid).toBe(true)
        expect(result.fileType).toBe('JPG')
        expect(result.error).toBeUndefined()
      })

      it('menolak jika format legal namun ukuran melebihi 5 MB', () => {
        const result = validateReceiptFile({
          name: 'foto-struk-kamera-hd.png',
          size: 7.2 * 1024 * 1024,
          type: 'image/png',
        })
        expect(result.valid).toBe(false)
        expect(result.fileType).toBe('PNG')
        expect(result.error).toContain('melebihi batas maksimum 5 MB')
      })

      it('menolak jika format tidak didukung meskipun ukuran sangat kecil', () => {
        const result = validateReceiptFile({
          name: 'nota.exe',
          size: 10 * 1024, // hanya 10 KB
        })
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Format berkas tidak didukung')
      })

      it('menolak input objek berkas null atau undefined', () => {
        const result = validateReceiptFile(null as any)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('tidak ditemukan')
      })
    })
  })

  // =========================================================================
  // 4. FORMAT UNIK INVOICE (INV-...) DAN KWITANSI (KWT-...)
  // =========================================================================
  describe('4. Format Unik Invoice (INV-...) dan Kwitansi (KWT-...)', () => {
    it('memastikan format invoice memenuhi standar INV-YYYY-XXXX', () => {
      const inv = adminStore.createInvoice({
        studentId: 'stu-1',
        studentName: 'Fahri Ramadhan',
        nis: 'TC-2026-001',
        programName: 'Intensif UTBK-SNBT',
        amount: 450000,
        dueDate: '10 Mei 2026',
      })

      expect(inv.id).toMatch(/^INV-2026-\d{4}$/)
      const parts = inv.id.split('-')
      expect(parts[0]).toBe('INV')
      expect(parts[1]).toBe('2026')
      expect(Number(parts[2])).toBeGreaterThanOrEqual(300)
    })

    it('memastikan kwitansi resmi mematuhi format KWT-YYYY-XXXX dan berpasangan dengan invoice', () => {
      const inv = adminStore.createInvoice({
        studentId: 'stu-2',
        studentName: 'Alya Salsabila',
        nis: 'TC-2026-002',
        programName: 'Intensif UTBK-SNBT',
        amount: 450000,
        dueDate: '10 Mei 2026',
      })

      adminStore.submitPaymentProof({
        invoiceId: inv.id,
        fileName: 'bukti.jpg',
        bankName: 'BSI',
        paymentMethod: 'Transfer',
        submittedByRole: 'student',
        submittedByName: 'Alya Salsabila',
      })

      adminStore.verifyInvoice(inv.id)

      const verified = adminStore.getState().invoices.find((i) => i.id === inv.id)
      expect(verified?.receiptNumber).toBeDefined()
      expect(verified?.receiptNumber).toMatch(/^KWT-\d{4,6}-\d{4}$/)
    })

    it('seluruh invoice bawaan (INITIAL_INVOICES) memiliki ID unik tanpa duplikasi', () => {
      const allInvoices = adminStore.getState().invoices
      const idSet = new Set<string>()

      for (const inv of allInvoices) {
        expect(inv.id).toMatch(/^INV-2026-\d{4}$/)
        expect(idSet.has(inv.id)).toBe(false)
        idSet.add(inv.id)

        // Bagi invoice lunas, pastikan kwitansi berformat KWT-...
        if (inv.status === 'lunas') {
          expect(inv.receiptNumber).toBeDefined()
          expect(inv.receiptNumber).toMatch(/^KWT-\d{4,6}-\d{4}$/)
          expect(inv.verifiedAt).toBeDefined()
        }
      }
    })
  })

  // =========================================================================
  // 5. VALIDASI RELASI DATA DRIZZLE & INTEGRITAS TIPE DATA TYPESCRIPT
  // =========================================================================
  describe('5. Validasi Relasi Data Drizzle & Integritas Tipe Data TypeScript', () => {
    it('memiliki definisi tabel Drizzle "invoices" lengkap dengan semua kolom dan tipe', () => {
      expect(invoices).toBeDefined()
      const cols = getTableColumns(invoices)

      expect(cols.id).toBeDefined()
      expect(cols.studentId).toBeDefined()
      expect(cols.invoiceNumber).toBeDefined()
      expect(cols.programName).toBeDefined()
      expect(cols.amount).toBeDefined()
      expect(cols.dueDate).toBeDefined()
      expect(cols.status).toBeDefined()
      expect(cols.rejectedReason).toBeDefined()
      expect(cols.createdAt).toBeDefined()
      expect(cols.updatedAt).toBeDefined()
    })

    it('memiliki definisi tabel Drizzle "payments" lengkap dengan semua kolom dan tipe', () => {
      expect(payments).toBeDefined()
      const cols = getTableColumns(payments)

      expect(cols.id).toBeDefined()
      expect(cols.invoiceId).toBeDefined()
      expect(cols.amount).toBeDefined()
      expect(cols.transferReceiptFile).toBeDefined()
      expect(cols.storagePath).toBeDefined()
      expect(cols.bankName).toBeDefined()
      expect(cols.paymentMethod).toBeDefined()
      expect(cols.submittedAt).toBeDefined()
      expect(cols.verifiedAt).toBeDefined()
      expect(cols.verifiedBy).toBeDefined()
      expect(cols.receiptNumber).toBeDefined()
      expect(cols.submittedByRole).toBeDefined()
      expect(cols.submittedByName).toBeDefined()
      expect(cols.status).toBeDefined()
      expect(cols.notes).toBeDefined()
      expect(cols.createdAt).toBeDefined()
    })

    it('mendefinisikan relasi relasional Drizzle (invoicesRelations, paymentsRelations, studentsRelations, profilesRelations)', () => {
      expect(invoicesRelations).toBeDefined()
      expect(paymentsRelations).toBeDefined()
      expect(studentsRelations).toBeDefined()
      expect(profilesRelations).toBeDefined()
    })

    it('menjamin integritas tipe data TypeScript Invoice & Payment (Type-Safety)', () => {
      // Validasi statis tipe Drizzle Invoice
      const mockDrizzleInvoice: DrizzleInvoice = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        studentId: '123e4567-e89b-12d3-a456-426614174001',
        invoiceNumber: 'INV-2026-0350',
        programName: 'Intensif UTBK-SNBT',
        description: 'Tagihan SPP Bulan Mei 2026',
        amount: 450000,
        dueDate: '10 Mei 2026',
        status: 'belum_dibayar',
        rejectedReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(mockDrizzleInvoice.invoiceNumber).toBe('INV-2026-0350')
      expect(mockDrizzleInvoice.amount).toBe(450000)

      // Validasi statis NewInvoice (insert model)
      const mockNewInvoice: NewInvoice = {
        studentId: '123e4567-e89b-12d3-a456-426614174001',
        invoiceNumber: 'INV-2026-0351',
        programName: 'SMP Prestasi',
        amount: 350000,
        dueDate: '10 Juni 2026',
      }
      expect(mockNewInvoice.amount).toBe(350000)
      expect(mockNewInvoice.status).toBeUndefined() // default database

      // Validasi statis tipe Drizzle Payment
      const mockDrizzlePayment: DrizzlePayment = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        invoiceId: mockDrizzleInvoice.id,
        amount: 450000,
        amountPaid: '450000',
        transferReceiptFile: 'bukti_transfer.jpg',
        proofFileUrl: 'https://example.com/receipts/proof.jpg',
        storagePath: 'receipts/bukti_transfer.jpg',
        bankName: 'Bank Syariah Indonesia (BSI)',
        paymentMethod: 'Transfer BSI',
        submittedAt: new Date(),
        paymentDate: new Date(),
        verifiedAt: new Date(),
        verifiedBy: '123e4567-e89b-12d3-a456-426614174003',
        receiptNumber: 'KWT-2026-0350',
        submittedByRole: 'parent',
        submittedByName: 'Ir. H. Ahmad Dahlan',
        status: 'lunas',
        notes: 'Bukti transfer valid dan sah',
        createdAt: new Date(),
      }
      expect(mockDrizzlePayment.receiptNumber).toBe('KWT-2026-0350')
      expect(mockDrizzlePayment.status).toBe('lunas')

      // Validasi statis NewPayment (insert model)
      const mockNewPayment: NewPayment = {
        invoiceId: mockDrizzleInvoice.id,
        amount: 450000,
        bankName: 'BSI',
        transferReceiptFile: 'bukti.jpg',
      }
      expect(mockNewPayment.amount).toBe(450000)
    })
  })

  // =========================================================================
  // 6. INTEGRASI TANSTACK QUERY & ISOLASI AKSES MULTI-ROLE
  // =========================================================================
  describe('6. Integrasi TanStack Query & Isolasi Akses Multi-Role', () => {
    it('useAdminInvoices mengembalikan seluruh invoice dan data sinkron dengan store', () => {
      const data = renderHookWithClient(() => useAdminInvoices())
      expect(data.data).toBeDefined()
      expect(data.data?.length).toBe(adminStore.getState().invoices.length)
      expect(data.data?.some((i) => i.status === 'menunggu')).toBe(true)
      expect(data.data?.some((i) => i.status === 'lunas')).toBe(true)
      expect(data.data?.some((i) => i.status === 'belum_dibayar')).toBe(true)
    })

    it('useAdminSummary menghitung jumlah pendingInvoicesCount dengan presisi', () => {
      const summary = renderHookWithClient(() => useAdminSummary())
      const pendingCount = adminStore.getState().invoices.filter((i) => i.status === 'menunggu').length
      expect(summary.pendingInvoicesCount).toBe(pendingCount)
    })

    it('useStudentDashboardData mengisolasi tagihan hanya milik siswa bersangkutan', () => {
      const stu1Data = renderHookWithClient(() => useStudentDashboardData('stu-1'))
      expect(stu1Data.invoices).toBeDefined()
      expect(stu1Data.invoices.length).toBeGreaterThan(0)
      for (const inv of stu1Data.invoices) {
        expect(inv.studentId).toBe('stu-1')
        expect(inv.studentName).toBe('Fahri Ramadhan')
      }

      // Siswa lain hanya melihat tagihannya sendiri
      const stu2Data = renderHookWithClient(() => useStudentDashboardData('stu-2'))
      expect(stu2Data.invoices).toBeDefined()
      for (const inv of stu2Data.invoices) {
        expect(inv.studentId).toBe('stu-2')
      }
    })

    it('useParentDashboardData memfilter tagihan sesuai anak yang aktif dipilih', () => {
      const parentData = renderHookWithClient(() => useParentDashboardData('par-1', 'stu-1'))
      expect(parentData.childData.invoices).toBeDefined()
      expect(parentData.childData.invoices.length).toBeGreaterThan(0)
      for (const inv of parentData.childData.invoices) {
        expect(inv.studentId).toBe('stu-1')
      }
    })

    it('useInvoiceDetails mengambil rincian spesifik satu invoice berdasarkan ID', () => {
      const sampleInv = adminStore.getState().invoices[0]
      const detail = renderHookWithClient(() => useInvoiceDetails(sampleInv.id))
      expect(detail.data).toBeDefined()
      expect(detail.data?.id).toBe(sampleInv.id)
      expect(detail.data?.amount).toBe(sampleInv.amount)
    })
    it('useInvoices mengembalikan seluruh invoice atau terfilter per studentId', () => {
      const allInvoices = renderHookWithClient(() => useInvoices())
      expect(allInvoices.data?.length).toBe(adminStore.getState().invoices.length)

      const stu1Invoices = renderHookWithClient(() => useInvoices('stu-1'))
      expect(stu1Invoices.data).toBeDefined()
      expect(stu1Invoices.data!.length).toBeGreaterThan(0)
      for (const inv of stu1Invoices.data!) {
        expect(inv.studentId).toBe('stu-1')
      }
    })

    it('uploadAndSubmitPaymentProof memproses unggahan bukti dan mengupdate status menjadi menunggu', async () => {
      const inv = adminStore.createInvoice({
        studentId: 'stu-99',
        studentName: 'Siswa Uji',
        nis: 'TC-2026-099',
        programName: 'Program Uji',
        amount: 300000,
        dueDate: '15 Mei 2026',
        description: 'Tagihan Uji',
      })
      expect(inv.status).toBe('belum_dibayar')

      const dummyBlob = new Blob(['sample-receipt-image-content'], { type: 'image/jpeg' })
      const result = await uploadAndSubmitPaymentProof({
        invoiceId: inv.id,
        file: dummyBlob,
        fileName: 'struk_transfer_test.jpg',
        bankName: 'BSI Cabang Palu',
        paymentMethod: 'Transfer BSI',
        submittedByRole: 'student',
        submittedByName: 'Siswa Uji',
      })

      expect(result).toBe(true)
      const updated = adminStore.getState().invoices.find((i) => i.id === inv.id)
      expect(updated?.status).toBe('menunggu')
      expect(updated?.transferReceiptFile).toBe('struk_transfer_test.jpg')
      expect(updated?.storage_path).toBeDefined()
    })

    it('memastikan hook mutasi standalone terdefinisi dan siap digunakan', () => {
      expect(typeof useCreateInvoiceMutation).toBe('function')
      expect(typeof useVerifyInvoiceMutation).toBe('function')
      expect(typeof useRejectInvoiceMutation).toBe('function')
      expect(typeof useSubmitPaymentProofMutation).toBe('function')
    })
  })
})
