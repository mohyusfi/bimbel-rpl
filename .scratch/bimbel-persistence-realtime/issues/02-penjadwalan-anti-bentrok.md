# 02 — Penjadwalan Bimbingan Anti-Bentrok (Conflict Detection Engine)

**What to build:** Administrator dapat menyusun Jadwal mingguan berulang yang memetakan Rombel Kelas, Tutor, Ruangan, Hari, dan Jam. Sistem menolak dan memblokir penyimpanan jika terdeteksi tabrakan waktu pada ruangan yang sama atau tutor yang sama. Tutor dan Siswa dapat melihat jadwal bimbingan mereka secara akurat.

**Blocked by:** 01 — Master Data & Plotting Rombel Terpadu

**Status:** completed

- [x] Skema tabel `schedules` terdefinisi di Drizzle ORM dan diaplikasikan ke PostgreSQL Supabase.
- [x] Mesin deteksi bentrok (*Conflict Detection Engine*) berjalan sebelum penyimpanan:
  - Mencegah bentrok ruangan: `(Ruangan_A == Ruangan_B) && (Hari_A == Hari_B) && (Mulai_A < Selesai_B) && (Selesai_A > Mulai_B)`.
  - Mencegah bentrok tutor: `(Tutor_A == Tutor_B) && (Hari_A == Hari_B) && (Mulai_A < Selesai_B) && (Selesai_A > Mulai_B)`.
- [x] Antarmuka `/admin/jadwal` menampilkan pesan peringatan merah yang jelas saat terjadi bentrok dan menonaktifkan tombol simpan.
- [x] Halaman `/tutor/jadwal` dan `/student/jadwal` memuat data jadwal bimbingan yang terdaftar resmi dari database.
- [x] Pengujian otomatis memvalidasi kasus bentrok ruangan, bentrok tutor, dan jadwal yang sah tanpa tabrakan.
