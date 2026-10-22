# Spesifikasi: Integrasi Menyeluruh Backend, Frontend, dan Database (Supabase PostgreSQL)

Triage Label: `ready-for-agent`

---

## Problem Statement

Pada Sistem Informasi Bimbingan Belajar Tadulako Cendekia, antarmuka pengguna untuk 4 peran operasional (Admin, Tutor, Siswa, Orang Tua) dan halaman publik telah dibangun dengan rapi, serta skema tabel PostgreSQL telah disiapkan di Supabase. Namun, saat ini lapisan data antarmuka pengguna masih membaca dan menulis pada penyimpanan memori lokal peramban (*in-memory / localStorage mock store*). 

Kondisi ini menimbulkan masalah mendasar:
1. Data operasional (seperti pendaftaran baru, penetapan rombel kelas, jadwal bimbingan, catatan presensi, materi belajar, evaluasi nilai, tagihan SPP, dan verifikasi kwitansi) tidak tersimpan secara permanen di brankas pusat (basis data PostgreSQL Supabase).
2. Data yang dibuat di satu perangkat atau sesi peramban tidak dapat diakses oleh pengguna di perangkat lain.
3. Tabel-tabel di Supabase masih kosong karena belum ada migrasi data awal (*seed data*) yang terstruktur.
4. Tidak ada batasan yang tegas antara data yang wajib disimpan di database dan data sementara (*exceptions*) yang cukup berada di peramban pengguna.

---

## Solution

Mengintegrasikan antarmuka pengguna (Frontend), logika bisnis (Backend/Hooks), dan Database Supabase PostgreSQL secara menyeluruh:
1. Menjadikan **Database Supabase PostgreSQL** sebagai **Single Source of Truth (SSOT)** untuk seluruh entitas bisnis bimbingan belajar.
2. Mengalirkan seluruh mutasi data (pendaftaran, verifikasi, plotting rombel, pembuatan jadwal, presensi, unggah materi, input nilai, dan verifikasi tagihan SPP) langsung ke basis data melalui Supabase Client REST API (port HTTPS 443) dengan validasi aturan bisnis anti-bentrok.
3. Mengisi seluruh master data awal (paket belajar SD/SMP/SMA/UTBK, ruangan kelas, tutor, rombel aktif, jadwal, siswa, presensi, rapor, tagihan SPP, kwitansi) ke dalam basis data melalui skrip *database seeder* otomatis.
4. Menetapkan batasan pengecualian (*exceptions*) secara tegas: hanya status antarmuka sementara (filter pencarian, tab aktif, modal pop-up buka/tutup, draft isian form belum submit, dan profil anak yang aktif dipilih pada sesi peramban orang tua) yang berada di memori lokal peramban.

---

## User Stories

1. Sebagai Administrator, saya ingin seluruh pendaftaran calon siswa baru tersimpan langsung di database pusat, sehingga data pendaftar tidak hilang dan dapat ditinjau kapan saja.
2. Sebagai Administrator, saya ingin melihat daftar calon siswa yang berstatus Menunggu Verifikasi secara terpusat, sehingga tim tata usaha dapat menindaklanjutinya dalam waktu kurang dari 48 jam.
3. Sebagai Administrator, saya ingin memverifikasi pendaftaran calon siswa dan menetapkan penempatan rombel kelas (Plotting Rombel) ke kelas yang memiliki kapasitas tersedia (maksimal 12 siswa), sehingga calon siswa resmi menjadi siswa aktif di database.
4. Sebagai Administrator, saya ingin menolak pendaftaran calon siswa yang tidak memenuhi kriteria disertai alasan penolakan yang tercatat di database, sehingga status pendaftar menjadi transparan.
5. Sebagai Administrator, saya ingin mengelola master data ruangan (nama ruangan, kapasitas 10–12 kursi, fasilitas) yang tersimpan permanen di database, sehingga alokasi ruang belajar selalu akurat.
6. Sebagai Administrator, saya ingin mengelola master data paket bimbingan (SD, SMP, SMA, Intensif UTBK) beserta harga standar yang tersimpan di database, sehingga penetapan tagihan konsisten.
7. Sebagai Administrator, saya ingin mengelola data tutor (identitas, nomor telepon, latar belakang pendidikan, mata pelajaran spesialisasi) yang tersimpan di database, sehingga penugasan mengajar terdata rapi.
8. Sebagai Administrator, saya ingin membuat rombel kelas baru dengan batas maksimal 12 siswa per rombel yang tercatat di database, sehingga kualitas bimbingan intensif tetap terjaga.
9. Sebagai Administrator, saya ingin menyusun Jadwal bimbingan mingguan dengan pemeriksaan otomatis terhadap bentrok ruangan fisik pada hari dan jam yang sama, sehingga tidak terjadi tumpang tindih ruang kelas.
10. Sebagai Administrator, saya ingin menyusun Jadwal bimbingan mingguan dengan pemeriksaan otomatis terhadap bentrok penugasan tutor pada jam yang sama, sehingga tutor tidak ditugaskan di dua rombel sekaligus.
11. Sebagai Administrator, saya ingin sistem memberikan saran ruangan alternatif yang kosong jika terjadi bentrok ruangan saat menyusun jadwal, sehingga tata usaha dapat dengan cepat memilih ruang pengganti.
12. Sebagai Administrator, saya ingin menerbitkan Tagihan SPP baru untuk siswa dengan nominal biaya dan tenggat waktu tertentu yang tersimpan di database, sehingga kewajiban pembayaran tercatat resmi.
13. Sebagai Administrator, saya ingin meninjau bukti transfer pembayaran SPP yang diunggah oleh siswa atau orang tua dari penyimpanan awan, sehingga kecocokan mutasi bank dapat diverifikasi secara akurat.
14. Sebagai Administrator, saya ingin menyetujui bukti pembayaran yang valid, sehingga status tagihan otomatis berubah menjadi Lunas dan nomor Kwitansi resmi (`KWT-...`) diterbitkan oleh sistem di database.
15. Sebagai Administrator, saya ingin menolak bukti pembayaran yang buram atau salah nominal dengan mencantumkan alasan penolakan di database, sehingga pembayar dapat mengunggah ulang bukti transfer yang benar.
16. Sebagai Administrator (Super Admin), saya ingin mengelola akun staf Tata Usaha (menambah staf baru, mengubah data kontak, dan menonaktifkan akun), sehingga tata kelola operasional lembaga aman dan terkontrol.
17. Sebagai Administrator, saya ingin menyiarkan pengumuman lembaga yang tersimpan di database dan dapat dibaca oleh seluruh pengguna terdaftar, sehingga komunikasi informasi penting terpusat.
18. Sebagai Tutor, saya ingin melihat jadwal mengajar mingguan dan daftar sesi bimbingan aktif saya yang bersumber langsung dari database, sehingga saya mengetahui jadwal kelas bimbingan saya dengan pasti.
19. Sebagai Tutor, saya ingin mencatat status Presensi (Hadir, Sakit, Izin, Alpa) per siswa pada sesi bimbingan hari ini dan menyimpannya ke database, sehingga absensi harian terdokumentasi terpusat.
20. Sebagai Tutor, saya ingin menandai sesi bimbingan telah selesai beserta topik materi yang diajarkan, sehingga progres kurikulum bimbel tercatat rapi.
21. Sebagai Tutor, saya ingin mengunggah berkas Modul pembelajaran resmi (berformat PDF atau PPTX) ke penyimpanan awan dan mencatat metadatanya di database, sehingga siswa di rombel terkait dapat mengunduhnya.
22. Sebagai Tutor, saya ingin menghapus modul pembelajaran yang sudah kedaluwarsa atau salah unggah dari database dan penyimpanan awan, sehingga repositori materi selalu relevan.
23. Sebagai Tutor, saya ingin menginputkan skor Evaluasi (0–100) hasil Try Out, Kuis, atau Tugas mandiri beserta catatan evaluasi kualitatif per siswa ke dalam database, sehingga perkembangan belajar siswa terdokumentasi.
24. Sebagai Siswa, saya ingin melihat jadwal bimbingan mingguan saya yang akurat langsung dari database, sehingga saya tidak ketinggalan sesi belajar.
25. Sebagai Siswa, saya ingin mengunduh modul pembelajaran PDF atau presentasi interaktif PPTX yang dibagikan tutor rombel saya dari penyimpanan awan, sehingga saya dapat mengulang pelajaran di rumah.
26. Sebagai Siswa, saya ingin memantau riwayat presensi dan persentase kehadiran belajar saya yang dihitung dari data sesi di database, sehingga saya mengetahui rekapitulasi kehadiran saya.
27. Sebagai Siswa, saya ingin melihat nilai evaluasi Try Out, Kuis, dan Tugas beserta catatan tutor langsung dari database, sehingga saya mengetahui materi yang perlu ditingkatkan.
28. Sebagai Siswa, saya ingin melihat rincian Tagihan SPP saya dan mengunggah foto bukti transfer bank ke penyimpanan awan terproteksi, sehingga pembayaran dapat diverifikasi tata usaha.
29. Sebagai Siswa, saya ingin mengunduh atau mencetak Kwitansi resmi digital berstempel segera setelah pembayaran SPP disetujui, sehingga saya memiliki bukti pelunasan sah.
30. Sebagai Orang Tua / Wali, saya ingin menggunakan switcher anak pada satu akun perwalian untuk memantau data seluruh anak saya yang belajar di bimbel, sehingga saya tidak perlu berganti-ganti akun.
31. Sebagai Orang Tua / Wali, saya ingin melihat status kehadiran anak saya pada sesi hari ini secara transparan langsung dari database, sehingga saya merasa tenang.
32. Sebagai Orang Tua / Wali, saya ingin melihat grafik tren perkembangan nilai evaluasi anak dan catatan tutor dari database, sehingga saya dapat mendampingi proses belajar anak secara objektif.
33. Sebagai Orang Tua / Wali, saya ingin melihat kewajiban tagihan SPP anak dan mengunggah struk bukti pembayaran langsung dari portal perwalian, sehingga pembayaran les praktis.
34. Sebagai Orang Tua / Wali, saya ingin mengunduh kwitansi digital bertanda lunas untuk setiap pembayaran SPP yang telah diverifikasi tata usaha, sebagai arsip keuangan keluarga.
35. Sebagai Calon Siswa / Wali Murid (Pengguna Publik), saya ingin mengisi formulir pendaftaran bimbingan belajar di halaman utama dan menyimpannya langsung ke database, sehingga pengajuan bimbingan segera diproses oleh Tata Usaha.
36. Sebagai Calon Siswa / Wali Murid (Pengguna Publik), saya ingin menerima nomor tiket registrasi unik setelah formulir pendaftaran berhasil terkirim ke database, sehingga saya dapat melacak status pendaftaran saya.

---

## Implementation Decisions

### 1. Arsitektur Komunikasi Basis Data & API
- Seluruh pengambilan (*read*) dan manipulasi (*write*) data operasional dilakukan melalui Supabase Client REST API (port 443 HTTPS) yang dilindungi kebijakan *Row Level Security* (RLS) PostgreSQL.
- Koneksi TCP port 5432 dan 6543 dibatasi oleh kebijakan firewall lingkungan kerja; port HTTPS 443 menjadi jalur tunggal yang stabil, aman, dan kompatibel.
- Seluruh kolom basis data PostgreSQL menggunakan konvensi `snake_case`, yang dipetakan secara type-safe ke model antarmuka `camelCase` melalui lapisan repositori / layanan data (*Database Service Layer*).

### 2. Aturan Pengecualian Data (Ephemeral Client State vs Database SSOT)
- **Wajib di Database**:
  - `registrations` (Pendaftaran calon siswa)
  - `profiles`, `students`, `parents`, `tutors` (Data pengguna dan perwalian)
  - `courses`, `rooms`, `classes`, `class_members` (Master data dan rombel)
  - `schedules`, `sessions`, `attendances` (Jadwal, sesi, dan kehadiran)
  - `invoices`, `payments` (Tagihan SPP dan kwitansi)
  - `materials` (Metadata modul belajar; berkas fisik di bucket `learning-materials`)
  - `grades` (Catatan evaluasi nilai try out, kuis, tugas)
  - `notifications` (Notifikasi in-app dan pengumuman)
- **Pengecualian (TIDAK di Database)**:
  - Status UI sementara: Tab aktif, input filter/pencarian tabel, status sorting tabel, status dialog pop-up buka/tutup.
  - Draft formulir sebelum tombol simpan/submit ditekan.
  - Konteks peramban orang tua: ID anak yang sedang aktif dipilih pada switcher anak (`selectedChildId`), disimpan dalam sesi peramban.
  - Memori *cache* TanStack Query untuk optimasi perpindahan halaman tanpa *lag*.

### 3. Mesin Validasi Bentrok Jadwal (SCHED-02 Engine)
- Sebelum jadwal baru disimpan ke tabel `schedules`, sistem menjalankan validasi anti-bentrok:
  - **Bentrok Ruangan**: Terjadi jika terdapat jadwal lain pada ruangan yang sama, di hari yang sama, dengan interval waktu yang beririsan ($\text{Mulai}_A < \text{Selesai}_B \land \text{Selesai}_A > \text{Mulai}_B$).
  - **Bentrok Tutor**: Terjadi jika tutor yang bersangkutan telah dijadwalkan di rombel lain pada hari dan rentang jam yang beririsan.
- Jika terdeteksi bentrok, operasi simpan digagalkan, pesan kesalahan spesifik dikembalikan ke antarmuka, dan sistem menyajikan daftar ruangan alternatif yang sedang kosong pada jam tersebut.

### 4. Skrip Migrasi & Seeding Data Awal
- Disediakan modul *database seeder* otomatis (`npm run db:seed`) yang menginjeksikan data realistis ke dalam tabel-tabel Supabase yang masih kosong:
  - 4 paket bimbingan (SD, SMP, SMA, UTBK).
  - 4 ruangan fisik (R-Palu 01 s.d. R-Palu 04).
  - Master data tutor, kelas rombel aktif, dan penempatan anggota siswa.
  - Jadwal mingguan, sesi berjalan, dan riwayat presensi.
  - Tagihan SPP dengan nomor faktur resmi dan kwitansi lunas.
  - Modul bimbingan belajar dan rekap nilai rapor kuis/try out.

### 5. Strategi Autentikasi Pengguna & Mode Demo
- Autentikasi inti berjalan di atas Supabase Auth terintegrasi dengan tabel `profiles` (RBAC: Admin, Tutor, Siswa, Orang Tua).
- Tombol jalan pintas "Quick Login (Demo)" di halaman masuk dihubungkan langsung ke akun-akun resmi yang terdaftar di basis data, memungkinkan pengujian peran yang instan tanpa login manual yang berulang.

---

## Testing Decisions

### Apa yang Membuat Pengujian Ini Baik?
- Pengujian memverifikasi **perilaku eksternal (*observable external behavior*)**, bukan detail implementasi internal.
- Menguji integritas alur bisnis:
  - Apakah pendaftaran baru masuk ke database dan terambil oleh tata usaha?
  - Apakah jadwal yang bentrok ditolak oleh aturan validasi?
  - Apakah penugasan rombel membatasi kapasitas maksimal 12 siswa?
  - Apakah perhitungan persentase kehadiran siswa konsisten dengan status sesi Hadir/Sakit/Izin/Alpa?
  - Apakah status tagihan SPP bertransisi dari Belum Dibayar ke Menunggu Verifikasi lalu Lunas dengan nomor kwitansi yang sah?

### Modul yang Diuji
1. **Database Service & Data Adapter**: Pengujian operasi CRUD type-safe dan pemetaan kolom `snake_case` $\leftrightarrow$ `camelCase`.
2. **Mesin Deteksi Bentrok Jadwal**: Pengujian kondisi irisan waktu, ruangan alternatif, dan penolakan jadwal ganda tutor.
3. **Siklus Hidup Tagihan & Kwitansi**: Pengujian penerbitan tagihan, unggah bukti bayar, verifikasi lunas, dan penolakan pembayaran.
4. **Presensi & Perhitungan Kehadiran**: Pengujian pencatatan sesi dan kalkulasi akurat persentase kehadiran.
5. **Autentikasi & Hak Akses (RBAC)**: Pengujian login pengguna, hak akses per peran, dan isolasi data perwalian orang tua multi-anak.

### Referensi Pengujian Serupa di Repositori
- `src/lib/__tests__/schedule-conflict-persistence.test.ts`
- `src/lib/__tests__/billing-receipts-persistence.test.ts`
- `src/lib/__tests__/master-data-persistence.test.ts`
- `src/lib/__tests__/attendance-session-persistence.test.ts`
- `src/lib/__tests__/verify-auth-provisioning.test.ts`

---

## Out of Scope

1. **Payment Gateway Otomatis (Midtrans / Xendit / Virtual Account Otomatis)**: Verifikasi pembayaran SPP pada tahap ini menggunakan metode transfer manual dengan verifikasi struk oleh Tata Usaha.
2. **Ruang Kelas Virtual / Video Conference Bawaan (WebRTC)**: Platform bimbel berfokus pada kelas tatap muka fisik di Kota Palu dan distribusi materi digital.
3. **Gateway SMS / WhatsApp API Berbayar**: Notifikasi pada rilis ini terfokus pada in-app banner/lonceng melalui Supabase Realtime.
4. **Penerbitan Multi-Tenant**: Sistem dikhususkan untuk lembaga bimbingan belajar Tadulako Cendekia di Kota Palu (*single-tenant*).

---

## Further Notes

- Seluruh 15 file uji coba eksisting (211 pengujian) wajib dipertahankan kelulusannya 100% (`npm test`).
- Sistem harus lolos `npm run typecheck` tanpa galat TypeScript dan `npm run build` tanpa kendala kompilasi sebelum dinyatakan selesai.
- Jika issue tracker repositori dikonfigurasi, gunakan label triage `ready-for-agent`. Jika belum terpasang, jalankan perintah `/setup-matt-pocock-skills`.
