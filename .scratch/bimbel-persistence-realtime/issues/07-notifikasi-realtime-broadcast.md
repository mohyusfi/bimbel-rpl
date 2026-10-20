# 07 — Notifikasi Waktu-Nyata (Supabase Realtime) & Broadcast Bimbel

**What to build:** Pengguna (Admin, Tutor, Siswa, Orang Tua) menerima pemberitahuan lonceng seketika (*real-time*) di peramban saat peristiwa penting terjadi (pembayaran SPP lunas/ditolak, presensi Alpa siswa dicatat, atau pengumuman resmi bimbel disiarkan). Dijalankan secara efisien melalui WebSocket langsung ke Supabase Cloud tanpa membebani kuota Vercel Free Tier dengan pembersihan koneksi (*cleanup*) otomatis saat navigasi.

**Blocked by:** 03 — Presensi Digital Sesi Kalender Aktual, 06 — Siklus Tagihan SPP, Bukti Bayar Storage, & Kwitansi Resmi

**Status:** closed

- [x] Skema tabel `notifications` terdefinisi di Drizzle ORM dengan relasi ke `profiles` dan publication `supabase_realtime` diaktifkan.
- [x] Hook klien `useRealtimeNotifications` berlangganan channel pribadi `user-notifications:${userId}` dengan mekanisme pelepasan koneksi `removeChannel` saat komponen unmount.
- [x] Peristiwa perubahan data penting memicu pembuatan baris notifikasi dan mem-push event CDC ke peramban penerima yang relevan.
- [x] Penerimaan notifikasi di klien memicu pembaruan badge lonceng merah dan mengeksekusi `queryClient.invalidateQueries` sehingga tabel terkait ter-update seketika tanpa me-refresh halaman.
- [x] Administrator di `/admin/pengumuman` dapat mem-broadcast pengumuman resmi yang langsung memunculkan notifikasi lonceng pada seluruh akun pengguna aktif.
- [x] Pengujian memverifikasi koneksi WebSocket, penanganan event, dan fungsi pelepasan saluran (*cleanup*).
