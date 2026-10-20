# 04 — Distribusi Modul Pembelajaran & Integrasi Cloud Storage

**What to build:** Tutor dapat mengunggah berkas Modul pembelajaran fisik (PDF dan PPTX) ke Supabase Storage bucket terproteksi `learning-materials`. Siswa yang terdaftar aktif pada kelas bersangkutan dapat membuka pratinjau dokumen di peramban dan mengunduh berkas materi secara aman.

**Blocked by:** 01 — Master Data & Plotting Rombel Terpadu

**Status:** completed

- [x] Skema tabel `materials` terdefinisi di Drizzle ORM dan diaplikasikan ke PostgreSQL Supabase.
- [x] Bucket `learning-materials` dibuat di Supabase Storage dengan kebijakan RLS (hanya tutor pengampu yang dapat mengunggah; siswa terdaftar dalam kelas yang dapat mengunduh).
- [x] Formulir di `/tutor/materi` mengunggah berkas fisik (PDF/PPTX maksimal 20 MB) ke Supabase Storage dan menyimpan URL metadata ke tabel `materials`.
- [x] Halaman `/student/materi` menampilkan modul yang sesuai dengan rombel siswa, mendukung pengunduhan langsung dan pratinjau dokumen di `/student/preview.$materialId`.
