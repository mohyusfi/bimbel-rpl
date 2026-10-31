# Composite-Key Rate Limiting untuk Jaringan IP Bersama (Shared Wi-Fi & CGNAT)

Pintar Yuk menerapkan pembatasan laju permintaan (*rate limiting*) berlapis berbasis **Composite Subject Key** (kombinasi Cookie Sesi Perangkat `__py_rl_sid` / Fingerprint Perangkat + Identitas Target Akun + Plafon Darurat IP Longgar) pada seluruh endpoint Server Functions, alih-alih menggunakan IP Address murni pada halaman publik. Keputusan ini diambil karena puluhan siswa, tutor, dan orang tua sering mengakses sistem secara bersamaan dari satu jaringan Wi-Fi gedung bimbingan belajar/sekolah yang sama atau melalui jaringan seluler berbasis CGNAT yang berbagi satu IP publik tunggal.

## Storage Backend & Serverless Scaling

Untuk mendukung *scaling* multi-instance pada **Vercel Serverless**, penyimpanan state counter dihubungkan ke **Upstash Redis** (`@upstash/ratelimit` dan `@upstash/redis` via HTTP REST):
- **Isolasi Namespace**: Prefix otomatis `py:dev:rl:` (lokal/staging) dan `py:prod:rl:` (produksi).
- **Ephemeral Cache**: Cache lokal in-memory diaktifkan untuk menghemat kuota request Upstash (free-tier 10.000 req/hari) dan merespons penolakan spammer dalam 0ms.
- **High Availability Failover**: Jika koneksi ke Upstash mengalami timeout atau gangguan jaringan, sistem otomatis *fallback* ke in-memory sliding window lokal sehingga website tidak pernah mengalami error 500 karena masalah Redis.

## Considered Options

- **Rate Limit Murni Berbasis IP Address**: Ditolak untuk pembatasan ketat karena ketika 15–30 siswa di gedung bimbel mendaftar atau masuk secara bersamaan dari 1 IP Wi-Fi yang sama, seluruh pengguna di gedung tersebut akan terblokir (*false-positive*).
- **Composite Subject Key + Upstash Redis & Fallback (Dipilih)**: Mengisolasi kuota per perangkat/browser (`__py_rl_sid` HttpOnly cookie atau hash `IP + User-Agent`) yang dikombinasikan dengan identitas akun tujuan (`email` / `NIS` / `userId`), disinkronkan secara global via Upstash Redis Serverless, serta menempatkan batas per-IP hanya sebagai jaring pengaman tingkat tinggi (*safety ceiling* 120–1500 req/menit) terhadap serangan banjir botnet.
