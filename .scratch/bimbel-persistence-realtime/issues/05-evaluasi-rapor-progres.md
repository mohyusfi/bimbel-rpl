# 05 — Evaluasi Hasil Belajar & Rapor Progres Orang Tua

**What to build:** Pengajar (Tutor) dapat mendokumentasikan nilai numerik (skala 0–100) hasil Try Out, Kuis, atau Tugas mandiri beserta umpan balik kualitatif per siswa ke basis data permanen. Siswa dan Orang Tua dapat memantau rapor perkembangan belajar lengkap dengan visualisasi grafik tren nilai antar-waktu.

**Blocked by:** 01 — Master Data & Plotting Rombel Terpadu

**Status:** ready-for-agent

- [ ] Skema tabel `grades` terdefinisi di Drizzle ORM dan diaplikasikan ke PostgreSQL Supabase.
- [ ] Formulir di `/tutor/nilai` dapat menginput nilai siswa per rombel, jenis evaluasi (Try Out, Kuis, Tugas), dan catatan umpan balik tutor.
- [ ] Rata-rata rombel kelas dihitung secara otomatis untuk membandingkan performa siswa.
- [ ] Halaman `/student/nilai` memuat riwayat nilai dan umpan balik pengajar.
- [ ] Halaman `/parent/rapor` menampilkan grafik tren nilai editorial (SVG murni) per mata pelajaran dan catatan evaluasi tutor untuk anak yang dipilih via Child Switcher.
