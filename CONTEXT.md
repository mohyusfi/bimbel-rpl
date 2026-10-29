# Anemone Cendekia — Domain Vocabulary

Kamus resmi domain sistem pendidikan dan pembelajaran terpadu Anemone Cendekia (Kota Palu).

## Language

**Anemone Cendekia**:
Identitas lembaga pendidikan tatap muka terpadu berbasis konsep dasar dan pendampingan personal di Kota Palu untuk jenjang SD, SMP, SMA, dan Persiapan UTBK-SNBT.
_Avoid_: Bimbel Konvensional, Les Privat Biasa, Kursus Lepas

**Metode Belajar (LearningMethod)**:
Kerangka pedagogis terstandarisasi yang diterapkan pengajar Anemone untuk membimbing siswa hingga menguasai materi dari akar masalah (Konsep Dasar, Active Recall, Deliberate Practice, Klinik Personal).
_Avoid_: Trik Cepat, Tips Kilat, Hafalan Rumus

**Jadwal (Schedule)**:
Slot waktu belajar mingguan berulang yang memetakan Kelas, Tutor, Ruangan, Hari, dan Jam.
_Avoid_: Sesi, Pertemuan, Waktu les

**Sesi (Session)**:
Satu kali pelaksanaan kegiatan belajar mengajar aktual pada tanggal kalender tertentu dari suatu Jadwal, tempat pencatatan Presensi.
_Avoid_: Jadwal harian, Kelas hari ini

**Presensi (Attendance)**:
Catatan status kehadiran siswa pada suatu Sesi, terdiri dari Hadir, Sakit, Izin, atau Alpa.
_Avoid_: Absensi, Checklist kehadiran

**Kelas / Rombel (ClassGroup)**:
Rombongan belajar berkapasitas maksimal 12 siswa yang terdaftar dalam satu Paket Bimbingan Belajar.
_Avoid_: Ruangan, Kelompok, Batch

**Modul (Learning Material)**:
Dokumen materi bimbingan belajar resmi berformat PDF atau slide presentasi interaktif PPTX yang dibagikan Tutor kepada Siswa di suatu Kelas.
_Avoid_: Berkas, File tugas, Lampiran, Tautan video

**Evaluasi / Nilai (GradeRecord)**:
Skor numerik (skala 0–100) hasil Try Out, Kuis, atau Tugas mandiri beserta catatan perkembangan kualitatif dari Tutor untuk Siswa dan Orang Tua.
_Avoid_: Rapor mentah, Poin, Angka

**Tagihan SPP (Invoice)**:
Kewajiban pembayaran biaya bimbingan belajar siswa dengan siklus status: Belum Dibayar, Menunggu Verifikasi, Lunas, atau Dibatalkan.
_Avoid_: Biaya les, Nota bayar, Tagihan kuitansi

**Kwitansi (Receipt)**:
Bukti tanda terima lunas resmi berstempel dan bernomor unik (KWT-...) yang diterbitkan sistem setelah pembayaran diverifikasi oleh Admin.
_Avoid_: Struk, Bukti transfer, Slip pembayaran

**Pendaftaran (Registration)**:
Pengajuan formulir pendaftaran bimbingan belajar secara daring oleh calon siswa atau wali dengan siklus status: Menunggu Verifikasi Admin, Terverifikasi, atau Ditolak.
_Avoid_: Sign up akun, Pendaftaran user, Registrasi email

**Calon Siswa (Applicant)**:
Peserta didik yang telah mengisi formulir pendaftaran bimbingan belajar dan sedang menunggu peninjauan serta penetapan rombel kelas oleh Bagian Tata Usaha.
_Avoid_: Akun pending, User baru, Siswa percobaan

**Profil Pengguna (UserProfile)**:
Identitas pengguna terdaftar yang memegang satu dari empat peran operasional terisolasi (Admin, Tutor, Siswa, Orang Tua) dan terikat pada akun autentikasi Supabase.
_Avoid_: Akun role, Hak akses, Role user

**Super Admin (Pimpinan Lembaga / Kepala Cabang)**:
Tingkat kewenangan administratif tertinggi pada sistem Anemone Cendekia yang dipegang oleh Pimpinan Lembaga atau Kepala Cabang. Memiliki hak penuh untuk mengelola staf Tata Usaha (termasuk membuat akun admin baru), meninjau laporan keuangan agregat, serta mengawasi seluruh operasional bimbingan belajar tanpa batasan rombel.
_Avoid_: Master admin, Root user, Admin utama, Owner sistem

**Orang Tua / Wali (ParentGuardian)**:
Akun perwalian resmi yang dapat terhubung ke satu atau lebih Siswa aktif melalui relasi multi-child untuk memantau presensi, rapor progres, serta riwayat tagihan SPP.
_Avoid_: Customer, Pembayar, Akun keluarga

**Kredensial Akses (User Credentials)**:
Identitas autentikasi digital berupa Email atau Nomor Induk Siswa (NIS) beserta kata sandi yang diterbitkan resmi oleh Tata Usaha setelah pendaftaran disetujui, digunakan untuk otorisasi akses ke portal layanan peran masing-masing.
_Avoid_: Token masuk, Kunci login, Akun publik

**Plotting Rombel (Class Plotting)**:
Penetapan penempatan calon siswa terverifikasi ke dalam rombongan belajar aktif (maksimal 12 siswa) yang sesuai dengan paket bimbingan belajar dan ketersediaan kursi ruangan.
_Avoid_: Penjurusan, Pembagian kelompok, Alokasi kursi manual

**Notifikasi (In-App Notification)**:
Pemberitahuan lonceng waktu-nyata (*real-time*) pada antarmuka sistem untuk peristiwa penting (verifikasi/penolakan SPP, presensi Alpa siswa, nilai evaluasi baru, dan siaran pengumuman) yang disalurkan via Supabase Realtime.
_Avoid_: Pesan inbox, SMS gateway, Notif popup mentah, Alert email

**Pengumuman Resmi (Announcement)**:
Siaran informasi operasional lembaga yang diterbitkan oleh Administrator untuk target audiens tertentu (Semua, Siswa, Orang Tua, atau Tutor) dan didistribusikan secara serentak ke lonceng notifikasi pengguna.
_Avoid_: Broadcast WA, Buletin, Banner promo, Surat edaran
