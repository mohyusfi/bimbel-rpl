# Diagram Konteks (DFD Level 0) — Pintar Yuk Kota Palu

Diagram Konteks menggambarkan batasan sistem (*system boundary*) dan hubungan pertukaran informasi antara sistem informasi bimbingan belajar **Pintar Yuk** dengan entitas luar.

---

### 1. Visualisasi Diagram Konteks

```mermaid
flowchart LR
    %% Entitas Sisi Kiri: Pengelola Bimbel
    subgraph Pihak_Internal["Pengelola Bimbel"]
        direction TB
        ADMIN["👨‍💼 Super Admin & Staf TU"]
        TUTOR["👨‍🏫 Tutor / Pengajar"]
    end

    %% Sistem di Tengah
    SYSTEM(("🎓<br/><b>SISTEM INFORMASI<br/>BIMBEL PINTAR YUK</b><br/><i>(Level 0)</i>"))

    %% Entitas Sisi Kanan: Peserta & Wali
    subgraph Pihak_Eksternal["Peserta & Wali"]
        direction TB
        STUDENT["🧑‍🎓 Siswa"]
        PARENT["👨‍👩‍👦 Orang Tua / Wali"]
    end

    %% Aliran Data Admin
    ADMIN -->|"1. Master Data, Jadwal, & Verifikasi"| SYSTEM
    SYSTEM -->|"2. Laporan & Alert Jadwal"| ADMIN

    %% Aliran Data Tutor
    TUTOR -->|"3. Presensi, Modul PPTX, & Nilai"| SYSTEM
    SYSTEM -->|"4. Jadwal Mengajar & Roster Rombel"| TUTOR

    %% Aliran Data Siswa
    STUDENT -->|"5. Registrasi & Bukti Bayar SPP"| SYSTEM
    SYSTEM -->|"6. Jadwal, Modul, Nilai, & Kwitansi"| STUDENT

    %% Aliran Data Orang Tua
    PARENT -->|"7. Bukti Bayar SPP Keluarga"| SYSTEM
    SYSTEM -->|"8. Rapor, Presensi Real-Time, & Kwitansi"| PARENT

    %% Styling visual Poster Kontras Tinggi
    style SYSTEM fill:#000000,stroke:#CB2957,stroke-width:3px,color:#ffffff
    style ADMIN fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a
    style TUTOR fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a
    style STUDENT fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a
    style PARENT fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#0f172a
```

---

### 2. Penjelasan Aliran Data Berdasarkan Penomoran

| No. | Aliran Data | Dari | Ke | Rincian Informasi Data |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Master Data, Jadwal, & Verifikasi** | Admin | Sistem | Data ruangan, tutor, paket belajar, alokasi jadwal anti-bentrok, verifikasi pendaftaran calon siswa, dan verifikasi bayar SPP. |
| **2** | **Laporan & Alert Jadwal** | Sistem | Admin | Notifikasi peringatan bentrok ruang/tutor, rekap kehadiran siswa, dan rekapitulasi keuangan. |
| **3** | **Presensi, Modul PPTX, & Nilai** | Tutor | Sistem | Checklist presensi sesi harian siswa (kunci 24 jam), unggah file modul & presentasi PPTX, serta input nilai tugas/try out. |
| **4** | **Jadwal Mengajar & Roster Rombel** | Sistem | Tutor | Kalender jadwal mengajar mingguan dan daftar siswa di tiap rombel kelas. |
| **5** | **Registrasi & Bukti Bayar SPP** | Siswa | Sistem | Form pendaftaran mandiri terproteksi Turnstile dan unggah foto struk transfer bank. |
| **6** | **Jadwal, Modul, Nilai, & Kwitansi** | Sistem | Siswa | Kalender bimbingan, modul & slide interaktif PPTX, riwayat kehadiran, rekap nilai, dan kwitansi lunas. |
| **7** | **Bukti Bayar SPP Keluarga** | Orang Tua | Sistem | Unggah bukti transfer pelunasan biaya bimbingan les anak. |
| **8** | **Rapor, Presensi Real-Time, & Kwitansi** | Sistem | Orang Tua | Status kehadiran anak hari ini (*Hadir/Sakit/Izin/Alpa*), grafik rapor nilai per mapel, catatan tutor, dan kwitansi digital lunas. |
