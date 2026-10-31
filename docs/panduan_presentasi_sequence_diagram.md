# Panduan Presentasi Sequence Diagram Alur Sistem (Pintar Yuk)

Dokumen ini adalah pegangan narasi (*talking points*) dan panduan visual bagi presenter untuk membawakan **Sequence Diagram Alur Sistem** kepada audiens non-teknis (stakeholder, pimpinan yayasan/lembaga, dosen penguji, orang tua murid, atau staf operasional).

Diagram visual tersimpan dalam berkas Draw.io multi-halaman:  
[sequence_diagram_presentasi.drawio](file:///home/mint/orca/workspaces/bimbel/docs-slide-presentation-make-slide-presentation/docs/sequence_diagram_presentasi.drawio)

---

## 1. Petunjuk Membuka & Mengekspor Diagram ke Slide

1. **Buka Berkas Diagram**:
   * Kunjungi [app.diagrams.net](https://app.diagrams.net) di peramban, pilih *Open Existing Diagram*, lalu unggah file `docs/sequence_diagram_presentasi.drawio`.
   * Atau gunakan ekstensi **Draw.io Integration** langsung di VS Code.
2. **Berpindah Antar Halaman (Tab)**:
   * Di bagian bawah layar Draw.io, terdapat 2 tab:
     - `1. Pendaftaran & Rombel Kelas`
     - `2. Tagihan SPP & Kwitansi`
3. **Ekspor untuk Slide Presentasi (PowerPoint / Google Slides / Keynote)**:
   * Klik menu **File** $\rightarrow$ **Export as** $\rightarrow$ **PNG...**
   * Centang opsi *Transparent Background* (jika ingin latar menyatu dengan slide) dan atur *Zoom* ke `200%` atau `300%` agar teks tajam saat diproyeksikan ke layar proyektor besar.

---

## 2. Skrip Presentasi Tab 1: Pendaftaran Siswa & Masuk Kelas

> **Tujuan Slide**: Menjelaskan bagaimana sistem mempermudah orang tua mendaftar secara mandiri, melindungi sistem dari pendaftaran palsu (*spam/bot*), serta membantu tata usaha mengatur kuota kelas agar tidak over-kapasitas.

### Narasi Pembuka:
> *"Bapak/Ibu sekalian, diagram pertama ini menggambarkan proses penerimaan siswa baru di Bimbel Pintar Yuk, dari saat orang tua mengisi formulir hingga anak resmi terdaftar di dalam kelas belajar."*

### Penjelasan Per Langkah:

* **Langkah 1 (Isi Formulir)**:
  * *"Pertama, orang tua atau calon siswa membuka portal web kami dari rumah atau ponsel mereka. Mereka mengisi data diri dan memilih jenjang paket belajar (misalnya SD, SMP, SMA, atau persiapan UTBK)."*
* **Langkah 2 (Proteksi Anti-Bot)**:
  * *"Kedua, di belakang layar, sistem secara otomatis menjalankan verifikasi keamanan Cloudflare Turnstile. Ini memastikan formulir dikirim oleh manusia asli, bukan program bot otomatis atau spam."*
* **Langkah 3 (Nomor Registrasi Instan)**:
  * *"Ketiga, orang tua langsung menerima bukti bahwa data pendaftaran telah masuk dengan Nomor Registrasi unik berformat REG-XXXX. Mereka tidak perlu takut berkasnya tercecer seperti saat memakai formulir kertas."*
* **Langkah 4 (Notifikasi ke Tata Usaha)**:
  * *"Keempat, staf tata usaha di kantor bimbel menerima notifikasi waktu-nyata di dashboard mereka bahwa ada pendaftaran baru yang siap ditinjau."*
* **Langkah 5 (Pengecekan Kuota Kelas)**:
  * *"Kelima, staf admin memeriksa berkas dan mencocokkannya dengan ketersediaan kursi di rombel kelas. Di Pintar Yuk, demi kualitas belajar prima, kuota per kelas dibatasi ketat maksimal 12 siswa."*

### Kotak Keputusan (alt):
* **Skenario Disetujui (Jalur Sukses)**:
  * *"Jika berkas lengkap dan kursi masih tersedia (Langkah 6a), admin memilih kelas yang cocok. Sistem secara otomatis (Langkah 7a) menerbitkan Nomor Induk Siswa (NIS resmi) dan membuatkan akun login. Seketika itu juga (Langkah 8a), orang tua menerima konfirmasi bahwa anak mereka resmi diterima dan sudah memiliki rombel belajar."*
* **Skenario Ditolak (Jalur Alternatif)**:
  * *"Namun, jika ternyata kelas sudah penuh atau dokumen buram (Langkah 6b), admin memasukkan alasan penolakan secara transparan. Sistem mencatatnya (Langkah 7b) dan mengirimkan pemberitahuan ke orang tua (Langkah 8b) lengkap dengan instruksi perbaikan berkas."*

---

## 3. Skrip Presentasi Tab 2: Tagihan SPP Bulanan & Kwitansi Resmi

> **Tujuan Slide**: Menunjukkan akuntabilitas dan transparansi keuangan bimbel. Mencegah bukti transfer tercecer di aplikasi pesan singkat (WhatsApp) dan memastikan kwitansi resmi hanya terbit jika dana benar-benar telah masuk.

### Narasi Pembuka:
> *"Diagram kedua ini adalah alur penagihan dan pembayaran SPP bulanan. Keunggulan utama sistem ini adalah bukti bayar tersimpan rapi di portal dan kwitansi diterbitkan secara otomatis dengan nomor seri resmi."*

### Penjelasan Per Langkah:

* **Langkah 1 & 2 (Penerbitan Tagihan)**:
  * *"Awal bulan, staf tata usaha membuat tagihan SPP bagi seluruh siswa aktif (Langkah 1). Sistem otomatis menstandarisasi Nomor Invoice unik (INV-XXXX) berstatus Belum Dibayar (Langkah 2)."*
* **Langkah 3 (Informasi Tagihan ke Orang Tua)**:
  * *"Orang tua menerima notifikasi rincian tagihan beserta nomor rekening bank resmi bimbel langsung di akun mereka."*
* **Langkah 4 & 5 (Pembayaran ke Bank)**:
  * *"Orang tua membayar lewat transfer bank atau mobile banking pilihan mereka (Langkah 4), lalu mendapatkan struk bukti transfer (Langkah 5)."*
* **Langkah 6 & 7 (Unggah Bukti Transfer)**:
  * *"Orang tua tidak perlu repot mengirim struk via WhatsApp ke staf. Cukup foto struk dan unggah langsung ke portal Pintar Yuk (Langkah 6). Status tagihan seketika berubah menjadi 'Menunggu Verifikasi' (Langkah 7)."*
* **Langkah 8 & 9 (Pemeriksaan Admin)**:
  * *"Staf admin menerima pemberitahuan (Langkah 8), lalu membuka foto bukti bayar dan mencocokkannya dengan mutasi rekening bimbel (Langkah 9)."*

### Kotak Keputusan (alt):
* **Skenario Bukti Sah / Lunas**:
  * *"Saat admin mengonfirmasi dana telah masuk (Langkah 10a), sistem otomatis mengubah tagihan menjadi LUNAS dan menerbitkan lembar Kwitansi Digital Resmi (KWT-XXXX) berstempel resmi Pintar Yuk (Langkah 11a). Orang tua langsung dapat mengunduh atau mencetak kwitansi tersebut kapan saja sebagai arsip sah (Langkah 12a)."*
* **Skenario Bukti Tidak Valid / Salah Nominal**:
  * *"Jika nominal transfer kurang atau foto struk tidak terbaca (Langkah 10b), admin memberikan catatan revisi (Langkah 11b). Orang tua langsung diberitahu dan disediakan tombol untuk mengunggah ulang bukti yang benar (Langkah 12b) tanpa harus mengulang proses dari awal."*

---

## 4. Tips Tambahan Saat Tanya-Jawab (Q&A)

1. **Jika ditanya: *'Mengapa tidak pakai payment gateway otomatis (seperti Midtrans/Xendit)?'***
   * *Jawaban*: Sesuai hasil survei operasional bimbel lokal di Kota Palu, mayoritas orang tua lebih terbiasa dan nyaman dengan metode transfer rekening langsung (BCA/Mandiri/BRI) tanpa biaya admin tambahan transaksi pihak ketiga. Sistem kami menyediakan jembatan verifikasi semi-otomatis yang aman, cepat, dan hemat biaya operasional.
2. **Jika ditanya: *'Bagaimana jika ada orang tua yang punya 2 atau 3 anak di bimbel ini?'***
   * *Jawaban*: Sistem Pintar Yuk dilengkapi fitur *Multi-Child Switcher*. Orang tua hanya perlu satu akun untuk memantau pendaftaran, presensi, rapor, maupun tagihan SPP seluruh anaknya secara terpisah tanpa perlu keluar-masuk (*logout*) akun.
