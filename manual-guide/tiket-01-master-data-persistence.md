# Panduan Pengujian Manual — Tiket 01: Database Seeding & Persistensi Master Data Bimbel

Dokumen ini berisi panduan skenario pengujian manual langkah demi langkah untuk memverifikasi fungsionalitas database seeder, persistensi master data (ruangan, paket belajar, tutor, dan rombel), serta mekanisme autentikasi admin pada panel Tata Usaha.

---

## 🛠️ Persiapan Lingkungan Uji

1. **Jalankan Seeder Database**:
   Pastikan master data awal terinjeksi ke Supabase:
   ```bash
   npm run db:seed
   ```
   *Verifikasi*: Terminal menampilkan status `✅ Berhasil` dan diakhiri pesan `🎉 Database Seeding Master Data Selesai 100% Sukses!`.

2. **Jalankan Dev Server Aplikasi**:
   ```bash
   npm run dev
   ```
   Buka peramban pada URL: `http://localhost:3000` (atau port dev yang aktif).

---

## 🧪 Skenario 1: Login Admin Tata Usaha & Sinkronisasi Sesi Supabase

**Tujuan**: Memastikan akun Admin Tata Usaha (**Hj. Nuraini, S.Pd**) berhasil terautentikasi ke Supabase Auth sehingga memiliki hak akses modifikasi data via RLS (*Row Level Security*).

### Langkah-langkah:
1. Buka halaman masuk: `http://localhost:3000/masuk`.
2. Pada kartu **Portal Tata Usaha**, terdapat dua cara pengujian:
   - **Metode A (1-Click Masuk Cepat)**: Klik tombol **"Masuk Cepat Demo"** pada kartu Portal Tata Usaha.
   - **Metode B (Formulir Masuk)**:
     - Masukkan Email: `nuraini.tu@tadulakocendekia.sch.id`
     - Masukkan Kata Sandi: `password123`
     - Klik tombol **"Masuk ke Portal Tata Usaha"**.
3. Perhatikan proses redirect ke dashboard admin (`http://localhost:3000/admin`).

### Kriteria Keberhasilan:
- [ ] Berhasil masuk ke panel Dashboard Admin tanpa pesan error.
- [ ] Di pojok atas/sidebar navigasi tertera nama pengguna: **Hj. Nuraini, S.Pd** dengan peran **Tata Usaha**.
- [ ] Sesi Supabase Auth aktif di peramban (dapat dicek di DevTools Console: `await supabase.auth.getSession()` mengembalikan user ID `385ef969-c8f6-4832-9b27-90b897614011`).

---

## 🧪 Skenario 2: Menambah Ruangan Baru & Uji Clamping Kapasitas (Maks 12)

**Tujuan**: Memverifikasi penambahan ruangan fisik berhasil tersimpan langsung ke database Supabase dan mematuhi batas kapasitas maksimal 12 siswa (sesuai spesifikasi PRD).

### Langkah-langkah:
1. Buka menu **Ruangan & Fasilitas**: `http://localhost:3000/admin/ruangan`.
2. Klik tombol **"Tambah Ruangan"** di pojok kanan atas.
3. **Uji 1 (Kapasitas Standar)**:
   - **Nama Ruangan**: `Ruang Palu-5 (Boulevard)`
   - **Kapasitas Kursi**: `10`
   - **Fasilitas**: `AC Daikin 1.5 PK, Proyektor Smart TV, Whiteboard Magnetik`
   - Klik **"Simpan Ruangan"**.
4. **Uji 2 (Clamping Kapasitas Berlebih)**:
   - Klik kembali **"Tambah Ruangan"**.
   - **Nama Ruangan**: `Ruang Auditorium Besar`
   - **Kapasitas Kursi**: `30` *(melebihi batas maksimal bimbel)*
   - **Fasilitas**: `AC Sentral, Sound System`
   - Klik **"Simpan Ruangan"**.

### Kriteria Keberhasilan:
- [ ] Modal tertutup otomatis setelah tombol simpan ditekan.
- [ ] `Ruang Palu-5 (Boulevard)` muncul pada tabel ruangan dengan kapasitas **10 Kursi**.
- [ ] `Ruang Auditorium Besar` otomatis dibatasi (*clamped*) oleh sistem menjadi maksimal **12 Kursi** (bukan 30).
- [ ] Status ruangan otomatis tercatat **Aktif** dengan ikon semantik hijau.

---

## 🧪 Skenario 3: Uji Pembuktian Persistensi Database Supabase (Bukan LocalStorage)

**Tujuan**: Membuktikan bahwa ruangan yang ditambahkan benar-benar tersimpan di server database PostgreSQL Supabase dan tidak hilang saat peramban di-refresh atau dibuka di sesi baru.

### Langkah-langkah:
1. Setelah menambahkan ruangan pada Skenario 2, lakukan **Hard Refresh** pada peramban (`Ctrl + F5` atau `Cmd + Shift + R`).
2. Buka tab baru di jendela **Incognito / Private Browsing**, masuk kembali ke `/masuk` dengan akun Nuraini, lalu buka `/admin/ruangan`.
3. *(Opsional - Jalur Verifikasi Database Langsung via Terminal)*:
   Jalankan perintah berikut di terminal:
   ```bash
   node --env-file=.env --experimental-strip-types -e "
   import { createClient } from '@supabase/supabase-js';
   const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
   const { data } = await sb.from('rooms').select('room_name, capacity, is_active').order('created_at', { ascending: false }).limit(2);
   console.table(data);
   "
   ```

### Kriteria Keberhasilan:
- [ ] Setelah refresh halaman atau login di tab incognito, `Ruang Palu-5 (Boulevard)` dan `Ruang Auditorium Besar` **tetap tampil di daftar tabel**.
- [ ] Pada DevTools Network tab saat penambahan ruangan, terdapat request `POST` ke endpoint `.../rest/v1/rooms` dengan status HTTP `201 Created` / `200 OK`.
- [ ] Eksekusi verifikasi SQL/terminal membuktikan data fisik tercatat di tabel `public.rooms` Supabase.

---

## 🧪 Skenario 4: Mengedit Data Ruangan & Mengubah Status Aktif (Toggle)

**Tujuan**: Memastikan fitur update data ruangan dan pengubahan status aktif/nonaktif bekerja langsung ke database.

### Langkah-langkah:
1. Pada tabel ruangan, temukan baris `Ruang Palu-5 (Boulevard)`.
2. Klik tombol **"Edit"** (ikon pensil):
   - Ubah nama menjadi: `Ruang Palu-5 (Boulevard VIP)`
   - Ubah fasilitas menjadi: `AC Daikin 2 PK, Smart TV 65 Inch, Wi-Fi 100 Mbps`
   - Klik **"Simpan Perubahan"**.
3. Klik tombol toggle switch **Status** pada baris tersebut untuk menonaktifkan ruangan.

### Kriteria Keberhasilan:
- [ ] Nama ruangan terbarui menjadi `Ruang Palu-5 (Boulevard VIP)`.
- [ ] Fasilitas ruangan menampilkan data yang baru diperbarui.
- [ ] Teks status semantik berubah menjadi **Nonaktif** dengan ikon status netral.
- [ ] Refresh halaman: perubahan edit dan status nonaktif tetap tersimpan konsisten.

---

## 🧪 Skenario 5: Memperbarui Master Paket Belajar (Courses)

**Tujuan**: Memverifikasi pembaruan harga dan kuota pada paket belajar bimbingan tersimpan ke database.

### Langkah-langkah:
1. Masih di halaman `/admin/ruangan`, gulir ke bagian **Daftar Paket Belajar Bimbel** (atau tab Paket).
2. Temukan paket `Intensif UTBK-SNBT`.
3. Klik tombol **"Edit Paket"**:
   - Ubah Biaya/Harga menjadi: `475000`
   - Ubah Deskripsi sesuai kebutuhan.
   - Klik **"Simpan Paket"**.

### Kriteria Keberhasilan:
- [ ] Nilai harga terbarui dengan format rupiah bersih (contoh: `Rp 475.000 / bulan`).
- [ ] Counter jumlah rombel aktif (*active classes count*) menampilkan angka yang akurat sesuai rombel terkait.
- [ ] Data tersimpan di tabel `public.courses` Supabase.

---

## 🧪 Skenario 6: Memeriksa Data Dinamis Tutor & Rombel Kelas

**Tujuan**: Memastikan antarmuka panel Tutor dan Rombel memuat data hasil seeding database secara type-safe.

### Langkah-langkah:
1. **Periksa Panel Tutor**:
   - Buka menu navigasi **Data Tutor** (`http://localhost:3000/admin/tutor`).
   - Periksa 4 profil tutor bawaan hasil seeder:
     - `Kak Dian Pratiwi, S.Si` (Fisika UTBK, IPA Terpadu)
     - `Pak Hendra Wijaya, M.Pd` (Matematika Sains, TPS)
     - `Kak Nabila Syahputri, S.Pd` (Bahasa Inggris & Literasi)
     - `Kak Rizky Pratama, S.Kom` (TPS, Calistung SD)
2. **Periksa Panel Rombel Kelas**:
   - Buka menu navigasi **Siswa & Rombel** (`http://localhost:3000/admin/siswa`).
   - Periksa daftar rombel kelas:
     - `UTBK Intensif A` & `UTBK Intensif B`
     - `SMA IPA 1`
     - `SMP Prestasi A`
     - `SD Cendekia A`

### Kriteria Keberhasilan:
- [ ] Seluruh data tutor menampilkan latar belakang pendidikan dan spesialisasi mapel yang rapi dari database.
- [ ] Seluruh rombel kelas menampilkan kapasitas maksimal standar (10–12 siswa) serta nama tutor pengajar yang sesuai.

---

## 📋 Lembar Checklist Evaluasi Pengujian

| No | Skenario Uji | Status | Catatan Penguji |
| :---: | :--- | :---: | :--- |
| 1 | Eksekusi `npm run db:seed` berhasil 100% | `[ ]` | |
| 2 | Login admin Hj. Nuraini (Quick Demo & Form) aktif di Supabase | `[ ]` | |
| 3 | Tambah ruangan kapasitas 10 berhasil | `[ ]` | |
| 4 | Clamping kapasitas input 30 otomatis dijepit jadi 12 | `[ ]` | |
| 5 | Data ruangan tetap ada setelah Hard Refresh & Incognito | `[ ]` | |
| 6 | Edit nama & fasilitas ruangan berhasil tersimpan | `[ ]` | |
| 7 | Toggle status aktif/nonaktif ruangan tersimpan | `[ ]` | |
| 8 | Edit data paket belajar (courses) tersimpan | `[ ]` | |
| 9 | Panel Tutor & Rombel memuat data seeder dengan benar | `[ ]` | |
