# Spesifikasi: Siklus Tagihan SPP, Bukti Bayar & Penerbitan Kwitansi Resmi (Tiket 06)

Triage Label: `ready-for-agent`

---

## Problem Statement

Pada operasional bimbingan belajar konvensional di Kota Palu, siklus penagihan SPP bulanan dan verifikasi pembayaran masih menghadapi masalah nyata:

1. **Tagihan Manual & Kurang Transparan**: Penagihan SPP sering kali dilakukan secara lisan atau pesan chat WhatsApp yang tercecer, tanpa nomor referensi tagihan terstruktur yang dapat dilacak secara akurat oleh siswa maupun orang tua.
2. **Pengunggahan & Penyimpanan Bukti Transfer Rentan Hilang**: Bukti transfer bank (struk fisik / tangkapan layar mobile banking) dikirimkan lewat obrolan instan staf tata usaha, sering kali tertimpa, terkompresi rusak, atau tidak tersimpan rapi di repositori cloud yang aman.
3. **Ketiadaan Validasi dan Riwayat Pembayaran (Audit Trail)**: Ketika bukti transfer salah nominal atau rekening tujuan tidak sesuai, staf menolak bukti bayar tanpa pencatatan alasan resmi di sistem. Jika siswa mengunggah ulang bukti baru, bukti sebelumnya hilang tanpa riwayat audit.
4. **Penerbitan Kwitansi Masih Manual**: Kwitansi pembayaran lunas masih ditulis tangan pada nota fisik konvensional. Siswa dan orang tua tidak dapat mengunduh kwitansi digital resmi berstempel lembaga sewaktu-waktu dari portal mandiri mereka.
5. **Ketergantungan pada Mock Data & LocalStorage**: Antarmuka tagihan dan pembayaran saat ini masih menyimpan transaksi di state `adminStore` lokal dan `localStorage` browser, sehingga data tagihan tidak tersinkronisasi lintas perangkat staf TU, orang tua, dan siswa secara real-time di Supabase PostgreSQL.

---

## Solution

Membangun modul **Siklus Tagihan SPP, Bukti Bayar & Penerbitan Kwitansi Resmi** terpadu yang 100% terhubung ke database Supabase PostgreSQL (tabel `invoices` & `payments`) dan Supabase Storage (bucket `receipts`):

1. **Penerbitan Tagihan SPP Resmi oleh Admin**:
   - Staf Administrasi/Tata Usaha dapat menerbitkan tagihan SPP baru untuk siswa terdaftar.
   - Penomoran tagihan terstandarisasi otomatis: `INV-YYYYMM-XXXX` (contoh: `INV-202610-0001`).
   - Setiap tagihan mencakup data siswa, nama program belajar, nominal tagihan, tanggal jatuh tempo, dan deskripsi/catatan rincian.
2. **Pengunggahan Berkas Bukti Transfer Aman ke Supabase Storage (Bucket: `receipts`)**:
   - Siswa dan Orang Tua dapat melihat kewajiban tagihan belum dibayar dan mengunggah bukti transfer bank.
   - Berkas divalidasi ketat: format legal JPG, PNG, atau PDF dengan batas ukuran maksimal 5 MB.
   - Berkas disimpan di bucket Supabase Storage `receipts` pada jalur terisolasi `proofs/{invoiceId}/{timestamp}_{filename}`.
   - Setiap unggahan mencatat entri riwayat pembayaran baru di tabel `payments` dengan data bank, metode pembayaran, pengunggah, dan timestamp pengunggahan.
   - Status tagihan bertransisi otomatis menjadi `menunggu` (Menunggu Verifikasi).
3. **Verifikasi Persetujuan & Penolakan oleh Administrator**:
   - Administrator dapat meninjau berkas bukti bayar langsung di dalam aplikasi (*in-app previewer*).
   - **Persetujuan (Approve)**: Mengubah status tagihan dan pembayaran menjadi `lunas`, mencatat profil verifikator serta tanggal verifikasi WITA, dan secara otomatis menerbitkan Nomor Kwitansi Resmi unik: `KWT-YYYYMM-XXXX`.
   - **Penolakan (Reject)**: Mengubah status menjadi `ditolak` dengan mencatat alasan penolakan (`rejectedReason`) resmi agar siswa/orang tua dapat membaca alasan penolakan dan mengunggah ulang bukti bayar yang benar.
4. **Penerbitan & Unduhan Kwitansi Digital Berstempel Resmi**:
   - Tagihan yang telah lunas menyediakan pratinjau dan unduhan kwitansi digital berstempel resmi Tadulako Cendekia lengkap dengan nomor kwitansi, rincian biaya, tanggal verifikasi, dan tanda tangan digital tata usaha.
   - Mendukung cetak langsung ke format PDF/kertas menggunakan layout cetak beresolusi tinggi.
5. **Dukungan Multi-Child Portal Orang Tua**:
   - Orang Tua dapat memfilter tagihan per anak atau menampilkan seluruh tagihan keluarga secara menyeluruh langsung dari Supabase melalui relasi `students.parent_id`.
6. **Zero Mock Data & Zero LocalStorage Fallback**:
   - Menghapus seluruh data tagihan mock dari `adminStore`.
   - Menghapus ketergantungan fallback `localStorage` dengan mekanisme auto-purge saat aplikasi dimuat.
   - Seeder database Supabase (`seed.ts`) dilengkapi dengan master data tagihan dan pembayaran nyata serta berkas gambar bukti transfer riil di bucket `receipts`.

---

## User Stories

### A. Administrator & Tata Usaha
1. As an Admin, I want to create a new SPP invoice for an enrolled student by specifying program name, amount, and due date, so that billing obligations are clearly recorded in the central database.
2. As an Admin, I want each new invoice to receive an official standardized invoice number (INV-YYYYMM-XXXX), so that invoices can be indexed and traced unambiguously.
3. As an Admin, I want to view a filterable dashboard of all invoices (All, Menunggu Verifikasi, Belum Dibayar, Lunas), so that I can monitor billing status at a glance.
4. As an Admin, I want to preview uploaded bank transfer slips directly inside a modal dialog, so that I can verify bank transactions without downloading files to my local computer.
5. As an Admin, I want to approve a valid payment proof with one click, so that the invoice status immediately transitions to "Lunas" and an official receipt number is generated.
6. As an Admin, I want the system to automatically generate a unique official receipt number (KWT-YYYYMM-XXXX) upon verification, so that legal payment receipts comply with institute standards.
7. As an Admin, I want to reject an invalid payment proof with a mandatory rejection explanation, so that the student/parent understands exactly why their payment was declined.
8. As an Admin, I want to view and print official digital receipts for verified invoices, so that physical copies can be provided upon request.

### B. Siswa (Student)
9. As a Student, I want to view all my SPP invoices and their payment status (Belum Dibayar, Menunggu Verifikasi, Lunas, Ditolak) on my billing portal, so that I know my tuition obligations.
10. As a Student, I want to see bank account destination details (Bank Syariah Indonesia / BSI) with a quick copy button, so that I can easily transfer tuition fees.
11. As a Student, I want to upload my bank transfer receipt (JPG, PNG, or PDF up to 5MB), so that staff can verify my payment.
12. As a Student, I want to receive immediate feedback if my upload violates file size (> 5MB) or file type constraints, so that I can rectify the file before submitting.
13. As a Student, I want to see a clear explanation if my payment was rejected, so that I can fix the issue and re-upload the correct receipt.
14. As a Student, I want to view and download my official stamped digital receipt once my payment is verified, so that I have proof of tuition settlement.

### C. Orang Tua (Parent)
15. As a Parent, I want to view the SPP billing status for my enrolled children, so that I can ensure their tuition is paid on time.
16. As a Parent with multiple enrolled children, I want to view invoices filtered by selected child or toggle to see all family invoices at once, so that I can manage tuition for all my children in one place.
17. As a Parent, I want to upload bank transfer receipts on behalf of my children, so that tuition payments can be submitted directly by parents.
18. As a Parent, I want to see the status change to "Menunggu Verifikasi" after uploading a receipt, so that I have peace of mind that my submission was recorded.
19. As a Parent, I want to download and print official receipts with official seal and signatures for tax or personal record keeping.

---

## Implementation Decisions

### 1. Zero Mock Data & Zero LocalStorage Fallback
- Completely decouple `invoices` from in-memory `adminStore` and `localStorage`.
- Implement auto-purge on application start to remove legacy `invoices` and `payments` cached in `localStorage` (`tc_bimbel_admin_state_v1`).
- All queries and mutations query Supabase PostgreSQL directly through `billingService`.

### 2. Service Layer: `billingService` (`src/server/services/billing.service.ts`)
- Pure server/client database service connecting to Supabase client:
  - `getInvoices(options)`: Query `invoices` joined with `students` and latest `payments`.
  - `getInvoiceById(id)`: Fetch single invoice details with complete payment audit trail.
  - `createInvoice(input)`: Generates `INV-YYYYMM-XXXX`, inserts to `invoices` table.
  - `submitPaymentProof(input)`: Validates file, uploads to Supabase Storage `receipts`, inserts record into `payments` table, updates `invoices.status = 'menunggu'`.
  - `verifyPayment(invoiceId, options)`: Generates `KWT-YYYYMM-XXXX`, updates `payments` and `invoices` to `lunas`, creates billing notification.
  - `rejectPayment(invoiceId, reason, options)`: Updates `payments` and `invoices` to `ditolak`, records `rejected_reason`, creates notification.
  - `getInvoicesByStudent(studentId)`: Resolves student UUID (including legacy `stu-1` mappings) and fetches invoices.
  - `getInvoicesByParent(parentId)`: Joins with `students` where `parent_id = parentId`.

### 3. Numbering Standard Algorithms
- **Invoice Number**: `INV-YYYYMM-XXXX` where `YYYYMM` is current year and month, and `XXXX` is a 4-digit zero-padded sequence based on existing count + 1.
- **Receipt Number**: `KWT-YYYYMM-XXXX` where `YYYYMM` is verification year and month, and `XXXX` matches the sequence number.

### 4. Storage Bucket & File Path Isolation
- Bucket: `receipts` in Supabase Storage.
- Path convention: `proofs/{invoiceId}/{timestamp}_{sanitized_fileName}`.
- Mime type detection and signed URL support for private buckets, with public URL fallback.

### 5. Seeder Integration (`src/db/seed.ts`)
- Insert sample invoices into `invoices` and `payments` tables with:
  - 1 `lunas` invoice with receipt number `KWT-202610-0001` and uploaded sample proof.
  - 1 `menunggu` invoice with uploaded sample proof.
  - 1 `belum_dibayar` invoice.
  - 1 `ditolak` invoice with rejected reason.
- Upload valid binary PNG buffer to `receipts` bucket to ensure zero broken images in UI previews.

---

## Testing Decisions

- **Test Seam**: High-level service seam at `billingService` (`src/server/services/__tests__/billing.service.test.ts`).
- **External Behavior Verification**:
  1. Invoice creation persists valid record in Supabase with `INV-YYYYMM-XXXX`.
  2. Invalid receipt file formats/sizes are rejected before upload.
  3. Valid receipt upload stores file in `receipts` storage bucket, creates `payments` record, and updates `invoices.status` to `menunggu`.
  4. Payment verification updates status to `lunas` and generates official `KWT-YYYYMM-XXXX`.
  5. Payment rejection records `rejectedReason` and updates status to `ditolak`.
  6. Re-uploading payment proof inserts a new audit trail row in `payments`.
  7. Multi-child parent query returns invoices for all associated children.
  8. Zero localStorage fallback validation.
- **Prior Art**: Follows patterns established in `learning.service.test.ts` and `schedule.service.test.ts`.

---

## Out of Scope

- Payment Gateway integration (Midtrans, Xendit, QRIS dinamis) — bimbingan belajar menggunakan alur transfer bank manual terverifikasi tata usaha sesuai PRD.
- Pembayaran cicilan/parsial (partial payment) — 1 invoice ditujukan untuk pembayaran 1 periode/paket lunas penuh.
- SMS gateway notifikasi — notifikasi ditangani via internal Supabase realtime & in-app notifications.

---

## Further Notes

- Strict compliance with AGENTS.md: zero emojis in code and messages, semantic status indicators with Lucide SVG icons, zero fake buttons, and Result pattern `ServerResult<T>`.
