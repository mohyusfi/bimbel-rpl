import { describe, it, expect, afterAll } from 'vitest'
import { billingService } from '../billing.service'

describe('BillingService — TDD & Supabase Integration (Tiket 06)', { timeout: 20000 }, () => {
  const FAHRI_STUDENT_ID = 'd992d9fc-6f5b-434f-998b-358e54a754b7'
  const AHMAD_DAHLAN_PARENT_ID = '4ef83eaa-2764-4eec-9019-a987a34c4c7b'

  // =========================================================================
  // 1. INVOICES QUERY & MULTI-CHILD FILTERING
  // =========================================================================
  describe('Invoices Query & Relasi Multi-Child', () => {
    it('mengambil daftar tagihan dari database Supabase', async () => {
      const invoices = await billingService.getInvoices()
      expect(Array.isArray(invoices)).toBe(true)
    })

    it('mendukung query tagihan spesifik siswa (termasuk legacy ID stu-1)', async () => {
      const invoicesById = await billingService.getInvoicesByStudent(FAHRI_STUDENT_ID)
      expect(Array.isArray(invoicesById)).toBe(true)

      const invoicesByLegacy = await billingService.getInvoicesByStudent('stu-1')
      expect(Array.isArray(invoicesByLegacy)).toBe(true)
    })

    it('mengambil seluruh tagihan anak untuk akun orang tua (multi-child)', async () => {
      const parentInvoices = await billingService.getInvoicesByParent(AHMAD_DAHLAN_PARENT_ID)
      expect(Array.isArray(parentInvoices)).toBe(true)
    })
  })

  // =========================================================================
  // 2. SIKLUS HIDUP TAGIHAN: TERBIT -> UPLOAD BUKTI -> VERIFIKASI LUNAS
  // =========================================================================
  describe('Siklus Hidup Tagihan: Terbit -> Upload Bukti -> Verifikasi Lunas', () => {
    let createdInvoiceId: string = ''
    let createdInvoiceNumber: string = ''

    it('berhasil menerbitkan tagihan SPP baru dengan format penomoran INV-YYYYMM-XXXX', async () => {
      const res = await billingService.createInvoice({
        studentId: FAHRI_STUDENT_ID,
        programName: 'Intensif UTBK-SNBT 2026',
        amount: 450000,
        dueDate: '10 November 2026',
        description: 'SPP Bimbingan Belajar Periode November 2026',
      })

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.id).toBeDefined()
        expect(res.data.invoiceNumber).toMatch(/^INV-\d{6}-\d{4}$/)
        expect(res.data.status).toBe('belum_dibayar')
        expect(res.data.amount).toBe(450000)

        createdInvoiceId = res.data.id
        createdInvoiceNumber = res.data.invoiceNumber
      }
    })

    it('menolak pengunggahan bukti bayar dengan format berkas ilegal (.exe)', async () => {
      const illegalFile = new File(['dummy binary'], 'malware.exe', { type: 'application/x-msdownload' })
      const res = await billingService.submitPaymentProof({
        invoiceId: createdInvoiceId,
        file: illegalFile,
        fileName: 'malware.exe',
        bankName: 'Bank Syariah Indonesia (BSI)',
        submittedByRole: 'student',
        submittedByName: 'Fahri Ramadhan',
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toContain('Format berkas tidak didukung')
      }
    })

    it('berhasil mengunggah bukti bayar JPG/PNG ke Supabase Storage receipts dan mengubah status tagihan menjadi menunggu', async () => {
      // 1x1 valid PNG image buffer
      const pngBuffer = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ])
      const validFile = new File([pngBuffer], 'bukti_transfer_bsi.png', { type: 'image/png' })

      const res = await billingService.submitPaymentProof({
        invoiceId: createdInvoiceId,
        file: validFile,
        fileName: 'bukti_transfer_bsi.png',
        bankName: 'Bank Syariah Indonesia (BSI)',
        submittedByRole: 'student',
        submittedByName: 'Fahri Ramadhan',
      })

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.status).toBe('menunggu')
        expect(res.data.storagePath).toContain(createdInvoiceId)
      }

      // Verifikasi status invoice terupdate di database
      const inv = await billingService.getInvoiceById(createdInvoiceId)
      expect(inv?.status).toBe('menunggu')
    })

    it('berhasil memverifikasi bukti bayar, mengubah status ke lunas, dan menerbitkan KWT-YYYYMM-XXXX', async () => {
      const res = await billingService.verifyPayment(createdInvoiceId, {
        verifiedByName: 'Hj. Nuraini, S.Pd',
      })

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.status).toBe('lunas')
        expect(res.data.receiptNumber).toMatch(/^KWT-\d{6}-\d{4}$/)
      }

      // Verifikasi status di database
      const inv = await billingService.getInvoiceById(createdInvoiceId)
      expect(inv?.status).toBe('lunas')
      expect(inv?.receiptNumber).toBeDefined()
    })

    // Bersihkan tagihan uji
    afterAll(async () => {
      if (createdInvoiceId) {
        await billingService.deleteInvoice(createdInvoiceId)
      }
    })
  })

  // =========================================================================
  // 3. SIKLUS PENOLAKAN & AUDIT TRAIL PENGUNGGAHAN ULANG
  // =========================================================================
  describe('Siklus Penolakan & Audit Trail Pembayaran', () => {
    let testInvoiceId = ''

    it('berhasil menolak pembayaran dengan mencatat rejectedReason resmi', async () => {
      // 1. Buat tagihan baru
      const invRes = await billingService.createInvoice({
        studentId: FAHRI_STUDENT_ID,
        programName: 'Biaya Buku & Modul',
        amount: 150000,
        dueDate: '15 November 2026',
      })
      expect(invRes.success).toBe(true)
      if (!invRes.success) return
      testInvoiceId = invRes.data.id

      // 2. Upload bukti bayar awal
      const dummyFile = new File(['dummy receipt content'], 'struk_rusak.jpg', { type: 'image/jpeg' })
      const payRes = await billingService.submitPaymentProof({
        invoiceId: testInvoiceId,
        file: dummyFile,
        fileName: 'struk_rusak.jpg',
        bankName: 'Bank Mandiri',
        submittedByRole: 'parent',
        submittedByName: 'Ahmad Dahlan',
      })
      expect(payRes.success).toBe(true)

      // 3. Admin menolak bukti bayar
      const rejectRes = await billingService.rejectPayment(
        testInvoiceId,
        'Nominal transfer tidak sesuai dengan tagihan SPP (kurang Rp 50.000).'
      )
      expect(rejectRes.success).toBe(true)

      const inv = await billingService.getInvoiceById(testInvoiceId)
      expect(inv?.status).toBe('ditolak')
      expect(inv?.rejectedReason).toBe('Nominal transfer tidak sesuai dengan tagihan SPP (kurang Rp 50.000).')
    })

    it('membuat baris baru di tabel payments saat siswa mengunggah ulang bukti bayar (audit trail)', async () => {
      const dummyFile2 = new File(['valid receipt content 2'], 'struk_revisi.jpg', { type: 'image/jpeg' })
      const reuploadRes = await billingService.submitPaymentProof({
        invoiceId: testInvoiceId,
        file: dummyFile2,
        fileName: 'struk_revisi.jpg',
        bankName: 'Bank Syariah Indonesia (BSI)',
        submittedByRole: 'student',
        submittedByName: 'Fahri Ramadhan',
      })
      expect(reuploadRes.success).toBe(true)

      // Cek bahwa riwayat payments sekarang memiliki 2 entri untuk invoice ini
      const inv = await billingService.getInvoiceById(testInvoiceId)
      expect(inv?.status).toBe('menunggu')
      expect(inv?.payments?.length).toBeGreaterThanOrEqual(2)

      // Bersihkan
      await billingService.deleteInvoice(testInvoiceId)
    })
  })
})
