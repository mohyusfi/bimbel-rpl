# Data Flow Diagram (DFD) Level 2 — Pintar Yuk Kota Palu

Dokumen ini membedah setiap proses operasional dari DFD Level 1 menjadi sub-proses detail (Level 2) yang tersinkronisasi 100% dengan arsitektur kode dan skema basis data **Pintar Yuk**.

---

## 1. DFD Level 2 — Proses 1.0 (Pendaftaran Mandiri, Verifikasi & Akun RBAC)

Dekomposisi dari proses **1.0 Pendaftaran & Akun RBAC** menangani registrasi mandiri calon siswa (dengan proteksi Turnstile), verifikasi dan plotting rombel oleh staf TU, penerbitan kredensial login, dan relasi multi-child perwalian.

```mermaid
flowchart LR
    Siswa["🧑‍🎓 Calon Siswa / Ortu"]
    Admin["👨‍💼 Staf Tata Usaha"]
    Ortu["👨‍👩‍👦 Orang Tua"]
    D6[("D6: Registrations")]
    D1[("D1: Profiles & Users")]
    D2[("D2: Classes & Rooms")]

    subgraph P1_Sub["Rincian Proses 1.0"]
        P1_1(("1.1<br/>Registrasi Mandiri<br/>& Turnstile"))
        P1_2(("1.2<br/>Verifikasi Admisi<br/>& Plot Rombel"))
        P1_3(("1.3<br/>Autentikasi Sesi<br/>& RBAC Guard"))
        P1_4(("1.4<br/>Multi-Child<br/>Switcher"))
    end

    %% 1.1
    Siswa -->|"Form Biodata + Token Turnstile"| P1_1
    P1_1 -->|"Simpan Pengajuan (REG-XXXX)"| D6

    %% 1.2
    Admin -->|"Tinjau Pendaftaran & Pilih Rombel"| P1_2
    P1_2 <-->|"Periksa Kuota Kelas (Maks 12)"| D2
    P1_2 <-->|"Update Status: terverifikasi / ditolak"| D6
    P1_2 -->|"Generate Profil, NIS (PNT-XXXX) & Auth"| D1
    P1_2 -->|"Terbitkan Kredensial Masuk"| Siswa

    %% 1.3
    Siswa & Admin & Ortu -->|"Email & Password ke /masuk"| P1_3
    P1_3 <-->|"Validasi Kredensial, Status Aktif & Role"| D1
    P1_3 -->|"Sesi Token & Redireksi Dashboard"| Siswa & Admin & Ortu

    %% 1.4
    Ortu -->|"Pilih Profil Anak Aktif"| P1_4
    P1_4 <-->|"Ambil Relasi students.parent_id"| D1
    P1_4 -->|"Tampilan Data Sesuai Anak Terpilih"| Ortu
```

### Kamus Data Sub-Proses 1.0:
* `1.1`: Input pendaftaran: `student_name`, `student_email`, `student_phone`, `student_school`, `package_code (SD/SMP/SMA/UTBK)`, `parent_name`, `parent_phone`, `turnstile_token`. Output: Nomor pendaftaran `REG-YYYYMM-XXXX` dengan status `menunggu`.
* `1.2`: Staf TU menyetujui pendaftaran dan menetapkan rombel kelas aktif (`assigned_class_id`). Sistem secara transaksional membuat akun auth, baris di `profiles`, `students`, `parents`, serta meng-generate NIS `PNT-YYYY-XXXX`. Jika ditolak, sistem mencatat `rejected_reason`.
* `1.3`: Validasi login via Supabase Auth di rute `/masuk`. Jika status akun `nonaktif`, sesi otomatis ditolak (*revoked*).
* `1.4`: Memfilter data presensi, nilai, dan tagihan SPP berdasarkan profil anak yang sedang dipilih pada *child-switcher* akun orang tua.

---

## 2. DFD Level 2 — Proses 2.0 (Penjadwalan Bimbingan & Ruang Anti-Bentrok)

Dekomposisi dari proses **2.0 Penjadwalan Anti-Bentrok** memperlihatkan validasi jadwal tanpa tumpang tindih dan pembentukan sesi bimbingan kalender aktual.

```mermaid
flowchart LR
    Admin["👨‍💼 Staf TU"]
    Tutor["👨‍🏫 Tutor"]
    Siswa["🧑‍🎓 Siswa"]
    D2[("D2: Schedules & Rooms")]
    D3[("D3: Sessions & Attendances")]

    subgraph P2_Sub["Rincian Proses 2.0"]
        P2_1(("2.1<br/>Master Ruangan<br/>& Rombel"))
        P2_2(("2.2<br/>Alokasi Slot<br/>Jadwal"))
        P2_3(("2.3<br/>Conflict Engine<br/>Ruang & Tutor"))
        P2_4(("2.4<br/>Generasi Sesi<br/>Kalender Riil"))
    end

    %% 2.1
    Admin -->|"Nama Ruang, Kapasitas Kursi (10-12)"| P2_1
    P2_1 -->|"Data Master Ruang & Rombel"| D2

    %% 2.2
    Admin -->|"Pilih Rombel, Tutor, Ruang, Hari, Jam"| P2_2
    P2_2 -->|"Draft Kandidat Jadwal"| P2_3

    %% 2.3
    P2_3 <-->|"Deteksi Overlap Ruang & Tutor"| D2
    P2_3 -->|"Bentrok Terdeteksi: Blokir & Pesan Error"| Admin
    P2_3 -->|"Lolos Validasi: Simpan Jadwal Mingguan"| D2

    %% 2.4
    D2 -->|"Sinkronisasi Jadwal Aktif"| P2_4
    P2_4 -->|"Buat Entri Sesi Pertemuan Riil"| D3
    P2_4 -->|"Kalender Mengajar Tutor"| Tutor
    P2_4 -->|"Kalender Belajar Siswa"| Siswa
```

### Kamus Data Sub-Proses 2.0:
* `2.1`: Input master ruang: `room_name`, `capacity (10-12)`, `location`, `is_active`.
* `2.2`: Input draft jadwal: `class_id`, `tutor_id`, `room_id`, `day_of_week`, `start_time`, `end_time`.
* `2.3`: Algoritma deteksi bentrok:
  $$\text{Bentrok} \iff (\text{Target}_A = \text{Target}_B) \land (\text{Hari}_A = \text{Hari}_B) \land (\text{Mulai}_A < \text{Selesai}_B) \land (\text{Selesai}_A > \text{Mulai}_B)$$
* `2.4`: Dari jadwal berulang mingguan, sistem menghasilkan entri sesi bimbingan riil di tabel `sessions` dengan proteksi agar sesi lampau yang belum diabsen tidak bergeser (*overdue protection*).

---

## 3. DFD Level 2 — Proses 3.0 (Presensi Sesi Digital & Kunci Audit)

Dekomposisi dari proses **3.0 Presensi Sesi Digital** menunjukkan alur pencatatan kehadiran oleh pengajar hingga ke dashboard siswa dan orang tua dengan kunci audit 24 jam.

```mermaid
flowchart LR
    Tutor["👨‍🏫 Tutor"]
    Ortu["👨‍👩‍👦 Orang Tua"]
    Siswa["🧑‍🎓 Siswa"]
    Admin["👨‍💼 Admin"]
    D3[("D3: Sessions & Attendances")]
    D7[("D7: Notifications")]

    subgraph P3_Sub["Rincian Proses 3.0"]
        P3_1(("3.1<br/>Buka Lembar Sesi<br/>Bimbingan"))
        P3_2(("3.2<br/>Checklist Hadir<br/>& Topik"))
        P3_3(("3.3<br/>Kunci Audit Sesi<br/>(Grace 24 Jam)"))
        P3_4(("3.4<br/>Kalkulasi Rekap<br/>& Alert Alpa"))
    end

    %% 3.1
    Tutor -->|"Pilih Sesi Bimbingan Hari Ini"| P3_1
    P3_1 <-->|"Ambil Roster Siswa Rombel"| D3
    P3_1 -->|"Tampilkan Lembar Presensi Digital"| Tutor

    %% 3.2
    Tutor -->|"Checklist (hadir/sakit/izin/alpa) + Topik"| P3_2
    P3_2 -->|"Simpan Rekaman Presensi & Topik Sesi"| D3

    %% 3.3
    D3 <-->|"Evaluasi Waktu completed_at > 24 Jam"| P3_3
    P3_3 -->|"Kunci Permanen (Read-Only) Bagi Tutor"| Tutor

    %% 3.4
    D3 <-->|"Hitung Persentase Hadir: (Hadir/Total)*100%"| P3_4
    P3_4 -->|"Jika Alpa: Kirim Notifikasi Lonceng"| D7
    D7 -.->|"Peringatan Visual Absen Alpa"| Ortu
    P3_4 -->|"Status Kehadiran Real-Time"| Siswa & Ortu
    P3_4 -->|"Laporan Rekapitulasi Rombel"| Admin
```

### Kamus Data Sub-Proses 3.0:
* `3.1`: Membaca entitas `sessions` aktif pada tanggal berjalan beserta daftar siswa yang terdaftar di kelas bersangkutan via relasi `class_members`.
* `3.2`: Input presensi: `session_id`, `student_id`, `status ('hadir'|'sakit'|'izin'|'alpa')`, `notes`, serta `topic` materi yang diajarkan.
* `3.3`: Menandai `is_completed = true` dan `completed_at = NOW()`. Selama 24 jam pertama, tutor berhak mengoreksi salah klik; setelah 24 jam, status terkunci permanen.
* `3.4`: Output rekap persentase kehadiran ke dashboard siswa dan orang tua. Jika ada status `alpa`, sistem otomatis menerbitkan notifikasi ke tabel `notifications`.

---

## 4. DFD Level 2 — Proses 4.0 (Modul Belajar PPTX Interaktif & Rapor Nilai)

Dekomposisi dari proses **4.0 Modul PPTX & Rapor Nilai** menguraikan penyimpanan materi ke Supabase Storage, penampil slide presentasi PPTX in-app, dan penghitungan rata-rata kelas otomatis.

```mermaid
flowchart LR
    Tutor["👨‍🏫 Tutor"]
    Siswa["🧑‍🎓 Siswa"]
    Ortu["👨‍👩‍👦 Orang Tua"]
    D4[("D4: Materials & Grades")]
    Storage[("☁️ Supabase Storage<br/>(bucket: learning-materials)")]

    subgraph P4_Sub["Rincian Proses 4.0"]
        P4_1(("4.1<br/>Unggah Modul<br/>(PDF / PPTX)"))
        P4_2(("4.2<br/>Pratinjau Slide<br/>& Unduh Berkas"))
        P4_3(("4.3<br/>Input Skor &<br/>Hitung Rata-Rata"))
        P4_4(("4.4<br/>Grafik Tren &<br/>Rapor Evaluasi"))
    end

    %% 4.1
    Tutor -->|"Upload Modul (PDF / PPTX maks 20MB)"| P4_1
    P4_1 -->|"Simpan Berkas Fisik"| Storage
    P4_1 -->|"Simpan Metadata (Judul, Kategori, Path)"| D4

    %% 4.2
    Siswa -->|"Buka Slide Interaktif / Unduh"| P4_2
    P4_2 <-->|"Ambil URL Berkas Modul"| D4
    Storage -.->|"Render Slide PPTX / Download PDF"| Siswa

    %% 4.3
    Tutor -->|"Input Skor (0-100), Kategori & Catatan"| P4_3
    P4_3 <-->|"Hitung Nilai class_average Otomatis"| D4

    %% 4.4
    D4 <-->|"Ambil Rekap Nilai per Mapel"| P4_4
    P4_4 -->|"Grafik Tren & Catatan Evaluasi Tutor"| Ortu
    P4_4 -->|"Rapor Nilai Mandiri"| Siswa
```

### Kamus Data Sub-Proses 4.0:
* `4.1`: Berkas fisik diunggah ke bucket `learning-materials`. Metadata di tabel `materials`: `class_id`, `tutor_id`, `title`, `description`, `category ('Modul Teori'|'Latihan Soal'|'Bahan Bacaan')`, `file_type ('PDF'|'PPTX')`, `file_size`, `file_url`, `storage_path`.
* `4.2`: Siswa membuka slide presentasi interaktif PPTX langsung di peramban via `@extend-ai/react-pptx` atau mengunduh PDF.
* `4.3`: Input nilai di tabel `grades`: `student_id`, `class_id`, `tutor_id`, `subject_name`, `assessment_title`, `category ('Try Out'|'Kuis'|'Tugas')`, `score (0-100)`, `tutor_feedback`, `assessment_date`. Sistem mengagregasi dan menyimpan nilai `class_average`.
* `4.4`: Output grafik progres belajar komparatif antara nilai siswa dengan nilai rata-rata kelas bagi orang tua dan siswa.

---

## 5. DFD Level 2 — Proses 5.0 (Tagihan SPP, Bukti Bayar & Kwitansi Resmi)

Dekomposisi dari proses **5.0 Tagihan & Kwitansi SPP** memperlihatkan siklus penagihan, penyimpanan bukti transfer di Supabase Storage, verifikasi persetujuan/penolakan transparan, dan unduhan kwitansi digital.

```mermaid
flowchart LR
    Admin["👨‍💼 Staf TU"]
    OrtuSiswa["👨‍👩‍👦 Siswa / Orang Tua"]
    D5[("D5: Invoices & Payments")]
    D7[("D7: Notifications")]
    Storage[("☁️ Supabase Storage<br/>(bucket: receipts)")]

    subgraph P5_Sub["Rincian Proses 5.0"]
        P5_1(("5.1<br/>Penerbitan Tagihan<br/>SPP Resmi"))
        P5_2(("5.2<br/>Unggah Struk<br/>Transfer Bank"))
        P5_3(("5.3<br/>Verifikasi Admin<br/>& Penolakan"))
        P5_4(("5.4<br/>Penerbitan Kwitansi<br/>Digital Berstempel"))
    end

    %% 5.1
    Admin -->|"Generate Tagihan (INV-YYYYMM-XXXX)"| P5_1
    P5_1 -->|"Simpan Invoice (status: belum_dibayar)"| D5
    P5_1 -->|"Notifikasi Tagihan Baru"| OrtuSiswa

    %% 5.2
    OrtuSiswa -->|"Upload Foto Struk Bank (maks 5MB)"| P5_2
    P5_2 -->|"Simpan Berkas Gambar Struk"| Storage
    P5_2 -->|"Catat Pembayaran (status: menunggu)"| D5

    %% 5.3
    Admin -->|"Tinjau Struk via In-App Preview"| P5_3
    P5_3 <-->|"Update Status: lunas / ditolak (alasan)"| D5
    P5_3 -->|"Notifikasi Hasil Verifikasi"| D7
    D7 -.->|"Alert Status Pembayaran"| OrtuSiswa

    %% 5.4
    P5_3 -->|"Disetujui: Terbitkan Nomor KWT-XXXX"| P5_4
    P5_4 <-->|"Catat receipt_number, verified_at, verified_by"| D5
    P5_4 -->|"Unduh Lembar Kwitansi Digital Sah"| OrtuSiswa
    P5_4 -->|"Rekapitulasi Arus Kas Bimbel"| Admin
```

### Kamus Data Sub-Proses 5.0:
* `5.1`: Staf TU menerbitkan tagihan: `student_id`, `invoice_number ('INV-YYYYMM-XXXX')`, `program_name`, `amount`, `due_date`, `status: belum_dibayar`.
* `5.2`: Siswa atau Orang Tua mengunggah berkas struk ke Supabase Storage bucket `receipts`. Sistem membuat entri di tabel `payments`: `invoice_id`, `amount`, `bank_name`, `payment_method`, `submitted_by_role`, `submitted_by_name`, `status: menunggu`. Status invoice bertransisi ke `menunggu_verifikasi`.
* `5.3`: Staf TU meninjau bukti transfer:
  * Jika bukti tidak valid: Status tagihan dan pembayaran berubah menjadi `ditolak` disertai `rejected_reason` agar pengunggah dapat memperbaikinya.
  * Jika bukti sah: Status tagihan dan pembayaran berubah menjadi `lunas`, mencatat `verified_by` dan `verified_at`.
* `5.4`: Sistem men-generate nomor kwitansi resmi unik `KWT-YYYYMM-XXXX`. Lembar kwitansi digital resmi berstempel Pintar Yuk dapat dicetak atau diunduh oleh siswa dan orang tua.
