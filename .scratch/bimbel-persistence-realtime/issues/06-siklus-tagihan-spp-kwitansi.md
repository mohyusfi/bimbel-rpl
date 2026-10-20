# 06 — Siklus Tagihan SPP, Bukti Bayar Storage, & Kwitansi Resmi

**What to build:** Administrator dapat menerbitkan Tagihan SPP (`invoices`) untuk siswa. Siswa atau Orang Tua dapat mengunggah foto fisik struk transfer bank ke Supabase Storage bucket privat `receipts`. Administrator dapat meninjau berkas asli, menyetujui pembayaran (menjadi Lunas dan menerbitkan nomor Kwitansi resmi `KWT-...`), atau menolak dengan alasan tertulis. Siswa dan Orang Tua dapat mencetak kwitansi tanda lunas digital resmi.

**Blocked by:** 01 — Master Data & Plotting Rombel Terpadu

**Status:** ready-for-agent

- [ ] Skema tabel `invoices` dan `payments` terdefinisi di Drizzle ORM dan diaplikasikan ke PostgreSQL Supabase.
- [ ] Bucket `receipts` dibuat di Supabase Storage dengan kebijakan RLS privat (hanya Admin dan pemilik tagihan yang dapat mengakses).
- [ ] Admin di `/admin/pembayaran` dapat membuat tagihan baru (nominal, jatuh tempo, program bimbingan) dengan status awal `belum_dibayar`.
- [ ] Modal unggah bukti di portal Siswa (`/student/tagihan`) dan Orang Tua (`/parent/tagihan`) mengunggah berkas fisik struk (JPG/PNG/PDF maksimal 5 MB) ke bucket `receipts` dan mengubah status menjadi `menunggu`.
- [ ] Aksi verifikasi Admin:
  - Disetujui: status menjadi `lunas`, mencatat waktu verifikasi, dan men-generate nomor Kwitansi resmi `KWT-YYYYMM-XXXX`.
  - Ditolak: status kembali menjadi `belum_dibayar` beserta alasan penolakan tertulis yang tampil di portal pembayar.
- [ ] Dialog cetak kwitansi digital menampilkan cap tanda lunas resmi bimbel Tadulako Cendekia.
