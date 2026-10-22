# Spesifikasi: Integrasi Persistensi Basis Data, Storage, dan Realtime Sistem Informasi Bimbel

## Problem Statement

Seluruh antarmuka web 4 portal (**Admin**, **Tutor**, **Siswa**, **Orang Tua**) pada Sistem Informasi Bimbel Tadulako Cendekia telah selesai dibangun, namun sebagian besar operasional inti (**Jadwal**, **Presensi**, **Modul**, **Nilai Evaluasi**, dan **Tagihan SPP**) masih bergantung pada penyimpanan memori sementara (*browser localStorage*). 

Kondisi ini mengakibatkan:
1. Data tidak tersimpan permanen di basis data pusat PostgreSQL Supabase (hanya 4 tabel dasar yang aktif dari 15 tabel yang dirancang).
2. Unggahan berkas bukti transfer SPP dan modul pembelajaran belum tersimpan fisik di *cloud storage* (hanya membaca nama berkas secara lokal di peramban).
3. Penjadwalan bimbingan belum divalidasi anti-bentrok di tingkat *database query*.
4. Perubahan data penting (seperti verifikasi pembayaran lunas, presensi alpa, atau pengumuman baru) belum dapat diterima seketika oleh pengguna lain tanpa memuat ulang (*refresh*) halaman secara manual.

## Solution

Menyambungkan seluruh siklus operasional web ke infrastruktur **Supabase Cloud** dan **Drizzle ORM** secara menyeluruh:
1. Mengimplementasikan 11 tabel relasional yang tersisa ke PostgreSQL melalui Drizzle ORM lengkap dengan kebijakan *Row-Level Security* (RLS).
2. Mengintegrasikan **Supabase Storage Buckets** (`receipts` untuk bukti pembayaran privat dan `learning-materials` untuk modul pembelajaran) dengan validasi tipe berkas dan ukuran maksimal.
3. Menerapkan mesin validasi anti-bentrok jadwal di sisi *server / query* sebelum jadwal disimpan.
4. Membangun model presensi berbasis **Sesi** kalender aktual yang terikat pada **Jadwal** mingguan berulang.
5. Memasang jalur komunikasi **Supabase Realtime (WebSocket CDC & Broadcast)** yang ringan dan ramah *Vercel Free Tier* (berjalan murni di sisi peramban klien dengan *cleanup unsubscribe*) untuk mengirimkan notifikasi lonceng seketika dan memicu revalidasi data otomatis via TanStack Query.

## User Stories

1. Sebagai Administrator, saya ingin seluruh data master ruangan, mata pelajaran, paket bimbingan, rombel kelas, tutor, dan siswa tersimpan secara permanen di database PostgreSQL, sehingga data tidak hilang saat peramban ditutup atau berpindah perangkat.
2. Sebagai Administrator, saya ingin sistem memblokir penyimpanan Jadwal baru jika terjadi bentrok ruangan fisik pada hari dan jam yang bertabrakan, sehingga tidak terjadi perebutan ruang kelas bimbingan.
3. Sebagai Administrator, saya ingin sistem memblokir penetapan Jadwal jika Tutor yang bersangkutan telah dijadwalkan mengajar di rombel lain pada jam yang sama, sehingga tidak terjadi bentrok penugasan pengajar.
4. Sebagai Administrator, saya ingin menerbitkan Tagihan SPP baru untuk Siswa dengan batas waktu pembayaran tertentu dan status awal Belum Dibayar, sehingga kewajiban biaya les tercatat resmi di sistem.
5. Sebagai Administrator, saya ingin meninjau berkas asli bukti transfer bank yang diunggah Siswa atau Orang Tua langsung dari penyimpanan awan privat, sehingga saya dapat mencocokkan mutasi rekening bimbel dengan akurat.
6. Sebagai Administrator, saya ingin dapat menyetujui pembayaran yang sah, sehingga status tagihan otomatis berubah menjadi Lunas, sistem mencatat waktu verifikasi, dan nomor Kwitansi resmi diterbitkan.
7. Sebagai Administrator, saya ingin dapat menolak bukti pembayaran yang tidak valid disertai alasan tertulis yang jelas, sehingga tagihan kembali berstatus Belum Dibayar dan pembayar dapat mengunggah ulang bukti yang benar.
8. Sebagai Administrator, saya ingin menyiarkan pengumuman resmi bimbel ke seluruh akun terdaftar, sehingga informasi penting tersampaikan secara terpusat tanpa grup pesan terpisah.
9. Sebagai Tutor, saya ingin melihat daftar Jadwal mengajar mingguan dan daftar Sesi bimbingan aktif hari ini yang diambil langsung dari database pusat.
10. Sebagai Tutor, saya ingin mencatat status Presensi per siswa (Hadir, Sakit, Izin, Alpa) pada suatu Sesi bimbingan, sehingga rekapitulasi kehadiran kelas terekam secara terstruktur.
11. Sebagai Tutor, saya ingin menutup dan menandai Sesi bimbingan hari ini telah selesai beserta catatan topik materi yang diajarkan.
12. Sebagai Tutor, saya ingin mengunggah berkas Modul pembelajaran resmi berformat PDF atau PPTX ke penyimpanan awan terproteksi, sehingga materi bimbingan dapat diakses oleh siswa di rombel kelas bersangkutan.
13. Sebagai Tutor, saya ingin menginputkan skor Evaluasi (skala 0–100) hasil Try Out, Kuis, atau Tugas beserta umpan balik kualitatif per siswa, sehingga progres belajar anak terdokumentasi rapi.
14. Sebagai Siswa, saya ingin melihat Jadwal bimbingan mingguan dan Sesi belajar saya secara akurat dari basis data.
15. Sebagai Siswa, saya ingin mengunduh berkas Modul pembelajaran yang dibagikan oleh Tutor langsung dari penyimpanan awan terproteksi.
16. Sebagai Siswa, saya ingin memantau riwayat Presensi dan persentase kehadiran belajar saya secara transparan.
17. Sebagai Siswa, saya ingin melihat nilai Evaluasi Try Out beserta umpan balik dari pengajar untuk mengevaluasi kesiapan ujian saya.
18. Sebagai Siswa, saya ingin melihat daftar Tagihan SPP saya dan mengunggah foto struk bukti pembayaran dari peramban ke penyimpanan awan.
19. Sebagai Siswa, saya ingin mengunduh atau mencetak Kwitansi digital berstempel resmi bernomor unik segera setelah pembayaran saya disetujui Admin.
20. Sebagai Orang Tua / Wali, saya ingin menggunakan fitur pergantian profil anak (*Child Switcher*) untuk memantau data belajar anak-anak saya di satu akun perwalian.
21. Sebagai Orang Tua / Wali, saya ingin memantau status Presensi anak saya pada Sesi hari ini secara langsung.
22. Sebagai Orang Tua / Wali, saya ingin menerima peringatan seketika jika anak saya berstatus Alpa pada sesi bimbingan, sehingga saya dapat segera mengonfirmasi keberadaan anak.
23. Sebagai Orang Tua / Wali, saya ingin melihat grafik perkembangan nilai Evaluasi anak dari waktu ke waktu beserta catatan tutor untuk mendampingi belajar anak di rumah.
24. Sebagai Orang Tua / Wali, saya ingin mengunggah bukti transfer pembayaran SPP anak langsung dari portal orang tua.
25. Sebagai Orang Tua / Wali, saya ingin menerima notifikasi instan pada lonceng di layar web saat pembayaran SPP anak telah disetujui oleh Administrator tanpa perlu memuat ulang peramban.
26. Sebagai Pengguna (semua peran), saya ingin koneksi notifikasi waktu-nyata berjalan langsung antara peramban saya dan Supabase Realtime secara gratis dan hemat koneksi tanpa membebani batas hosting Vercel.

## Implementation Decisions

### 1. Model Relasional Basis Data (PostgreSQL via Drizzle ORM)
- Menambahkan 11 tabel relasional baru yang merujuk pada PRD dan CONTEXT.md:
  - `tutors`: profil data pengajar, kualifikasi pendidikan, dan mata pelajaran spesialisasi.
  - `rooms`: master ruang kelas fisik dan kapasitas kursi.
  - `courses`: paket program bimbingan belajar (SD, SMP, SMA, Intensif UTBK) beserta harga standar.
  - `classes`: rombel kelompok belajar aktif (kapasitas maksimal 12 siswa) yang terikat pada `courses` dan tahun ajaran.
  - `class_members`: tabel relasi banyak-ke-banyak (*junction/pivot*) antara `students` dan `classes`.
  - `schedules`: slot waktu bimbingan mingguan berulang (memetakan `classes`, `tutors`, `rooms`, hari, jam mulai, dan jam selesai).
  - `sessions`: satu kali pertemuan aktual bimbingan pada tanggal kalender tertentu yang diturunkan dari `schedules`, menyimpan topik bahasan dan status selesai.
  - `attendances`: catatan status Presensi per siswa pada suatu `sessions` (`Hadir`, `Sakit`, `Izin`, `Alpa`) disertai catatan opsional.
  - `materials`: metadata Modul pembelajaran (PDF/PPTX) yang diunggah Tutor untuk suatu `classes`.
  - `grades`: skor Evaluasi (0–100) dan umpan balik Tutor per siswa untuk Try Out, Kuis, atau Tugas.
  - `invoices`: kewajiban Tagihan SPP dengan status `belum_dibayar`, `menunggu`, `lunas`, atau `dibatalkan`.
  - `payments`: transaksi pembayaran yang mencatat berkas bukti transfer, waktu bayar, waktu verifikasi oleh Admin, dan nomor Kwitansi resmi (`KWT-...`).
  - `notifications`: antrean riwayat notifikasi in-app per pengguna dengan status sudah dibaca (`is_read`).

### 2. Aturan Konflik Jadwal (Conflict Detection Engine)
- Divalidasi sebelum operasi penyimpanan Jadwal dieksekusi:
  - Bentrok Ruangan terjadi jika:
    $$\text{Ruangan}_A = \text{Ruangan}_B \land \text{Hari}_A = \text{Hari}_B \land \text{Mulai}_A < \text{Selesai}_B \land \text{Selesai}_A > \text{Mulai}_B$$
  - Bentrok Tutor terjadi jika:
    $$\text{Tutor}_A = \text{Tutor}_B \land \text{Hari}_A = \text{Hari}_B \land \text{Mulai}_A < \text{Selesai}_B \land \text{Selesai}_A > \text{Mulai}_B$$
- Jika terjadi bentrok, sistem menolak operasi simpan dan mengembalikan pesan kesalahan deskriptif mengenai rincian jadwal yang bertabrakan.

### 3. Arsitektur Penyimpanan Berkas (Supabase Storage)
- **Bucket `receipts`**:
  - Tipe akses: Privat.
  - Hak akses: Hanya Admin (akses baca/tulis seluruh berkas) serta Siswa/Orang Tua pemilik invoice bersangkutan (akses unggah berkas dan baca berkas miliknya).
  - Berkas yang diizinkan: JPG, PNG, PDF (maksimal 5 MB).
- **Bucket `learning-materials`**:
  - Tipe akses: Terproteksi.
  - Hak akses: Tutor dapat mengunggah berkas untuk kelas binaannya; Siswa yang terdaftar aktif dalam kelas bersangkutan dapat mengunduh berkas.
  - Berkas yang diizinkan: PDF, PPTX (maksimal 20 MB).

### 4. Arsitektur Notifikasi Waktu-Nyata (Supabase Realtime)
- Menggunakan mekanisme **Postgres CDC (*postgres_changes*)** pada tabel `notifications`:
  - Klien browser berlangganan channel pribadi dengan filter `user_id=eq.{auth_user_id}`.
  - Event `INSERT` pada tabel `notifications` memicu:
    1. Pembaruan jumlah lonceng notifikasi dan daftar notifikasi di antarmuka web secara seketika.
    2. Pemanggilan `queryClient.invalidateQueries` pada TanStack Query untuk merevalidasi tabel data terkait (misal: daftar tagihan atau daftar presensi) tanpa memerlukan *full-page reload*.
- Memanfaatkan **Broadcast Channel** untuk pengumuman darurat lembaga bimbingan belajar.
- **Pembersihan Saluran Wajib (*Unsubscribe Cleanup*)**: Semua koneksi saluran WebSocket dilepas saat komponen dilepas (*unmounted*) untuk menjaga kuota 200 koneksi bersamaan di Supabase Free Tier dan menghindari kebocoran memori pada hosting Vercel.

## Testing Decisions

### Apa yang Membuat Pengujian Ini Baik?
- Pengujian hanya memverifikasi **perilaku eksternal (*observable behavior*)**, bukan detail implementasi internal.
- Menguji alur bisnis dari perspektif pengguna dan kontrak API/basis data: apakah bentrok jadwal tertolak, apakah presensi tersimpan akurat, apakah status tagihan bertransisi sesuai aturan siklus hidupnya, dan apakah notifikasi terkirim ke pengguna yang tepat.

### Modul yang Diuji
1. **Engine Validasi Anti-Bentrok Jadwal**:
   - Memastikan tidak ada dua kelas yang menempati ruangan yang sama di jam yang beririsan.
   - Memastikan seorang tutor tidak dapat mengajar di dua rombel berbeda pada jam yang bersamaan.
   - Memastikan jadwal yang berada di hari berbeda atau jam yang tidak bertabrakan dapat disimpan secara sukses.
2. **Mesin Siklus Tagihan SPP & Verifikasi Kwitansi**:
   - Transisi status: `belum_dibayar` $\to$ `menunggu` saat bukti transfer diunggah $\to$ `lunas` saat disetujui Admin (dengan penerbitan nomor `KWT-...`).
   - Transisi penolakan: `menunggu` $\to$ `belum_dibayar` jika ditolak Admin dengan alasan tercatat.
3. **Penyimpanan Presensi Sesi**:
   - Perhitungan persentase kehadiran siswa saat status diubah menjadi Hadir, Sakit, Izin, atau Alpa.
4. **Kebersihan Saluran Realtime**:
   - Memastikan langganan saluran WebSocket memanggil fungsi `removeChannel` saat pembersihan (*cleanup*).

### Referensi Pengujian Serupa di Repositori
- `src/lib/__tests__/qa-security-verification.test.ts`: Uji isolasi keamanan hak akses peran Supabase.
- `src/lib/__tests__/admin-staff-status-and-edit.test.ts`: Uji persistensi status data staf Tata Usaha.

## Out of Scope

1. **Integrasi Payment Gateway Otomatis (Midtrans / Xendit / Virtual Account Otomatis)**: Verifikasi pembayaran SPP pada tahap ini tetap menggunakan metode transfer manual dengan verifikasi struk oleh Administrator sesuai PRD.
2. **Sistem Ruang Kelas Virtual / Video Conference Bawaan (WebRTC)**: Platform bimbel berfokus pada kelas tatap muka fisik di Kota Palu dan distribusi materi digital, bukan pembelajaran daring tatap muka video.
3. **Notifikasi SMS / WhatsApp Gateway Berbayar**: Notifikasi pada rilis ini terfokus pada notifikasi in-app web melalui Supabase Realtime.
4. **Penerbitan Multi-Tenant (Bimbel Lain)**: Arsitektur dikhususkan sebagai *single-tenant* untuk lembaga bimbingan belajar Tadulako Cendekia di Kota Palu.

## Further Notes

- Implementasi ini sepenuhnya kompatibel dengan **Vercel Free Tier (Hobby)** karena komputasi WebSocket berjalan langsung antara peramban klien dan Supabase Cloud tanpa melewati batas waktu *serverless execution* Vercel.
- Skema tabel Drizzle menggunakan pendekatan modular per domain bisnis di folder `src/db/schema/` dan diekspor melalui satu titik masuk `src/db/schema/index.ts`.
