import { supabase } from '~/lib/supabase/client'
import { ensureAdminSession } from './master-data.service'
import { validateReceiptFile } from '~/lib/receipt-validator'
import type { Invoice as StoreInvoice } from '~/lib/admin-store'

export type ServerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export interface CreateInvoiceInput {
  studentId: string
  programName: string
  amount: number
  dueDate: string
  description?: string
}

export interface SubmitPaymentProofInput {
  invoiceId: string
  file?: File | Blob | null
  fileName?: string
  receiptUrl?: string
  storagePath?: string
  bankName?: string
  paymentMethod?: string
  submittedByRole?: 'student' | 'parent' | string
  submittedByName?: string
}

export interface VerifyPaymentOptions {
  verifiedBy?: string
  verifiedByName?: string
  notes?: string
}

export interface PaymentRecord {
  id: string
  invoiceId: string
  amount: number
  amountPaid?: number | null
  transferReceiptFile?: string | null
  proofFileUrl?: string | null
  storagePath?: string | null
  bankName?: string | null
  paymentMethod?: string | null
  submittedAt: string
  paymentDate?: string | null
  verifiedAt?: string | null
  verifiedBy?: string | null
  verifiedByName?: string | null
  receiptNumber?: string | null
  submittedByRole?: 'student' | 'parent' | string | null
  submittedByName?: string | null
  status: string
  notes?: string | null
  createdAt: string
}

export interface InvoiceDetail {
  id: string
  studentId: string
  studentName: string
  nis?: string
  parentId?: string | null
  invoiceNumber: string
  programName: string
  description?: string | null
  amount: number
  dueDate: string
  status: 'belum_dibayar' | 'menunggu' | 'lunas' | 'ditolak'
  rejectedReason?: string | null
  receiptNumber?: string | null
  verifiedAt?: string | null
  verifiedBy?: string | null
  verifiedByName?: string | null
  paymentMethod?: string | null
  bankName?: string | null
  storage_path?: string | null
  storagePath?: string | null
  receiptUrl?: string | null
  submittedAt?: string | null
  submittedByRole?: 'student' | 'parent' | null
  submittedByName?: string | null
  createdAt?: string
  updatedAt?: string
  payments?: PaymentRecord[]
}

// Format sequence numbers
export function generateInvoiceNumber(sequence: number, date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const seq = String(sequence).padStart(4, '0')
  return `INV-${year}${month}-${seq}`
}

export function generateReceiptNumber(sequence: number, date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const seq = String(sequence).padStart(4, '0')
  return `KWT-${year}${month}-${seq}`
}

/**
 * Normalisasi format tanggal input (misal '10 November 2026' atau '2026-11-10') ke format ISO YYYY-MM-DD
 * yang kompatibel dengan kolom DATE di PostgreSQL
 */
export function normalizeDateToISO(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return new Date().toISOString().split('T')[0]
  const clean = dateStr.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean

  const monthMap: Record<string, string> = {
    januari: '01', jan: '01',
    februari: '02', feb: '02',
    maret: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05', may: '05',
    juni: '06', jun: '06',
    juli: '07', jul: '07',
    agustus: '08', agu: '08', ags: '08',
    september: '09', sep: '09',
    oktober: '10', okt: '10',
    november: '11', nov: '11',
    desember: '12', des: '12', dec: '12',
  }

  const parts = clean.split(/[\s-]+/)
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const monthLower = parts[1].toLowerCase()
    const month = monthMap[monthLower] || '01'
    const year = parts[2]
    if (year.length === 4) {
      return `${year}-${month}-${day}`
    }
  }

  const parsed = new Date(clean)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return new Date().toISOString().split('T')[0]
}

// Translasi ID legacy untuk kompatibilitas data demo
export async function resolveStudentUUID(studentIdOrLegacy: string): Promise<string> {
  if (!studentIdOrLegacy) return ''
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(studentIdOrLegacy)) {
    return studentIdOrLegacy
  }

  const legacyMap: Record<string, string> = {
    'stu-1': 'd992d9fc-6f5b-434f-998b-358e54a754b7', // Fahri Ramadhan
    'stu-2': '921896b7-be81-4d51-af4a-6cc467757b03', // Bintang Putra
    'stu-3': 'e1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e7', // Alya Ramadhani
    'stu-4': 'e1a2a3a4-b5b6-c7c8-d9d0-e1e2e3e4e5e7', // Alya Ramadhani (multi-child)
  }

  if (legacyMap[studentIdOrLegacy]) {
    return legacyMap[studentIdOrLegacy]
  }

  const { data } = await supabase
    .from('students')
    .select('id')
    .eq('nis', studentIdOrLegacy)
    .maybeSingle()

  return data?.id || studentIdOrLegacy
}

export async function resolveParentUUID(parentIdOrLegacy: string): Promise<string> {
  if (!parentIdOrLegacy) return ''
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(parentIdOrLegacy)) {
    return parentIdOrLegacy
  }

  const legacyMap: Record<string, string> = {
    'par-1': '4ef83eaa-2764-4eec-9019-a987a34c4c7b', // Ahmad Dahlan
  }

  return legacyMap[parentIdOrLegacy] || parentIdOrLegacy
}

function mapRawInvoice(row: any): InvoiceDetail {
  const student = row.students || {}
  const profile = student.profiles || {}
  const rawPayments = Array.isArray(row.payments) ? row.payments : []

  // Urutkan pembayaran berdasarkan submitted_at menurun (terbaru pertama)
  const sortedPayments: PaymentRecord[] = rawPayments
    .map((p: any) => ({
      id: p.id,
      invoiceId: p.invoice_id,
      amount: p.amount,
      amountPaid: p.amount_paid ? Number(p.amount_paid) : null,
      transferReceiptFile: p.transfer_receipt_file,
      proofFileUrl: p.proof_file_url,
      storagePath: p.storage_path,
      bankName: p.bank_name,
      paymentMethod: p.payment_method,
      submittedAt: p.submitted_at || p.created_at,
      paymentDate: p.payment_date,
      verifiedAt: p.verified_at,
      verifiedBy: p.verified_by,
      verifiedByName: p.profiles?.full_name || null,
      receiptNumber: p.receipt_number,
      submittedByRole: p.submitted_by_role,
      submittedByName: p.submitted_by_name,
      status: p.status,
      notes: p.notes,
      createdAt: p.created_at,
    }))
    .sort((a: PaymentRecord, b: PaymentRecord) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  const latestPayment = sortedPayments[0]

  return {
    id: row.id,
    studentId: row.student_id,
    studentName: profile.full_name || 'Siswa Bimbel',
    nis: student.nis || '',
    parentId: student.parent_id || null,
    invoiceNumber: row.invoice_number,
    programName: row.program_name,
    description: row.description || null,
    amount: row.amount,
    dueDate: row.due_date,
    status: row.status as 'belum_dibayar' | 'menunggu' | 'lunas' | 'ditolak',
    rejectedReason: row.rejected_reason || latestPayment?.notes || null,
    receiptNumber: latestPayment?.receiptNumber || null,
    verifiedAt: latestPayment?.verifiedAt || null,
    verifiedBy: latestPayment?.verifiedBy || null,
    verifiedByName: latestPayment?.verifiedByName || null,
    paymentMethod: latestPayment?.paymentMethod || 'Transfer Bank',
    bankName: latestPayment?.bankName || null,
    storage_path: latestPayment?.storagePath || null,
    storagePath: latestPayment?.storagePath || null,
    receiptUrl: latestPayment?.proofFileUrl || null,
    submittedAt: latestPayment?.submittedAt || null,
    submittedByRole: (latestPayment?.submittedByRole as 'student' | 'parent') || null,
    submittedByName: latestPayment?.submittedByName || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    payments: sortedPayments,
  }
}

export const billingService = {
  /**
   * Mengambil seluruh tagihan dengan data siswa dan riwayat pembayaran terbaru
   */
  async getInvoices(options?: {
    studentId?: string
    parentId?: string
    status?: string
  }): Promise<InvoiceDetail[]> {
    let query = supabase
      .from('invoices')
      .select(`
        id,
        student_id,
        invoice_number,
        program_name,
        description,
        amount,
        due_date,
        status,
        rejected_reason,
        created_at,
        updated_at,
        students:student_id (
          id,
          nis,
          parent_id,
          profiles:profile_id (
            full_name
          )
        ),
        payments (
          id,
          invoice_id,
          amount,
          amount_paid,
          transfer_receipt_file,
          proof_file_url,
          storage_path,
          bank_name,
          payment_method,
          submitted_at,
          payment_date,
          verified_at,
          verified_by,
          receipt_number,
          submitted_by_role,
          submitted_by_name,
          status,
          notes,
          created_at,
          profiles:verified_by (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (options?.studentId) {
      const realStudentId = await resolveStudentUUID(options.studentId)
      query = query.eq('student_id', realStudentId)
    }

    if (options?.status && options.status !== 'ALL') {
      if (options.status === 'unpaid') {
        query = query.in('status', ['belum_dibayar', 'ditolak'])
      } else {
        query = query.eq('status', options.status)
      }
    }

    const { data, error } = await query

    if (error) {
      console.warn('[WARN] Gagal mengambil daftar tagihan dari Supabase:', error.message)
      return []
    }

    let invoices = (data || []).map(mapRawInvoice)

    if (options?.parentId) {
      const realParentId = await resolveParentUUID(options.parentId)
      invoices = invoices.filter((inv) => inv.parentId === realParentId)
    }

    return invoices
  },

  /**
   * Mengambil detail satu tagihan berdasarkan ID atau invoiceNumber
   */
  async getInvoiceById(invoiceId: string): Promise<InvoiceDetail | null> {
    if (!invoiceId) return null

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId)

    let query = supabase
      .from('invoices')
      .select(`
        id,
        student_id,
        invoice_number,
        program_name,
        description,
        amount,
        due_date,
        status,
        rejected_reason,
        created_at,
        updated_at,
        students:student_id (
          id,
          nis,
          parent_id,
          profiles:profile_id (
            full_name
          )
        ),
        payments (
          id,
          invoice_id,
          amount,
          amount_paid,
          transfer_receipt_file,
          proof_file_url,
          storage_path,
          bank_name,
          payment_method,
          submitted_at,
          payment_date,
          verified_at,
          verified_by,
          receipt_number,
          submitted_by_role,
          submitted_by_name,
          status,
          notes,
          created_at,
          profiles:verified_by (
            full_name
          )
        )
      `)

    if (isUUID) {
      query = query.eq('id', invoiceId)
    } else {
      query = query.eq('invoice_number', invoiceId)
    }

    const { data, error } = await query.maybeSingle()

    if (error || !data) {
      return null
    }

    return mapRawInvoice(data)
  },

  /**
   * Mengambil tagihan spesifik siswa (mendukung translasi legacy ID)
   */
  async getInvoicesByStudent(studentId: string): Promise<InvoiceDetail[]> {
    const realStudentId = await resolveStudentUUID(studentId)
    return this.getInvoices({ studentId: realStudentId })
  },

  /**
   * Mengambil tagihan seluruh anak orang tua (multi-child)
   */
  async getInvoicesByParent(parentId: string): Promise<InvoiceDetail[]> {
    const realParentId = await resolveParentUUID(parentId)
    return this.getInvoices({ parentId: realParentId })
  },

  /**
   * Menerbitkan tagihan SPP baru oleh Administrator
   */
  async createInvoice(input: CreateInvoiceInput): Promise<ServerResult<InvoiceDetail>> {
    await ensureAdminSession()

    const realStudentId = await resolveStudentUUID(input.studentId)
    if (!realStudentId) {
      return { success: false, error: 'Siswa tidak ditemukan.' }
    }

    if (!input.amount || input.amount <= 0) {
      return { success: false, error: 'Nominal tagihan harus lebih besar dari 0.' }
    }

    // Hitung sequence unik nomor tagihan berdasarkan total baris
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })

    const nextSeq = (count || 0) + 1
    const invoiceNumber = generateInvoiceNumber(nextSeq)

    const payload = {
      student_id: realStudentId,
      invoice_number: invoiceNumber,
      program_name: input.programName.trim(),
      amount: Math.round(input.amount),
      due_date: normalizeDateToISO(input.dueDate),
      description: input.description?.trim() || `Tagihan SPP - ${input.programName.trim()}`,
      status: 'belum_dibayar',
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert(payload)
      .select(`
        id,
        student_id,
        invoice_number,
        program_name,
        description,
        amount,
        due_date,
        status,
        rejected_reason,
        created_at,
        updated_at,
        students:student_id (
          id,
          nis,
          parent_id,
          profiles:profile_id (
            full_name
          )
        )
      `)
      .single()

    if (error || !data) {
      console.error('[ERROR] Gagal membuat invoice di Supabase:', error?.message)
      return { success: false, error: error?.message || 'Gagal menerbitkan tagihan.' }
    }

    return {
      success: true,
      data: mapRawInvoice(data),
    }
  },

  /**
   * Mengunggah bukti bayar ke Supabase Storage (receipts) & mencatat baris di tabel payments
   */
  async submitPaymentProof(input: SubmitPaymentProofInput): Promise<ServerResult<PaymentRecord>> {
    const { invoiceId, file, bankName, paymentMethod, submittedByRole, submittedByName } = input

    if (!invoiceId) {
      return { success: false, error: 'ID tagihan wajib disertakan.' }
    }

    // Ambil data invoice terlebih dahulu
    const invoice = await this.getInvoiceById(invoiceId)
    if (!invoice) {
      return { success: false, error: 'Data tagihan tidak ditemukan di sistem.' }
    }

    let fileUrl = input.receiptUrl || ''
    let storagePath = input.storagePath || ''

    // 1. Validasi dan upload berkas fisik jika dilampirkan
    if (file) {
      const fileName = input.fileName || (file instanceof File ? file.name : 'bukti_transfer.jpg')
      const fileSize = file.size
      const mimeType = file.type

      const validation = validateReceiptFile({
        name: fileName,
        size: fileSize,
        type: mimeType,
      })

      if (!validation.valid) {
        return { success: false, error: validation.error || 'Format atau ukuran berkas tidak valid.' }
      }

      await ensureAdminSession()

      const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const targetPath = `proofs/${invoice.id}/${Date.now()}_${sanitizedName}`
      const contentType = mimeType || 'image/jpeg'

      const { error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload(targetPath, file, {
          contentType,
          upsert: true,
        })

      if (uploadErr) {
        console.warn('[WARN] Gagal mengunggah berkas bukti bayar ke Supabase Storage:', uploadErr.message)
        return { success: false, error: `Gagal upload berkas: ${uploadErr.message}` }
      }

      // Ambil signed URL atau public URL
      const { data: signedData } = await supabase.storage
        .from('receipts')
        .createSignedUrl(targetPath, 60 * 60 * 24 * 365) // 1 tahun

      if (signedData?.signedUrl) {
        fileUrl = signedData.signedUrl
      } else {
        const { data: pubData } = supabase.storage.from('receipts').getPublicUrl(targetPath)
        fileUrl = pubData?.publicUrl || ''
      }

      storagePath = targetPath
    }

    // 2. Insert baris baru ke tabel payments (Audit Trail)
    const paymentPayload = {
      invoice_id: invoice.id,
      amount: invoice.amount,
      amount_paid: invoice.amount,
      transfer_receipt_file: input.fileName || 'bukti_transfer.jpg',
      proof_file_url: fileUrl || null,
      storage_path: storagePath || null,
      bank_name: bankName || 'Bank Syariah Indonesia (BSI)',
      payment_method: paymentMethod || `Transfer ${bankName || 'Bank'}`,
      submitted_at: new Date().toISOString(),
      submitted_by_role: submittedByRole || 'student',
      submitted_by_name: submittedByName || invoice.studentName,
      status: 'menunggu',
    }

    const { data: payData, error: payError } = await supabase
      .from('payments')
      .insert(paymentPayload)
      .select()
      .single()

    if (payError || !payData) {
      console.error('[ERROR] Gagal menyimpan transaksi pembayaran ke Supabase:', payError?.message)
      return { success: false, error: payError?.message || 'Gagal menyimpan pembayaran.' }
    }

    // 3. Update status invoice menjadi menunggu verifikasi
    const { error: invUpdateErr } = await supabase
      .from('invoices')
      .update({
        status: 'menunggu',
        rejected_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    if (invUpdateErr) {
      console.warn('[WARN] Gagal memperbarui status invoice:', invUpdateErr.message)
    }

    return {
      success: true,
      data: {
        id: payData.id,
        invoiceId: payData.invoice_id,
        amount: payData.amount,
        amountPaid: payData.amount_paid ? Number(payData.amount_paid) : null,
        transferReceiptFile: payData.transfer_receipt_file,
        proofFileUrl: payData.proof_file_url,
        storagePath: payData.storage_path,
        bankName: payData.bank_name,
        paymentMethod: payData.payment_method,
        submittedAt: payData.submitted_at,
        paymentDate: payData.payment_date,
        verifiedAt: payData.verified_at,
        verifiedBy: payData.verified_by,
        receiptNumber: payData.receipt_number,
        submittedByRole: payData.submitted_by_role,
        submittedByName: payData.submitted_by_name,
        status: payData.status,
        notes: payData.notes,
        createdAt: payData.created_at,
      },
    }
  },

  /**
   * Menyetujui bukti bayar, mengubah status ke lunas, dan menerbitkan kwitansi resmi KWT-YYYYMM-XXXX
   */
  async verifyPayment(
    invoiceId: string,
    options?: VerifyPaymentOptions
  ): Promise<ServerResult<{ status: 'lunas'; receiptNumber: string }>> {
    await ensureAdminSession()

    const invoice = await this.getInvoiceById(invoiceId)
    if (!invoice) {
      return { success: false, error: 'Data tagihan tidak ditemukan.' }
    }

    // Dapatkan sequence kwitansi
    const { count } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .not('receipt_number', 'is', null)

    const nextSeq = (count || 0) + 1
    const receiptNumber = generateReceiptNumber(nextSeq)
    const verifiedAt = new Date().toISOString()
    const verifiedByName = options?.verifiedByName || 'Hj. Nuraini, S.Pd'

    // Update status invoice ke lunas
    const { error: invErr } = await supabase
      .from('invoices')
      .update({
        status: 'lunas',
        rejected_reason: null,
        updated_at: verifiedAt,
      })
      .eq('id', invoice.id)

    if (invErr) {
      return { success: false, error: invErr.message }
    }

    // Update baris payment terbaru untuk invoice ini
    const latestPayment = invoice.payments?.[0]
    if (latestPayment) {
      await supabase
        .from('payments')
        .update({
          status: 'lunas',
          receipt_number: receiptNumber,
          verified_at: verifiedAt,
          notes: options?.notes || 'Pembayaran SPP terverifikasi lunas.',
        })
        .eq('id', latestPayment.id)
    } else {
      // Jika belum ada baris payment, buat baru
      await supabase.from('payments').insert({
        invoice_id: invoice.id,
        amount: invoice.amount,
        amount_paid: invoice.amount,
        status: 'lunas',
        receipt_number: receiptNumber,
        verified_at: verifiedAt,
        notes: options?.notes || 'Pembayaran SPP terverifikasi lunas.',
      })
    }

    // Buat notifikasi resmi untuk akun siswa & wali murid
    const notifTitle = 'Pembayaran SPP Terverifikasi Lunas'
    const notifMsg = `Pembayaran tagihan ${invoice.invoiceNumber} sebesar Rp ${invoice.amount.toLocaleString('id-ID')} telah diverifikasi sah. Kwitansi resmi ${receiptNumber} telah terbit.`

    await supabase.from('notifications').insert([
      {
        user_id: invoice.studentId,
        title: notifTitle,
        message: notifMsg,
        type: 'billing',
        link_url: '/student/tagihan',
      },
    ])

    return {
      success: true,
      data: {
        status: 'lunas',
        receiptNumber,
      },
    }
  },

  /**
   * Menolak bukti bayar dengan mencatat alasan penolakan
   */
  async rejectPayment(
    invoiceId: string,
    reason: string
  ): Promise<ServerResult<{ status: 'ditolak'; reason: string }>> {
    await ensureAdminSession()

    if (!reason || !reason.trim()) {
      return { success: false, error: 'Alasan penolakan wajib diisi.' }
    }

    const invoice = await this.getInvoiceById(invoiceId)
    if (!invoice) {
      return { success: false, error: 'Data tagihan tidak ditemukan.' }
    }

    const updatedAt = new Date().toISOString()
    const cleanReason = reason.trim()

    // 1. Update status invoice ke ditolak
    const { error: invErr } = await supabase
      .from('invoices')
      .update({
        status: 'ditolak',
        rejected_reason: cleanReason,
        updated_at: updatedAt,
      })
      .eq('id', invoice.id)

    if (invErr) {
      return { success: false, error: invErr.message }
    }

    // 2. Update payment terbaru
    const latestPayment = invoice.payments?.[0]
    if (latestPayment) {
      await supabase
        .from('payments')
        .update({
          status: 'ditolak',
          notes: cleanReason,
        })
        .eq('id', latestPayment.id)
    }

    // 3. Notifikasi penolakan
    await supabase.from('notifications').insert([
      {
        user_id: invoice.studentId,
        title: 'Bukti Pembayaran SPP Ditolak',
        message: `Bukti pembayaran tagihan ${invoice.invoiceNumber} ditolak. Alasan: "${cleanReason}". Silakan periksa kembali dan unggah ulang bukti yang benar.`,
        type: 'billing',
        link_url: '/student/tagihan',
      },
    ])

    return {
      success: true,
      data: {
        status: 'ditolak',
        reason: cleanReason,
      },
    }
  },

  /**
   * Menghapus tagihan secara atomik beserta pembayaran dan berkas fisiknya di storage (untuk maintenance / cleanup uji)
   */
  async deleteInvoice(invoiceId: string): Promise<ServerResult<boolean>> {
    await ensureAdminSession()

    const invoice = await this.getInvoiceById(invoiceId)
    if (!invoice) {
      return { success: true, data: true }
    }

    // Hapus berkas fisik di storage
    if (invoice.storage_path) {
      try {
        await supabase.storage.from('receipts').remove([invoice.storage_path])
      } catch (err) {
        console.warn('[WARN] Gagal menghapus berkas bukti transfer di storage:', err)
      }
    }

    // Hapus dari database (cascade menghapus baris payments)
    const { error } = await supabase.from('invoices').delete().eq('id', invoice.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: true }
  },
}
