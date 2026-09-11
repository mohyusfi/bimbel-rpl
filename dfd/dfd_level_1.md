# Data Flow Diagram (DFD) Level 1 - Revisi Modular
## Sistem Informasi Bimbingan Belajar Kota Palu

DFD Level 1 mendekomposisi sistem menjadi **5 Proses Fungsional Utama**. Agar mudah dibaca dan tidak terjadi garis silang (*spider-web lines*), disajikan **Diagram Ikhtisar Global** diikuti oleh **Dekomposisi per Modul Proses**.

---

### 1. Diagram Ikhtisar Alur Kerja Global (Global Pipeline)

Diagram ini memperlihatkan perjalanan data operasional dari hulu (pendaftaran) hingga hilir (pembayaran & rapor):

```mermaid
flowchart LR
    %% Entitas
    S["🧑‍🎓 Siswa"]
    A["👨‍💼 Admin"]
    T["👨‍🏫 Tutor"]
    P["👨‍👩‍👦 Orang Tua"]

    %% Proses
    P1(("1.0<br/>Registrasi &<br/>Akun"))
    P2(("2.0<br/>Penjadwalan<br/>Anti-Bentrok"))
    P3(("3.0<br/>Presensi<br/>Digital"))
    P4(("4.0<br/>Materi &<br/>Rapor"))
    P5(("5.0<br/>Pembayaran<br/>SPP"))

    %% Data Stores
    D1[("D1: Users")]
    D2[("D2: Jadwal & Ruang")]
    D3[("D3: Presensi")]
    D4[("D4: Materi & Nilai")]
    D5[("D5: Transaksi SPP")]

    %% Aliran
    S -->|"Daftar"| P1 <--> D1
    A -->|"Atur Sesi"| P2 <--> D2
    T -->|"Ceklis Hadir"| P3 <--> D3
    T -->|"Unggah & Nilai"| P4 <--> D4
    P & S -->|"Bayar"| P5 <--> D5

    %% Umpan Balik Informasi
    P2 -.->|"Info Jadwal"| S & T
    P3 -.->|"Status Hadir"| P
    P4 -.->|"Rapor & Modul"| P & S
    P5 -.->|"Kwitansi Lunas"| P & S
    A -.->|"Verifikasi"| P1 & P5
```

---

### 2. Dekomposisi Terperinci per Proses (Bebas Garis Ruwet)

Berikut rincian masing-masing proses sehingga setiap alur masukan, proses, penyimpanan (*data store*), dan keluaran terlihat sangat jelas:

#### 2.1 Proses 1.0: Manajemen Registrasi & Akun Pengguna
Mengelola pendaftaran mandiri calon siswa, pembuatan akun wali, serta penentuan hak akses (*Role*).

```mermaid
flowchart LR
    Siswa["🧑‍🎓 Calon Siswa"] -->|"Isi Biodata & Pilihan Paket"| P1(("1.0<br/>Registrasi &<br/>Akun"))
    Admin["👨‍💼 Admin"] -->|"Verifikasi Pendaftaran & Role"| P1
    P1 <-->|"Simpan / Cek Data User"| D1[("D1: Users & Profiles")]
    P1 -->|"Hak Akses & Kredensial Login"| Siswa
```

---

#### 2.2 Proses 2.0: Penjadwalan Bimbingan & Ruang Anti-Bentrok
Mengelola master ruang kelas fisik dan jadwal bimbingan dengan validasi otomatis agar tidak ada ruang atau tutor yang bentrok di jam yang sama.

```mermaid
flowchart LR
    Admin["👨‍💼 Admin"] -->|"Input Sesi, Tutor, & Ruang"| P2(("2.0<br/>Penjadwalan<br/>Anti-Bentrok"))
    P2 <-->|"Cek Overlap Jadwal & Ruang"| D2[("D2: Classes, Rooms & Schedules")]
    P2 -->|"Peringatan Bentrok Jadwal"| Admin
    P2 -->|"Kalender Mengajar"| Tutor["👨‍🏫 Tutor"]
    P2 -->|"Kalender Belajar Kelas"| Siswa["🧑‍🎓 Siswa"]
```

---

#### 2.3 Proses 3.0: Presensi Kelas Digital
Tutor mencatat kehadiran siswa saat sesi les berlangsung, yang langsung memperbarui persentase kehadiran dan dapat dilihat oleh orang tua secara *real-time*.

```mermaid
flowchart LR
    Tutor["👨‍🏫 Tutor"] -->|"Ceklis Hadir / Sakit / Izin / Alpa"| P3(("3.0<br/>Presensi<br/>Digital"))
    P3 <-->|"Catat Riwayat Presensi"| D3[("D3: Attendances")]
    P3 -->|"Status Kehadiran Real-time"| Ortu["👨‍👩‍👦 Orang Tua"]
    P3 -->|"Rekap Kehadiran Siswa"| Siswa["🧑‍🎓 Siswa"]
    P3 -->|"Laporan Kehadiran Kelas"| Admin["👨‍💼 Admin"]
```

---

#### 2.4 Proses 4.0: Pembelajaran, Modul & Rapor Progres Nilai
Tutor mengunggah materi modul belajar (disimpan di Supabase Storage) dan menginputkan skor latihan/try out beserta catatan kualitatif evaluasi anak.

```mermaid
flowchart LR
    Tutor["👨‍🏫 Tutor"] -->|"Upload Modul & Input Nilai"| P4(("4.0<br/>Materi &<br/>Rapor Nilai"))
    P4 <-->|"Simpan Modul & Skor Nilai"| D4[("D4: Materials & Grades")]
    P4 -->|"Unduh Modul Belajar"| Siswa["🧑‍🎓 Siswa"]
    P4 -->|"Grafik Tren Nilai & Catatan Evaluasi"| Ortu["👨‍👩‍👦 Orang Tua"]
```

---

#### 2.5 Proses 5.0: Tagihan Biaya Les & Verifikasi Pembayaran SPP
Mengatur penerbitan tagihan, penerimaan bukti transfer bank, verifikasi oleh admin, dan penerbitan kwitansi digital lunas.

```mermaid
flowchart LR
    Admin["👨‍💼 Admin"] -->|"Terbitkan Tagihan SPP"| P5(("5.0<br/>Manajemen<br/>Pembayaran"))
    OrtuSiswa["👨‍👩‍👦 Orang Tua / Siswa"] -->|"Upload Bukti Transfer Bank"| P5
    P5 <-->|"Kelola Invoice & Struk Transfer"| D5[("D5: Invoices & Payments")]
    Admin -->|"Verifikasi Bukti Bayar"| P5
    P5 -->|"Unduh Kwitansi Resmi Lunas"| OrtuSiswa
    P5 -->|"Laporan Rekapitulasi Pembayaran"| Admin
```

---

### 3. Pemetaan Data Store ke Tabel Basis Data

| Data Store | Nama Tabel Relasional | Deskripsi Isi Penyimpanan |
| :--- | :--- | :--- |
| **D1: Users** | `profiles`, `students`, `parents`, `tutors` | Akun, biodata, peran (RBAC), nomor kontak, sekolah asal. |
| **D2: Jadwal & Ruang**| `rooms`, `classes`, `schedules` | Ruang kelas fisik, kapasitas, jadwal hari/jam, relasi kelas & tutor. |
| **D3: Presensi** | `attendances` | Status kehadiran harian per sesi kelas (`Hadir`, `Sakit`, `Izin`, `Alpa`). |
| **D4: Materi & Nilai**| `materials`, `grades` | Berkas modul PDF di Supabase Storage, tautan video, nilai latihan & catatan evaluasi. |
| **D5: Transaksi SPP** | `invoices`, `payments` | Nomor tagihan, nominal, berkas struk bukti transfer, status lunas, nomor kwitansi. |
