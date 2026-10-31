# Data Flow Diagram (DFD) Level 1 — Pintar Yuk Kota Palu

DFD Level 1 mendekomposisi sistem informasi bimbingan belajar **Pintar Yuk** menjadi **5 Proses Fungsional Utama** dan **7 Data Stores**.

---

### 1. Diagram Ikhtisar Alur Kerja Global (Global Pipeline)

Diagram ini memperlihatkan perjalanan data operasional dari hulu (pendaftaran) hingga hilir (pembayaran, presensi, & rapor):

```mermaid
flowchart LR
    %% Entitas
    S["🧑‍🎓 Siswa"]
    A["👨‍💼 Super Admin & TU"]
    T["👨‍🏫 Tutor"]
    P["👨‍👩‍👦 Orang Tua"]

    %% 5 Proses Operasional
    P1(("1.0<br/>Pendaftaran &<br/>Akun RBAC"))
    P2(("2.0<br/>Penjadwalan<br/>Anti-Bentrok"))
    P3(("3.0<br/>Presensi Sesi<br/>Digital"))
    P4(("4.0<br/>Modul PPTX &<br/>Rapor Nilai"))
    P5(("5.0<br/>Tagihan &<br/>Kwitansi SPP"))

    %% 7 Data Stores
    D1[("D1: Profiles & Users")]
    D2[("D2: Schedules & Rooms")]
    D3[("D3: Sessions & Attendances")]
    D4[("D4: Materials & Grades")]
    D5[("D5: Invoices & Payments")]
    D6[("D6: Registrations")]
    D7[("D7: Notifications")]

    %% Aliran Utama
    S -->|"Form Registrasi Mandiri"| P1
    P1 <--> D6
    P1 <--> D1
    A -->|"Verifikasi & Plot Rombel"| P1

    A -->|"Atur Sesi Jam & Ruang"| P2
    P2 <--> D2
    P2 -->|"Generate Sesi Riil"| D3

    T -->|"Checklist Presensi Sesi"| P3
    P3 <--> D3
    P3 -->|"Trigger Alert Alpa"| D7

    T -->|"Unggah Slide & Skor"| P4
    P4 <--> D4

    P & S -->|"Unggah Struk Transfer"| P5
    P5 <--> D5
    A -->|"Verifikasi & Terbitkan KWT"| P5
    P5 -->|"Trigger Notif Bayar"| D7

    %% Umpan Balik Informasi
    P2 -.->|"Info Kalender Sesi"| S & T
    P3 -.->|"Status Hadir Real-Time"| P & S
    P4 -.->|"Rapor & Materi Slide"| P & S
    P5 -.->|"Kwitansi Digital Lunas"| P & S
    D7 -.->|"Lonceng Notifikasi"| P & S & T
```

---

### 2. Dekomposisi Terperinci per Proses Operasional

#### 2.1 Proses 1.0: Pendaftaran Mandiri, Verifikasi & Penetapan Rombel
Mengelola pendaftaran mandiri calon siswa (dilindungi Cloudflare Turnstile), verifikasi oleh staf TU, plotting rombel kelas (maksimal 12 siswa), dan penerbitan kredensial login resmi.

```mermaid
flowchart LR
    Siswa["🧑‍🎓 Calon Siswa / Ortu"] -->|"Isi Formulir (Turnstile)"| P1(("1.0<br/>Pendaftaran &<br/>Akun RBAC"))
    P1 <-->|"Simpan Pengajuan (REG-XXXX)"| D6[("D6: Registrations")]
    Admin["👨‍💼 Staf TU"] -->|"Verifikasi & Plotting Rombel"| P1
    P1 <-->|"Generate Akun & Profil"| D1[("D1: Profiles & Users")]
    P1 -->|"Penerbitan NIS & Kredensial"| Siswa
```

---

#### 2.2 Proses 2.0: Penjadwalan Bimbingan & Ruang Anti-Bentrok
Mengelola master ruang fisik dan alokasi jadwal bimbingan dengan validasi anti-bentrok tutor maupun ruangan, serta otomasi pembentukan sesi kalender aktual.

```mermaid
flowchart LR
    Admin["👨‍💼 Admin / TU"] -->|"Input Sesi, Tutor, & Ruang"| P2(("2.0<br/>Penjadwalan<br/>Anti-Bentrok"))
    P2 <-->|"Deteksi Overlap Ruang & Tutor"| D2[("D2: Schedules & Rooms")]
    P2 -->|"Buat Sesi Bimbingan Kalender"| D3[("D3: Sessions & Attendances")]
    P2 -->|"Peringatan Visual Bentrok"| Admin
    P2 -->|"Kalender Mengajar"| Tutor["👨‍🏫 Tutor"]
    P2 -->|"Kalender Belajar Kelas"| Siswa["🧑‍🎓 Siswa"]
```

---

#### 2.3 Proses 3.0: Presensi Sesi Digital & Rekap Kehadiran
Tutor mencatat kehadiran siswa pada sesi pertemuan aktual (`hadir`, `sakit`, `izin`, `alpa`) dengan mekanisme kunci audit 24 jam.

```mermaid
flowchart LR
    Tutor["👨‍🏫 Tutor"] -->|"Ceklis Presensi & Topik Sesi"| P3(("3.0<br/>Presensi Sesi<br/>Digital"))
    P3 <-->|"Update Status Sesi & Hadir (Lock 24 Jam)"| D3[("D3: Sessions & Attendances")]
    P3 -->|"Trigger Alert Absen Alpa"| D7[("D7: Notifications")]
    P3 -->|"Status Hadir Real-Time"| Ortu["👨‍👩‍👦 Orang Tua"]
    P3 -->|"Rekapitulasi Persentase Hadir"| Siswa["🧑‍🎓 Siswa"]
    P3 -->|"Laporan Kehadiran Rombel"| Admin["👨‍💼 Admin"]
```

---

#### 2.4 Proses 4.0: Modul PPTX Interaktif & Rapor Nilai
Tutor mengunggah modul belajar (PDF & slide presentasi PPTX) dan menginputkan skor evaluasi (Try Out, Kuis, Tugas) dengan kalkulasi nilai rata-rata rombel otomatis.

```mermaid
flowchart LR
    Tutor["👨‍🏫 Tutor"] -->|"Unggah Modul PPTX & Input Nilai"| P4(("4.0<br/>Modul PPTX &<br/>Rapor Nilai"))
    P4 <-->|"Simpan Modul & Skor Evaluasi"| D4[("D4: Materials & Grades")]
    P4 -->|"Pratinjau Interaktif PPTX & Unduh"| Siswa["🧑‍🎓 Siswa"]
    P4 -->|"Grafik Tren Nilai & Evaluasi Tutor"| Ortu["👨‍👩‍👦 Orang Tua"]
```

---

#### 2.5 Proses 5.0: Tagihan SPP, Bukti Bayar & Kwitansi Resmi
Mengatur penerbitan tagihan (`INV-XXXX`), penerimaan bukti transfer bank di Supabase Storage, persetujuan/penolakan transparan oleh admin, dan penerbitan kwitansi digital resmi berstempel (`KWT-XXXX`).

```mermaid
flowchart LR
    Admin["👨‍💼 Admin / TU"] -->|"Terbitkan Tagihan SPP Baru"| P5(("5.0<br/>Tagihan &<br/>Kwitansi SPP"))
    OrtuSiswa["👨‍👩‍👦 Siswa / Orang Tua"] -->|"Unggah Struk Bukti Transfer"| P5
    P5 <-->|"Kelola Tagihan & Bukti Bayar"| D5[("D5: Invoices & Payments")]
    Admin -->|"Persetujuan / Penolakan (Alasan)"| P5
    P5 -->|"Notifikasi Status Pembayaran"| D7[("D7: Notifications")]
    P5 -->|"Unduh Lembar Kwitansi Lunas Resmi"| OrtuSiswa
    P5 -->|"Rekapitulasi Keuangan Lembaga"| Admin
```

---

### 3. Pemetaan 7 Data Stores ke Skema Drizzle ORM

| Data Store | Tabel Relasional Terkait | Deskripsi Entitas Basis Data |
| :--- | :--- | :--- |
| **D1: Profiles & Users** | `profiles`, `students`, `parents`, `tutors` | Akun Supabase Auth, peran RBAC, status aktif, data profil, dan relasi multi-child perwalian. |
| **D2: Schedules & Rooms** | `rooms`, `courses`, `classes`, `class_members`, `schedules` | Ruang fisik, paket bimbingan, rombel kelas (kapasitas 12), anggota kelas, dan template jadwal mingguan. |
| **D3: Sessions & Attendances** | `sessions`, `attendances` | Pertemuan nyata per tanggal kalender, topik bimbingan, status selesai, kunci audit 24 jam, dan ceklis presensi semantik (`hadir`, `sakit`, `izin`, `alpa`). |
| **D4: Materials & Grades** | `materials`, `grades` | Modul berkas di Supabase Storage (`PDF`, `PPTX`), skor evaluasi belajar (0-100), rata-rata kelas, dan umpan balik kualitatif tutor. |
| **D5: Invoices & Payments** | `invoices`, `payments` | Tagihan SPP (`INV-XXXX`), bukti transfer di bucket `receipts`, verifikasi admin, alasan penolakan, dan nomor kwitansi (`KWT-XXXX`). |
| **D6: Registrations** | `registrations` | Pendaftaran mandiri siswa (`REG-XXXX`), biodata calon murid & orang tua, status pendaftaran (`menunggu`, `terverifikasi`, `ditolak`), dan penempatan rombel. |
| **D7: Notifications** | `notifications` | Notifikasi in-app lonceng waktu-nyata (tipe: `attendance`, `billing`, `academic`, `announcement`, `registration`) dan payload Web Push. |
