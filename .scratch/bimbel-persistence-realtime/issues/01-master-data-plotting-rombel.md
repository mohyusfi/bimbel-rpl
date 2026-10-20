# 01 — Master Data & Plotting Rombel Terpadu

**What to build:** Administrator dapat mengelola data master fisik dan akademik bimbel (Ruangan, Mata Pelajaran, Paket Bimbingan Belajar, Profil Tutor, dan Rombongan Belajar Kelas berkapasitas maksimal 12 siswa) secara persisten di basis data PostgreSQL Supabase. Calon Siswa yang pendaftarannya disetujui dapat di-plot langsung ke rombel aktif dengan batas kapasitas yang teruji secara ketat.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Skema tabel `tutors`, `rooms`, `courses`, `classes`, dan `class_members` terdefinisi di Drizzle ORM dan diaplikasikan ke PostgreSQL Supabase.
- [ ] Relasi profil pengguna (`profiles`) dengan peran `tutor` tersambung ke tabel `tutors`.
- [ ] Form kelola ruangan di `/admin/ruangan` dapat menambah, mengedit, dan mengubah status aktif ruangan secara permanen di database.
- [ ] Rombel kelas memiliki batas kapasitas ketat maksimal 12 siswa (`capacity <= 12`) dan sistem mencegah plotting calon siswa jika rombel telah penuh.
- [ ] Pengujian integrasi memverifikasi persistensi dan batas kapasitas rombel.
