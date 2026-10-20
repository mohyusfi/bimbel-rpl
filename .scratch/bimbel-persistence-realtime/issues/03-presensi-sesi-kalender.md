# 03 — Presensi Digital Sesi Kalender Aktual

**What to build:** Pengajar (Tutor) dapat membuka Sesi kegiatan bimbingan belajar aktual pada tanggal kalender tertentu dari Jadwal mingguan, mencatat status kehadiran siswa (`Hadir`, `Sakit`, `Izin`, `Alpa`), dan menutup sesi dengan topik materi yang diajarkan. Siswa dan Orang Tua dapat memantau rekap riwayat presensi dan persentase kehadiran belajar secara langsung.

**Blocked by:** 02 — Penjadwalan Bimbingan Anti-Bentrok (Conflict Detection Engine)

**Status:** ready-for-agent

- [ ] Skema tabel `sessions` dan `attendances` terdefinisi di Drizzle ORM dan diaplikasikan ke PostgreSQL Supabase.
- [ ] Tutor di `/tutor/presensi` dapat memilih tanggal sesi, mengisi status kehadiran tiap siswa, menuliskan topik pembelajaran, dan menyimpan status selesai.
- [ ] Fitur cepat *"Tandai Semua Hadir"* untuk efisiensi pengajar di kelas.
- [ ] Perhitungan persentase kehadiran siswa otomatis diperbarui berdasarkan total sesi yang telah terlaksana.
- [ ] Siswa di `/student` dan Orang Tua di `/parent/kehadiran` dapat melihat riwayat presensi sesi hari ini dan rekapitulasi kehadiran.
