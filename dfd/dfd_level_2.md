# Data Flow Diagram (DFD) Level 2
## Sistem Informasi Bimbingan Belajar Kota Palu

Dokumen ini membedah setiap proses utama dari DFD Level 1 menjadi sub-proses detail (Level 2). Setiap diagram disajikan secara modular dengan aliran data yang jelas, tidak ada garis bertumpuk, dan langsung mencerminkan alur teknis sistem.

---

## 1. DFD Level 2 - Proses 1.0 (Manajemen Registrasi & Akun)

Dekomposisi dari proses **1.0 Autentikasi & Akun** menangani alur pendaftaran siswa baru, verifikasi persetujuan admin, autentikasi sesi via Supabase Auth, dan relasi akun orang tua-anak.

```mermaid
flowchart LR
    Siswa["🧑‍🎓 Calon Siswa"]
    Admin["👨‍💼 Admin"]
    Ortu["👨‍👩‍👦 Orang Tua"]
    D1[("D1: Users & Profiles")]

    subgraph P1_Sub["Rincian Proses 1.0"]
        P1_1(("1.1<br/>Registrasi<br/>Mandiri"))
        P1_2(("1.2<br/>Verifikasi<br/>Pendaftaran"))
        P1_3(("1.3<br/>Autentikasi<br/>& RBAC"))
        P1_4(("1.4<br/>Penautan Akun<br/>Ortu-Siswa"))
    end

    %% 1.1
    Siswa -->|"Isi Formulir Biodata & Paket"| P1_1
    P1_1 -->|"Data Calon Siswa (Status: Pending)"| D1

    %% 1.2
    Admin -->|"Persetujuan / Aktivasi Calon Siswa"| P1_2
    P1_2 <-->|"Update Status Akun Menjadi Aktif"| D1
    P1_2 -->|"Notifikasi Akun Aktif"| Siswa

    %% 1.3
    Siswa & Admin & Ortu -->|"Email & Password Login"| P1_3
    P1_3 <-->|"Validasi Kredensial & Role"| D1
    P1_3 -->|"Sesi Token & Arahkan Dashboard"| Siswa & Admin & Ortu

    %% 1.4
    Ortu -->|"Klaim / Input NIS Anak"| P1_4
    P1_4 <-->|"Simpan Relasi parent_id"| D1
    P1_4 -->|"Daftar Profil Anak Terhubung"| Ortu
```

### Kamus Data Sub-Proses 1.0:
* `1.1`: Input: `nama_lengkap`, `email`, `no_hp`, `asal_sekolah`, `jenjang (SD/SMP/SMA)`, `paket_bimbel`. Output: Calon siswa tersimpan dengan status *pending*.
* `1.2`: Admin mengubah status siswa menjadi *active*, sistem men-generate akun Supabase Auth.
* `1.3`: Validasi login berbasis role (`admin`, `tutor`, `student`, `parent`).
* `1.4`: Menghubungkan ID akun orang tua dengan satu atau beberapa ID siswa (*multi-child switcher*).

---

## 2. DFD Level 2 - Proses 2.0 (Penjadwalan Bimbingan & Ruang Anti-Bentrok)

Dekomposisi dari proses **2.0 Penjadwalan** memperlihatkan logika deteksi bentrok ruang dan bentrok tutor (*conflict engine*).

```mermaid
flowchart LR
    Admin["👨‍💼 Admin"]
    Tutor["👨‍🏫 Tutor"]
    Siswa["🧑‍🎓 Siswa"]
    D2[("D2: Rooms & Schedules")]

    subgraph P2_Sub["Rincian Proses 2.0"]
        P2_1(("2.1<br/>Kelola Master<br/>Ruangan"))
        P2_2(("2.2<br/>Input Alokasi<br/>Sesi Jadwal"))
        P2_3(("2.3<br/>Deteksi Bentrok<br/>Jadwal"))
        P2_4(("2.4<br/>Publikasi<br/>Kalender"))
    end

    %% 2.1
    Admin -->|"Data Ruang Kelas & Kapasitas"| P2_1
    P2_1 -->|"Data Master Ruang"| D2

    %% 2.2
    Admin -->|"Pilih Kelas, Tutor, Ruang, Jam"| P2_2
    P2_2 -->|"Draft Jadwal Sesi"| P2_3

    %% 2.3
    P2_3 <-->|"Cek Overlap Jam Ruang & Tutor"| D2
    P2_3 -->|"Bentrok Terdeteksi: Alert Error"| Admin
    P2_3 -->|"Bebas Bentrok: Simpan Jadwal Valid"| D2

    %% 2.4
    D2 -->|"Jadwal Terverifikasi"| P2_4
    P2_4 -->|"Kalender Mengajar Tutor"| Tutor
    P2_4 -->|"Kalender Belajar Siswa"| Siswa
```

### Kamus Data Sub-Proses 2.0:
* `2.1`: Input data fisik ruang: `nama_ruang`, `kapasitas_kursi`, `fasilitas`.
* `2.2`: Admin menyusun draft: `id_kelas`, `id_tutor`, `id_ruang`, `hari`, `jam_mulai`, `jam_selesai`.
* `2.3`: Algoritma deteksi bentrok:
  * Ruang sama pada irisan jam: `JamMulai_Baru < JamSelesai_Lama AND JamSelesai_Baru > JamMulai_Lama`.
  * Tutor sama pada irisan jam: `JamMulai_Baru < JamSelesai_Lama AND JamSelesai_Baru > JamMulai_Lama`.
* `2.4`: Jadwal yang lolos validasi otomatis tampil pada kalender web masing-masing pengguna.

---

## 3. DFD Level 2 - Proses 3.0 (Presensi Kelas Digital)

Dekomposisi dari proses **3.0 Presensi Digital** menunjukkan alur pencatatan kehadiran oleh pengajar hingga sampai ke orang tua secara *real-time*.

```mermaid
flowchart LR
    Tutor["👨‍🏫 Tutor"]
    Ortu["👨‍👩‍👦 Orang Tua"]
    Siswa["🧑‍🎓 Siswa"]
    Admin["👨‍💼 Admin"]
    D2[("D2: Schedules")]
    D3[("D3: Attendances")]

    subgraph P3_Sub["Rincian Proses 3.0"]
        P3_1(("3.1<br/>Buka Sesi<br/>Hari Ini"))
        P3_2(("3.2<br/>Input Ceklis<br/>Kehadiran"))
        P3_3(("3.3<br/>Hitung Rekap<br/>Persentase"))
        P3_4(("3.4<br/>Distribusi<br/>Info Hadir"))
    end

    %% 3.1
    Tutor -->|"Pilih Sesi Kelas Hari Ini"| P3_1
    P3_1 <-->|"Ambil Daftar Siswa Terdaftar"| D2
    P3_1 -->|"Tampilkan Formulir Presensi"| Tutor

    %% 3.2
    Tutor -->|"Kirim Status (Hadir/Sakit/Izin/Alpa)"| P3_2
    P3_2 -->|"Catat Presensi Harian"| D3

    %% 3.3
    D3 <-->|"Agregasi Total Pertemuan & Kehadiran"| P3_3
    P3_3 -->|"Data Rekap & Persentase"| P3_4

    %% 3.4
    P3_4 -->|"Notifikasi Kehadiran Real-Time"| Ortu
    P3_4 -->|"Riwayat Kehadiran Siswa"| Siswa
    P3_4 -->|"Laporan Absensi Kelas"| Admin
```

### Kamus Data Sub-Proses 3.0:
* `3.1`: Mengambil data rombel siswa sesuai `id_jadwal` yang sedang aktif pada tanggal berjalan.
* `3.2`: Input data presensi: `id_jadwal`, `id_siswa`, `tanggal`, `status (H/S/I/A)`, `catatan_keterangan`.
* `3.3`: Rumus persentase kehadiran: `(Total Hadir / Total Sesi Berlangsung) * 100%`.
* `3.4`: Output ke dashboard orang tua: status kehadiran hari ini dan peringatan jika anak Alpa.

---

## 4. DFD Level 2 - Proses 4.0 (Pembelajaran, Modul & Evaluasi Nilai)

Dekomposisi dari proses **4.0 Modul & Nilai** menunjukkan integrasi berkas modul dengan Supabase Storage dan penyusunan rapor nilai progres belajar.

```mermaid
flowchart LR
    Tutor["👨‍🏫 Tutor"]
    Siswa["🧑‍🎓 Siswa"]
    Ortu["👨‍👩‍👦 Orang Tua"]
    D4[("D4: Materials & Grades")]
    Storage[("☁️ Supabase Storage<br/>(bucket: learning-materials)")]

    subgraph P4_Sub["Rincian Proses 4.0"]
        P4_1(("4.1<br/>Unggah Modul<br/>Pelajaran"))
        P4_2(("4.2<br/>Akses & Unduh<br/>Materi"))
        P4_3(("4.3<br/>Input Nilai &<br/>Feedback"))
        P4_4(("4.4<br/>Kalkulasi &<br/>Grafik Rapor"))
    end

    %% 4.1
    Tutor -->|"Upload Berkas PDF / Link Video"| P4_1
    P4_1 -->|"Simpan Berkas Fisik"| Storage
    P4_1 -->|"Simpan Metadata (Judul, URL)"| D4

    %% 4.2
    Siswa -->|"Klik Unduh Materi"| P4_2
    P4_2 <-->|"Ambil URL Berkas"| D4
    Storage -.->|"Download Berkas"| Siswa

    %% 4.3
    Tutor -->|"Input Skor Latihan/Tryout & Catatan"| P4_3
    P4_3 -->|"Simpan Data Nilai Siswa"| D4

    %% 4.4
    D4 <-->|"Ambil Rekap Nilai per Mapel"| P4_4
    P4_4 -->|"Grafik Tren Nilai & Evaluasi Tutor"| Ortu
    P4_4 -->|"Rapor Nilai Pribadi"| Siswa
```

### Kamus Data Sub-Proses 4.0:
* `4.1`: Berkas fisik modul disimpan di Supabase Storage; metadata disimpan di database: `id_kelas`, `id_tutor`, `judul_materi`, `file_url`, `tipe_berkas`.
* `4.2`: Siswa mengunduh berkas materi sesuai kelas yang diikutinya.
* `4.3`: Input evaluasi: `id_siswa`, `id_kelas`, `mata_pelajaran`, `judul_evaluasi`, `skor (0-100)`, `catatan_kualitatif_tutor`.
* `4.4`: Kalkulasi rata-rata skor nilai dan visualisasi tren progres belajar siswa untuk dipantau orang tua.

---

## 5. DFD Level 2 - Proses 5.0 (Tagihan & Pembayaran SPP)

Dekomposisi dari proses **5.0 Manajemen Pembayaran** memperlihatkan alur penagihan, upload struk bank ke Supabase Storage, verifikasi admin, dan penerbitan kwitansi digital.

```mermaid
flowchart LR
    Admin["👨‍💼 Admin"]
    OrtuSiswa["👨‍👩‍👦 Ortu / Siswa"]
    D5[("D5: Invoices & Payments")]
    Storage[("☁️ Supabase Storage<br/>(bucket: receipts)")]

    subgraph P5_Sub["Rincian Proses 5.0"]
        P5_1(("5.1<br/>Penerbitan<br/>Tagihan SPP"))
        P5_2(("5.2<br/>Unggah Struk<br/>Transfer Bank"))
        P5_3(("5.3<br/>Verifikasi<br/>Bukti Bayar"))
        P5_4(("5.4<br/>Terbitkan<br/>Kwitansi"))
    end

    %% 5.1
    Admin -->|"Generate Tagihan Bulanan / Paket"| P5_1
    P5_1 -->|"Simpan Invoice (Status: UNPAID)"| D5
    P5_1 -->|"Notifikasi Tagihan Baru"| OrtuSiswa

    %% 5.2
    OrtuSiswa -->|"Upload Foto Struk Bukti Transfer"| P5_2
    P5_2 -->|"Simpan Foto Struk"| Storage
    P5_2 -->|"Update Status: PENDING_VERIFICATION"| D5

    %% 5.3
    Admin -->|"Periksa Foto Struk & Mutasi Bank"| P5_3
    P5_3 <-->|"Update Status: PAID / REJECTED"| D5
    P5_3 -->|"Ditolak: Alasan Penolakan Tagihan"| OrtuSiswa

    %% 5.4
    P5_3 -->|"Disetujui: Data Pembayaran Sah"| P5_4
    P5_4 <-->|"Generate Nomor Kwitansi & Timestamp"| D5
    P5_4 -->|"Unduh Kwitansi Resmi Lunas"| OrtuSiswa
    P5_4 -->|"Laporan Rekapitulasi Kas Masuk"| Admin
```

### Kamus Data Sub-Proses 5.0:
* `5.1`: Admin menerbitkan invoice: `id_siswa`, `nomor_invoice`, `nominal`, `keterangan_periode`, `jatuh_tempo`, `status: UNPAID`.
* `5.2`: Wali/Siswa mengunggah foto struk bukti bayar ke Supabase Storage bucket `receipts`, mencatat `tanggal_transfer`, dan mengubah status invoice menjadi `PENDING_VERIFICATION`.
* `5.3`: Admin memeriksa kecocokan nominal transfer:
  * Jika tidak sesuai/buram: status kembali ke `UNPAID` disertai `catatan_penolakan`.
  * Jika sesuai: status berubah menjadi `PAID`, dicatat `verified_by` dan `verified_at`.
* `5.4`: Sistem menerbitkan kwitansi resmi digital berformat PDF (*receipt*) dengan nomor unik untuk diunduh oleh orang tua/siswa, serta mengagregasi pemasukan ke laporan kas admin.
