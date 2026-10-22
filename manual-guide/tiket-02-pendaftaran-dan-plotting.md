# Panduan Pengujian Manual — Tiket 02: Pendaftaran Calon Siswa & Verifikasi Plotting Rombel

Dokumen ini berisi panduan skenario pengujian manual langkah demi langkah untuk memverifikasi fitur pendaftaran mandiri publik dan verifikasi rombel di panel admin.

---

## 🛠️ Persiapan Lingkungan Uji

Jalankan dev server aplikasi:
```bash
npm run dev
```
Buka browser pada URL: `http://localhost:3000` (atau port dev yang muncul di terminal).

---

## 🧪 Skenario 1: Pendaftaran Calon Siswa Publik di Landing Page

**Tujuan**: Memastikan pendaftaran mandiri berhasil menyimpan data dan mengembalikan nomor tiket unik format `REG-YYYYMM-XXXX`.

### Langkah-langkah:
1. Buka halaman utama: `http://localhost:3000/`.
2. Klik tombol **"Daftar Sekarang"** pada Navbar atau Hero Section untuk membuka modal pendaftaran.
3. Isi formulir dengan data uji:
   - **Nama Lengkap Siswa**: `Bintang Pratama`
   - **Email Siswa**: `bintang.test@example.com`
   - **Nomor WhatsApp Siswa**: `081234567890`
   - **Asal Sekolah**: `SMA Negeri 1 Palu`
   - **Pilihan Paket**: `Intensif UTBK-SNBT`
   - **Nama Orang Tua/Wali**: `Bambang Pratama`
   - **Nomor WhatsApp Orang Tua**: `081298765432`
   - **Alamat Tempat Tinggal**: `Jl. Sam Ratulangi No. 12, Palu Timur`
4. Klik tombol **"Kirim Pendaftaran"**.

### Kriteria Keberhasilan:
- [ ] Modal menampilkan kartu konfirmasi pendaftaran berhasil.
- [ ] Terdapat **Tiket Pendaftaran** berformat `REG-YYYYMM-XXXX` (contoh: `REG-202610-0001`).
- [ ] Klik tombol salin tiket (icon copy), pastikan muncul indikator centang hijau (*Tersalin*).
- [ ] Status awal tercatat: **Menunggu Verifikasi**.

---

## 🧪 Skenario 2: Peninjauan Berkas di Panel Admin Pendaftaran

**Tujuan**: Memastikan data calon siswa tampil secara real-time di tabel data tata usaha.

### Langkah-langkah:
1. Masuk ke halaman login: `http://localhost:3000/masuk`.
2. Masuk sebagai **Admin Tata Usaha** (gunakan tombol Quick Demo Login Admin atau kredensial admin).
3. Buka menu navigasi **Pendaftaran** (`http://localhost:3000/admin/pendaftaran`).
4. Periksa baris teratas pada tabel pendaftar.

### Kriteria Keberhasilan:
- [ ] Nama `Bintang Pratama` muncul dengan nomor tiket `REG-YYYYMM-XXXX`.
- [ ] Kolom status menunjukkan teks semantik berstatus **Menunggu Verifikasi**.
- [ ] KPI Card *Menunggu Verifikasi* di bagian atas mencatat penambahan jumlah pendaftar.

---

## 🧪 Skenario 3: Verifikasi Calon Siswa & Plotting Rombel Kelas

**Tujuan**: Memastikan admin dapat menetapkan rombel kelas dan memindahkan calon siswa menjadi siswa aktif.

### Langkah-langkah:
1. Pada baris calon siswa `Bintang Pratama`, klik tombol aksi **"Verifikasi"** (ikon checklist).
2. Modal Verifikasi & Penempatan Rombel akan terbuka.
3. Periksa dropdown pilihan kelas rombel:
   - Pastikan terdapat indikator kapasitas kelas (contoh: `UTBK Intensif A (8/12 siswa)`).
4. Pilih kelas yang masih memiliki kuota kosong (misal: `UTBK Intensif A`).
5. Klik **"Konfirmasi & Plotting Siswa"**.

### Kriteria Keberhasilan:
- [ ] Status pendaftaran calon siswa berubah menjadi **Terverifikasi**.
- [ ] Modal kredensial muncul menampilkan:
  - NIS baru siswa (format: `TC-2026-XXX`).
  - Akun login siswa dan akun orang tua.
  - Terdapat tombol salin template pesan WhatsApp resmi.
- [ ] Buka menu **Siswa** (`/admin/siswa`), pastikan `Bintang Pratama` kini terdaftar sebagai siswa aktif.
- [ ] Pada menu **Kelas & Ruangan** (`/admin/ruangan` atau detail rombel), kuota siswa di kelas tersebut bertambah (+1).

---

## 🧪 Skenario 4: Penolakan Pendaftaran dengan Alasan Tertulis

**Tujuan**: Memastikan pendaftaran dapat ditolak secara sopan dengan catatan alasan yang tersimpan di sistem.

### Langkah-langkah:
1. Daftarkan calon siswa kedua (misal: `Andi Siswa Dummy`) melalui formulir landing page.
2. Kembali ke `/admin/pendaftaran`.
3. Pada baris calon siswa tersebut, klik tombol aksi **"Tolak"** (ikon silang merah).
4. Masukkan alasan penolakan pada kolom teks:
   - Contoh: *"Berkas Kartu Keluarga tidak terbaca dan nomor WhatsApp orang tua tidak aktif saat dikonfirmasi."*
5. Klik **"Kirim Penolakan"**.

### Kriteria Keberhasilan:
- [ ] Status berubah menjadi **Ditolak**.
- [ ] Alasan penolakan tersimpan di catatan/detail pendaftaran.
- [ ] Calon siswa yang ditolak **tidak** masuk ke tabel siswa aktif.

---

## 🧪 Skenario 5: Penegakan Batas Kapasitas Kelas (Maksimal 12 Siswa)

**Tujuan**: Memastikan sistem menolak penempatan siswa baru jika kapasitas kelas sudah mencapai 12 siswa.

### Langkah-langkah:
1. Di panel admin, coba pilih kelas yang sudah penuh (12/12 siswa).
2. Coba konfirmasi plotting siswa ke kelas tersebut.

### Kriteria Keberhasilan:
- [ ] Sistem menampilkan pesan error:  
  `Rombel [Nama Kelas] sudah penuh (12/12 siswa). Batas maksimal adalah 12 siswa.`
- [ ] Transaksi dibatalkan dan siswa tidak dipaksakan masuk ke rombel penuh.
