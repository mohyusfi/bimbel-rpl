# DESIGN.md — Reusable Design System &amp; UI/UX Specification

&gt; \*\*Project profile:\*\* Sistem Informasi Bimbingan Belajar Berbasis Web, Kota Palu  
&gt; \*\*Document version:\*\* 1.1  
&gt; \*\*Status:\*\* Design baseline, diselaraskan dengan referensi visual (\`referensi.jpg\`)  
&gt; \*\*Primary language:\*\* Bahasa Indonesia  
&gt; \*\*Design approach:\*\* Mobile-first, responsive, accessible, role-aware, and domain-configurable

---

## 1. Tujuan Dokumen

Dokumen ini menjadi acuan bersama untuk merancang, mengimplementasikan, dan mengevaluasi antarmuka web. Isinya mencakup arah visual, design tokens, layout, komponen, perilaku interaksi, responsive rules, aksesibilitas, dan pola halaman.

Implementasi pertama ditujukan untuk sistem informasi bimbingan belajar dengan empat peran: \*\*Admin, Tutor, Siswa, dan Orang Tua\*\*. Namun fondasi desain sengaja dibuat \*\*domain-neutral\*\* agar dapat digunakan ulang pada aplikasi pendidikan lain, portal komunitas, sistem pemesanan, dashboard operasional, SaaS internal, atau layanan berbasis akun. Jangan mengunci nama, label, warna status, navigasi, dan data langsung di komponen jika nilai tersebut dapat berasal dari konfigurasi.

Dokumen ini mengatur tampilan dan interaksi. Validasi bisnis, otorisasi, dan integritas data tetap harus ditegakkan pada server/database, bukan hanya lewat UI.

## 2. Sumber Kebutuhan dan Arah Visual

### 2.1 Kebutuhan produk yang harus tercermin

Mengacu pada PRD, sistem bimbel perlu mendukung:

- Pendaftaran calon siswa secara mandiri dan verifikasi oleh admin.
- Pengelolaan data siswa, tutor, orang tua, ruangan, mata pelajaran, paket, dan kelas.
- Penjadwalan dengan deteksi bentrok tutor maupun ruangan.
- Presensi dengan status \`Hadir\`, \`Sakit\`, \`Izin\`, dan \`Alpa\`.
- Distribusi materi digital dan tugas.
- Pencatatan nilai, evaluasi tutor, dan tren perkembangan belajar.
- Tagihan, unggah bukti transfer, verifikasi pembayaran, dan kwitansi digital.
- Notifikasi dalam aplikasi untuk peristiwa operasional yang relevan.
- Pembatasan akses antarpengguna sesuai peran dan relasi data.

### 2.2 Referensi visual

Referensi visual (\`referensi.jpg\`) adalah landing page agensi desain dengan pendekatan \*\*editorial minimalis\*\*. Karakter yang diambil:

- Latar putih hangat, teks hitam kebiruan, dan satu aksen cokelat-beige yang dipakai hemat.
- Headline hero besar, tebal, rapat (tracking negatif), rata kiri, dua baris.
- Hero asimetris: teks di kiri, grid empat visual berukuran berbeda di kanan, sudut nyaris siku, jarak antar-tile sempit.
- Tombol utama gelap berkontras tinggi dengan ikon panah; aksi sekunder berupa tautan teks atau tombol outline tipis.
- Kartu datar: border 1 px, radius kecil, tanpa shadow, ikon garis tanpa latar.
- Label kecil huruf kapital dengan tracking lebar (eyebrow) di atas judul section.
- Ritme section bergantian antara rata tengah (layanan, testimoni) dan rata kiri (galeri, alasan memilih, tarif).
- Pita testimoni berlatar hangat, blok CTA gelap, dan footer gelap empat kolom.

Karakter ini diterapkan dengan dua tingkat kepadatan:

1. \*\*Halaman publik:\*\* lebih editorial, visual, berorientasi pada kepercayaan dan pendaftaran.
2. \*\*Aplikasi setelah login:\*\* lebih terstruktur dan informatif, dengan navigasi konsisten, tabel yang mudah dipindai, status yang jelas, serta tindakan utama yang tidak tersembunyi.

#### Pemetaan bagian referensi ke produk

| Bagian referensi | Padanan di bimbel | Syarat data | Flag section |
|---|---|---|---|
| Hero dengan grid 4 visual dan avatar | Hero pendaftaran dengan foto kegiatan belajar atau tampilan platform | Foto atau tangkapan layar resmi; avatar hanya dengan izin | \`hero\` (wajib) |
| Layanan (4 kartu) | Program: SD, SMP, SMA, UTBK | Daftar paket resmi | \`programs\` (wajib) |
| Realisasi (4 tile) | Suasana belajar: ruang kelas, materi, tutor, kegiatan | Foto milik lembaga atau berizin | \`gallery\` |
| Alasan memilih dan 3 statistik | Cara belajar dan pemantauan; statistik bila ada | Angka terverifikasi; bila tidak ada, tiga poin layanan tanpa angka | \`whyUs\` |
| Testimoni 2 kolom | Testimoni orang tua atau siswa | Testimoni asli dengan izin publikasi | \`testimonials\` |
| Tarif 3 paket dan label populer | Paket bimbingan dan biaya | Harga resmi; label rekomendasi harus punya dasar | \`pricing\` |
| Blok CTA gelap dan footer | Ajakan mendaftar dan footer resmi | Kontak resmi lembaga | \`cta\` (wajib), \`footer\` |

Teks, angka, harga, nama klien, dan testimoni pada gambar referensi hanyalah contoh dan tidak boleh dipakai sebagai konten.

#### Penyimpangan sadar dari referensi

| Pada referensi | Pada dokumen ini | Alasan |
|---|---|---|
| Eyebrow dan tautan aksen berwarna beige terang | \`--accent-text\`, cokelat lebih gelap | Kontras beige terang pada putih sekitar 2.7:1, di bawah batas AA 4.5:1 untuk teks kecil |
| Daftar fitur paket abu-abu sangat muda | \`--muted-foreground\` | Keterbacaan |
| Bintang rating dan statistik sebagai elemen tetap | Hanya dari data nyata | Aturan konten pada bagian 6.1 dan 7 |
| Carousel testimoni | Tidak wajib, terutama di mobile | Aksesibilitas dan kesederhanaan |
| Teks tertanam di dalam gambar hero | Teks di luar gambar; keterangan lewat \`alt\` | Terbaca screen reader dan mudah diganti lewat konfigurasi |

#### Yang dibawa ke aplikasi setelah login

Dibawa: palet netral dan border tipis, tombol primary gelap, Inter dengan heading semibold bertracking negatif, radius \`md\` dan \`lg\`, ikon garis 1.5 px, serta \`--accent-text\` untuk tautan dan item navigasi aktif.

Tidak dibawa: eyebrow, grid visual asimetris, blok gelap berukuran besar, panah pada setiap tautan, dan font serif.

Jangan menyalin susunan halaman agensi desain secara mentah. Ambil prinsip visualnya, lalu sesuaikan dengan kebutuhan orang tua, siswa, tutor, dan pengelola bimbel. Dashboard bukan portofolio; kejelasan tugas pengguna lebih penting daripada komposisi dekoratif.

## 3. Prinsip Desain

### 3.1 Prinsip utama

1. \*\*Jelas sebelum dekoratif.\*\* Judul, status, tenggat, nilai, dan aksi utama harus langsung terlihat.
2. \*\*Mobile-first.\*\* Alur penting harus dapat diselesaikan dari smartphone, bukan sekadar tampil mengecil.
3. \*\*Satu halaman, satu tujuan utama.\*\* Setiap halaman memiliki satu tindakan utama yang menonjol dan aksi sekunder yang tidak bersaing.
4. \*\*Kepadatan sesuai konteks.\*\* Landing page memberi ruang bernapas; halaman operasional boleh lebih padat tetapi tetap memiliki hierarki yang kuat.
5. \*\*Status harus dapat dipahami tanpa warna.\*\* Gunakan teks, ikon pendamping, dan/atau bentuk selain warna.
6. \*\*Pencegahan kesalahan.\*\* Tampilkan batasan, ringkasan, konflik, konsekuensi, dan kesempatan mengoreksi sebelum tindakan penting disimpan.
7. \*\*Tidak ada umpan balik yang ambigu.\*\* Setiap aksi asynchronous memiliki keadaan memuat, berhasil, gagal, atau kosong yang relevan.
8. \*\*Akses berdasarkan konteks.\*\* Pengguna hanya melihat data dan tindakan yang sesuai dengan perannya.
9. \*\*Konsistensi, bukan keseragaman buta.\*\* Komponen punya pola konsisten, tetapi detail dapat menyesuaikan konteks dan ukuran layar.
10. \*\*Reusability melalui konfigurasi.\*\* Nama produk, domain, role, menu, status, dan aksen merek dapat diganti tanpa membangun ulang komponen inti.

### 3.2 Hindari

- Gradien mencolok, efek kaca, bayangan berlebihan, dan animasi dekoratif yang tidak membantu tugas.
- Menampilkan terlalu banyak kartu KPI tanpa menjelaskan arti atau tindakan lanjutnya.
- Menggunakan warna merah untuk semua hal yang dianggap penting.
- Mengandalkan placeholder sebagai label form.
- Menampilkan tabel desktop penuh di layar ponsel tanpa strategi responsif.
- Menampilkan seluruh menu semua role kepada setiap pengguna.
- Menggunakan dialog untuk setiap operasi kecil; gunakan halaman atau panel kontekstual bila tugasnya panjang.
- Mengandalkan toast sebagai satu-satunya penjelasan untuk kesalahan penting.
- Menggunakan gambar stok generik yang tidak berkaitan dengan konteks produk.
- Menyalin teks berkontras rendah dari referensi, misalnya daftar fitur abu-abu sangat muda atau eyebrow beige terang.
- Membawa eyebrow, panah di setiap tautan, atau grid asimetris ke dashboard; elemen itu khusus halaman publik.

---

## 4. Identitas Visual

### 4.1 Karakter merek

\*\*Kata kunci:\*\* tenang, profesional, humanis, terorganisir, terpercaya, modern, dan tidak mengintimidasi.

Antarmuka sebaiknya terasa seperti layanan pendidikan yang dikelola dengan baik, bukan sistem administrasi lama yang hanya dipindahkan ke browser. Tampilan tidak perlu kekanak-kanakan. Gunakan ilustrasi atau foto pendidikan seperlunya, sedangkan dashboard mengutamakan data dan alur kerja.

### 4.2 Palet warna dasar

Palet berikut menjadi baseline netral. Nilai dapat dipetakan ke CSS variables/shadcn tokens dan diganti lewat konfigurasi tema. Pastikan seluruh pasangan teks dan latar diuji terhadap kontras WCAG AA.

| Token | Nilai | Kegunaan |
|---|---|---|
| \`--background\` | \`#FFFFFF\` | Latar utama halaman publik dan panel bersih |
| \`--foreground\` | \`#202124\` | Teks utama |
| \`--surface\` | \`#FFFFFF\` | Kartu, dialog, menu, dan panel |
| \`--surface-muted\` | \`#F6F5F2\` | Area sekunder, bagian pembuka dashboard, atau section selang-seling |
| \`--surface-subtle\` | \`#F0EFEB\` | Hover lembut, kelompok kontrol, dan latar kosong |
| \`--surface-warm\` | \`#FAF8F5\` | Pita testimoni dan section selang-seling di halaman publik |
| \`--border\` | \`#E4E1DB\` | Garis kartu, separator, dan tabel |
| \`--border-input\` | \`#8A877F\` | Garis input, select, dan kontrol form (kontras sekitar 3.6:1 pada putih) |
| \`--muted-foreground\` | \`#686963\` | Keterangan, metadata, label sekunder |
| \`--primary\` | \`#202124\` | Tombol utama dan elemen dengan prioritas tertinggi |
| \`--primary-foreground\` | \`#FFFFFF\` | Teks/ikon di atas warna primary |
| \`--inverse-muted\` | \`#C2C5CA\` | Teks sekunder di atas permukaan gelap (blok CTA, footer) |
| \`--accent\` | \`#B59A7B\` | Aksen dekoratif: bintang, garis, ikon dekoratif, ring avatar. Bukan untuk teks kecil di latar terang |
| \`--accent-text\` | \`#7F5F3F\` | Eyebrow, tautan beraksen, dan item navigasi aktif |
| \`--accent-foreground\` | \`#24211D\` | Teks di atas \`--accent\`; tetap cek kontras aktual |
| \`--ring\` | \`#6D8B9A\` | Focus ring yang terlihat jelas |
| \`--success\` | \`#247447\` | Keberhasilan dan status positif |
| \`--warning\` | \`#946200\` | Peringatan dan kondisi yang membutuhkan perhatian |
| \`--destructive\` | \`#B42318\` | Kesalahan serius, penolakan, atau tindakan destruktif |
| \`--info\` | \`#245EA8\` | Informasi netral dan status sedang diproses |

\*\*Aturan penggunaan warna:\*\*

- Warna utama untuk tombol CTA dan dua permukaan gelap di halaman publik (blok CTA penutup dan footer), bukan seluruh permukaan layar.
- Aksen punya dua peran. \`--accent\` (beige) hanya untuk dekorasi seperti bintang, garis, dan ikon. \`--accent-text\` (cokelat lebih gelap) untuk eyebrow, tautan beraksen, dan item navigasi aktif. Referensi memakai beige terang untuk teks kecil; nilainya digelapkan di sini agar lolos kontras AA.
- Pada permukaan gelap, \`--accent\` boleh dipakai sebagai teks (sekitar 6:1 pada \`--primary\`).
- Warna status bersifat semantik, bukan dekorasi. Status yang sama harus memiliki warna dan label yang konsisten di seluruh modul.
- Jangan memakai warna sebagai satu-satunya cara membedakan status. Contoh: gunakan \`Ikon + Hadir\`, bukan titik hijau tanpa label.
- Berikan warna latar status yang pucat dan teks yang lebih gelap; hindari teks putih di atas warna status cerah kecuali kontrasnya sudah diuji.

\*\*Kontras pasangan utama\*\* (dihitung dengan rumus WCAG 2.x; uji ulang bila nilai token diubah):

| Teks / elemen | Latar | Rasio | Catatan |
|---|---|---:|---|
| \`--accent-text\` | \`--background\` | 5.8:1 | Lolos AA untuk teks kecil |
| \`--accent-text\` | \`--surface-muted\` | 5.3:1 | Lolos AA |
| \`--accent-text\` | \`--surface-warm\` | 5.5:1 | Lolos AA |
| \`--muted-foreground\` | \`--background\` | 5.5:1 | Lolos AA |
| \`--muted-foreground\` | \`--surface-muted\` | 5.1:1 | Lolos AA |
| \`--accent\` | \`--background\` | 2.7:1 | Hanya dekoratif |
| \`--accent\` | \`--primary\` | 6.0:1 | Boleh untuk teks di permukaan gelap |
| \`--inverse-muted\` | \`--primary\` | 9.3:1 | Lolos AA |
| \`--ring\` | \`--background\` | 3.6:1 | Lolos 3:1 untuk fokus |

### 4.3 Warna status domain bimbel

| Status | Gaya | Label yang ditampilkan |
|---|---|---|
| Hadir | Success | \`Hadir\` |
| Sakit | Warning atau Info | \`Sakit\` |
| Izin | Info | \`Izin\` |
| Alpa | Destructive | \`Alpa\` |
| Belum Dibayar | Warning | \`Belum dibayar\` |
| Menunggu Verifikasi | Info | \`Menunggu verifikasi\` |
| Lunas / Disetujui | Success | \`Lunas\` / \`Disetujui\` |
| Ditolak | Destructive | \`Ditolak\` |
| Jadwal bentrok | Destructive | \`Jadwal bentrok\` |
| Nonaktif | Muted | \`Nonaktif\` |

Label UI sebaiknya ramah pengguna. Status internal database boleh memakai enum berbeda selama pemetaan ke label display dilakukan secara konsisten.

### 4.4 Tipografi

Gunakan keluarga sans-serif yang jelas dan tersedia luas. Preferensi awal: \*\*Inter\*\* untuk antarmuka; fallback \`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif\`. Bila aset font eksternal tidak tersedia, fallback sistem tetap harus terlihat layak.

Satu keluarga serif dipakai sangat terbatas untuk kutipan testimoni dan monogram logo: serif dengan gaya italic seperti \*\*Source Serif 4\*\*, fallback \`Georgia, "Times New Roman", serif\`. Serif tidak dipakai di dashboard, tabel, atau form.

| Token | Ukuran / line-height | Pemakaian |
|---|---|---|
| \`display\` | \`clamp(2.75rem, 5.5vw, 4.75rem) / 1.04\`, weight 700, tracking \`-0.035em\` | Heading hero halaman publik saja; maksimal dua baris |
| \`h1\` | \`clamp(1.75rem, 3vw, 2.5rem) / 1.15\` | Judul halaman utama |
| \`h2\` | \`1.5rem / 1.25\` | Judul section |
| \`h2-landing\` | \`clamp(1.5rem, 2.5vw, 2rem) / 1.2\`, weight 600, tracking \`-0.02em\` | Judul section landing page |
| \`h3\` | \`1.125rem / 1.35\` | Judul kartu/panel |
| \`h4\` | \`1rem / 1.4\` | Subjudul kecil |
| \`body\` | \`0.9375rem–1rem / 1.55\` | Paragraf dan informasi normal |
| \`body-sm\` | \`0.875rem / 1.5\` | Deskripsi pendek |
| \`label\` | \`0.875rem / 1.4\` | Label form |
| \`caption\` | \`0.75rem–0.8125rem / 1.4\` | Metadata, timestamp, helper text |
| \`button\` | \`0.875rem–0.9375rem / 1.2\`, weight 500–600 | Label tombol |
| \`metric\` | \`1.75rem–2.25rem / 1.1\`, weight 600 | Angka KPI yang benar-benar penting; pada statistik landing diberi ikon 20 px di atasnya |
| \`eyebrow\` | \`0.75rem / 1.2\`, weight 500, uppercase, tracking \`0.14em\`, \`--accent-text\` | Label kecil di atas judul section halaman publik |
| \`quote\` | \`1rem / 1.65\`, serif italic | Kutipan testimoni |

Aturan tipografi:

- Gunakan maksimal dua tingkat font weight dominan dalam satu panel.
- Heading tidak uppercase. Hanya eyebrow yang uppercase: satu per section, hanya di halaman publik, selalu \`--accent-text\`. Terapkan uppercase lewat CSS (\`text-transform\`), bukan pada teksnya, agar pembaca layar membacanya normal.
- Heading 24 px ke atas memakai weight 600–700 dengan tracking negatif ringan (\`-0.02em\` sampai \`-0.035em\`); body memakai weight 400.
- Satu headline satu warna. Jangan menonjolkan satu kata dengan warna atau italic.
- Paragraf utama dibatasi sekitar 60–75 karakter per baris bila ruang memungkinkan.
- Angka nilai, uang, jumlah, persentase, dan tanggal harus mudah dipindai. Gunakan angka tabular bila didukung.
- Jangan mengecilkan teks penting di tabel untuk memaksakan semua kolom masuk ke layar.

### 4.5 Spacing dan ukuran

Gunakan skala berbasis kelipatan 4 px untuk menjaga konsistensi.

| Token | Nilai |
|---|---:|
| \`space-1\` | 4px |
| \`space-2\` | 8px |
| \`space-3\` | 12px |
| \`space-4\` | 16px |
| \`space-5\` | 20px |
| \`space-6\` | 24px |
| \`space-8\` | 32px |
| \`space-10\` | 40px |
| \`space-12\` | 48px |
| \`space-16\` | 64px |
| \`space-20\` | 80px |
| \`space-24\` | 96px |

Aturan penggunaan:

- Jarak antarelemen di dalam kontrol biasanya 8–12 px.
- Jarak label ke input 6–8 px.
- Padding kartu sederhana 16–20 px pada ponsel dan 20–24 px pada desktop.
- Jarak antar-section landing page 64–80 px pada desktop dan 40–56 px pada ponsel. Referensi cukup rapat; jangan melebihi 96 px.
- Kartu layanan dan kartu paket: padding 24 px, gap grid 16 px.
- Grid visual hero dan galeri: gap 8 px.
- Jangan menggunakan padding besar pada setiap kartu dashboard karena akan menurunkan jumlah informasi yang terlihat.

### 4.6 Radius, border, dan shadow

| Token | Nilai awal | Pemakaian |
|---|---|---|
| \`radius-xs\` | 2px | Tile visual (grid hero, galeri); nyaris siku sesuai referensi |
| \`radius-sm\` | 4px | Badge, tab "Paling populer", field kecil |
| \`radius-md\` | 8px | Tombol, input, menu |
| \`radius-lg\` | 10px | Kartu, dialog, panel, kartu paket |
| \`radius-xl\` | 14px | Blok CTA penutup dan panel besar |
| \`radius-full\` | 9999px | Avatar, chip, tombol panah bulat |
| \`shadow-sm\` | Sangat halus | Popover |
| \`shadow-md\` | Halus | Dropdown/dialog bila diperlukan |

Kartu pada referensi datar: border 1 px \`--border\`, tanpa shadow. Pertahankan itu di halaman publik dan dashboard. Shadow hanya untuk lapisan yang melayang (popover, dropdown, dialog).

### 4.7 Ikon dan ilustrasi

- Gunakan satu keluarga ikon garis secara konsisten, misalnya Lucide melalui ekosistem shadcn/ui.
- Ukuran ikon standar 16, 18, atau 20 px. Ikon di dalam tombol harus sejajar secara optis dengan teks.
- Tombol icon-only wajib memiliki accessible name/tooltip dan area klik yang cukup besar.
- Gunakan ilustrasi atau foto hanya bila menambahkan konteks. Untuk aplikasi bimbel, visual dapat menampilkan kegiatan belajar, ruang kelas, materi, atau profil tutor dengan izin penggunaan yang sesuai.
- Hindari emoji sebagai pengganti ikon antarmuka permanen.
- Ikon layanan di kartu publik berukuran 20 px, stroke 1.5 px, warna \`--foreground\`, tanpa kotak atau lingkaran latar.
- Panah (\`ArrowRight\`, 14–16 px) hanya untuk CTA dan tautan yang pindah halaman, bukan untuk tombol submit atau aksi di dalam halaman.

---

## 5. Layout System

### 5.1 Grid dan container

- Gunakan container terpusat dengan lebar maksimum \`1280px\` untuk halaman publik, padding horizontal 16 px pada ponsel dan 32 px pada tablet, serta margin otomatis pada desktop.
- Area kerja dashboard menggunakan sisa lebar layar setelah sidebar, dengan batas baca yang nyaman untuk konten formulir.
- Grid publik memakai 12 kolom pada desktop, 8 kolom pada tablet, dan 4 kolom pada mobile bila diperlukan.
- Gunakan gap 16–24 px pada grid kartu dashboard.
- Untuk halaman form panjang, batasi lebar konten sekitar \`680–800px\` dan hindari field membentang selebar layar tanpa alasan.
- Tabel data boleh memanfaatkan lebar penuh workspace.

### 5.2 Breakpoint responsif

Breakpoint berikut merupakan pedoman awal, bukan alasan memaksakan layout jika konten belum muat.

| Nama | Lebar | Perilaku utama |
|---|---:|---|
| \`xs\` | \`&lt; 480px\` | Satu kolom, menu mobile, tindakan utama full-width bila membantu |
| \`sm\` | \`480–639px\` | Satu kolom; form dapat mulai memakai grid untuk pasangan field pendek |
| \`md\` | \`640–767px\` | Layout tablet kecil; navigasi tetap collapsible |
| \`lg\` | \`768–1023px\` | Sidebar dapat menjadi rail atau drawer; grid dua kolom untuk beberapa halaman |
| \`xl\` | \`1024–1279px\` | Sidebar tetap, grid utama dua/ tiga kolom sesuai konten |
| \`2xl\` | \`&gt;= 1280px\` | Container penuh dengan batas lebar; jangan merentangkan baris teks |

\*\*Responsive rules:\*\*

- Breakpoint ditentukan saat konten membutuhkan perubahan, bukan karena setiap komponen harus memakai semua breakpoint.
- Prioritaskan urutan konten, ukuran target sentuh, dan keterbacaan daripada mempertahankan posisi desktop.
- Pada ponsel, hindari layout yang memerlukan hover. Fungsi harus tersedia melalui tap/focus.
- Konten tidak boleh memaksa scroll horizontal pada seluruh halaman. Jika tabel memang butuh overflow, batasi overflow pada area tabel dan berikan petunjuk visual.
- Uji pada lebar 320, 360, 390, 768, 1024, 1280, dan 1440 px.

### 5.3 Target sentuh dan fokus

- Target interaksi ideal minimal 44 × 44 px untuk touch; ukuran visual ikon boleh lebih kecil selama area klik tetap memadai.
- Berikan jarak memadai antara aksi berisiko seperti \`Hapus\` dan aksi umum seperti \`Edit\`.
- Semua komponen interaktif harus memiliki state hover, focus-visible, active, disabled, dan loading bila relevan.
- Fokus keyboard harus tampak jelas dan tidak tertutup sticky header, sidebar, atau modal.

---

## 6. Arsitektur Pengalaman Pengguna

Sistem terdiri dari dua area pengalaman yang saling terhubung, tetapi memiliki kebutuhan visual berbeda.

### 6.1 Area publik

Tujuan: membantu calon pengguna memahami layanan, percaya pada lembaga, melihat program yang tersedia, dan melanjutkan pendaftaran atau login.

Halaman awal yang disarankan:

- \`/\` — halaman utama dan pengenalan layanan.
- \`/program\` atau \`/paket\` — daftar paket bimbingan.
- \`/tentang\` — profil lembaga dan pendekatan belajar.
- \`/kontak\` — informasi kontak/lokasi yang memang tersedia.
- \`/daftar\` — pendaftaran calon siswa.
- \`/login\` — masuk ke sistem.

Rute publik tersebut adalah rekomendasi struktur navigasi; detail konten harus mengikuti informasi lembaga yang benar-benar tersedia. Jangan menciptakan angka prestasi, testimoni, harga, alamat, atau klaim hasil belajar tanpa sumber.

### 6.2 Area aplikasi setelah login

Tujuan: menyelesaikan pekerjaan dan mendapatkan informasi personal dengan cepat.

Rute awal dari PRD:

- \`/admin\` — operasional dan administrasi.
- \`/tutor\` — kegiatan mengajar, presensi, materi, evaluasi.
- \`/student\` — jadwal, materi, presensi, nilai, tagihan.
- \`/parent\` — pemantauan anak, presensi, nilai, tagihan, kwitansi.

Setelah login berhasil, arahkan pengguna ke dashboard sesuai role yang diperoleh dari sumber otorisasi tepercaya. Menyembunyikan menu di frontend bukan pengganti validasi izin pada server dan database.

### 6.3 Navigasi global

Navigasi harus menunjukkan:

- Identitas produk/brand.
- Halaman atau section aktif.
- Akses ke notifikasi bila relevan.
- Profil akun dan tindakan akun yang tersedia.
- Bantuan atau kontak, bila kanal tersebut memang disediakan.

Jangan mencampur navigasi pemasaran dengan navigasi kerja harian setelah pengguna login.

---

## 7. Halaman Publik: Landing Page

### 7.0 Urutan section dan wireframe

Urutan mengikuti referensi. Hanya \`hero\`, \`programs\`, \`cta\`, dan \`footer\` yang wajib. Section lain aktif bila datanya resmi tersedia (lihat 17.1).

\`\`\`text
┌────────────────────────────────────────────────────────────────────┐
│ Logo      Beranda   Program   Tentang   Kontak        \[ Daftar → \] │  header 72px
├────────────────────────────────────────────────────────────────────┤
│ EYEBROW                                 ┌─────────────┬───────┐    │
│ Headline besar                          │             │       │    │  hero
│ dua baris                               │   tile A    │ tile C│    │  rata kiri
│ Ringkasan 2–3 kalimat                   │             │       │    │
│                                         ├─────────────┤       │    │
│ \[ Daftar sekarang → \]  Lihat X          │             ├───────┤    │
│ (avatar) bukti sosial                   │   tile B    │ tile D│    │
│                                         └─────────────┴───────┘    │
├────────────────────────────────────────────────────────────────────┤
│                           EYEBROW                                  │  programs
│                         Judul section                              │  rata tengah
│                                                                    │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│    │   ikon   │  │   ikon   │  │   ikon   │  │   ikon   │          │
│    │    SD    │  │   SMP    │  │   SMA    │  │   UTBK   │          │
│    │ Pelajari │  │ Pelajari │  │ Pelajari │  │ Pelajari │          │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
├────────────────────────────────────────────────────────────────────┤
│ EYEBROW / Judul (kiri)                      Lihat semua →          │  gallery
│ \[tile\] \[tile\] \[tile\] \[tile\]  + keterangan 2 baris                  │  (opsional)
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐   EYEBROW / Judul 2 baris                     │  whyUs
│ │    foto besar    │   Paragraf pendek                             │  (opsional)
│ └──────────────────┘   \[ikon angka\]  \[ikon angka\]  \[ikon angka\]    │
├────────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  testimonials
│ ░ kutipan 1 ░░░░░░░░░░░░░░░░░░░░│░ kutipan 2 ░░░░░░░░░░░░░░░░░░░░  │  (opsional)
├────────────────────────────────────────────────────────────────────┤
│ EYEBROW / Judul (kiri)     \[paket\]   \[paket + tab\]   \[paket\]       │  pricing
│                                                                    │  (opsional)
├────────────────────────────────────────────────────────────────────┤
│ █ Blok CTA gelap: judul + ringkasan           \[ Daftar → \]       █ │  cta
├────────────────────────────────────────────────────────────────────┤
│ █ Footer gelap:  brand │ Navigasi │ Program │ Kontak             █ │  footer
└────────────────────────────────────────────────────────────────────┘
\`\`\`

Perataan: rata kiri untuk hero, galeri, alasan memilih, dan tarif; rata tengah hanya untuk judul section program dan testimoni. Teks panjang tidak pernah rata tengah.

### 7.1 Header

\*\*Desktop:\*\* tinggi 72 px. Logo di kiri, tautan navigasi di tengah, satu CTA gelap di ujung kanan. \`Masuk\` berupa tautan teks atau tombol ghost di sebelah kiri CTA, bukan tombol primary kedua.

\*\*Logo:\*\* wordmark dua baris (nama lembaga, 13–14 px, weight 600) dengan monogram serif di sisi kiri. Logo berasal dari konfigurasi (\`brand.logoPath\`).

\*\*Navigasi:\*\* tautan 14 px, weight 400. Item aktif memakai \`--accent-text\`, weight 500, dan \`aria-current="page"\`. Hover cukup dengan underline atau perubahan ke \`--foreground\`.

\*\*CTA:\*\* tombol \`primary\` setinggi 40 px, radius \`md\`, teks pendek seperti \`Daftar sekarang\`, dengan ikon panah 16 px.

\*\*Mobile:\*\* logo di kiri dan tombol menu di kanan. Drawer/menu harus menampilkan tautan, CTA, serta \`Masuk\` dengan jelas. Tutup menu setelah pengguna memilih rute dan sediakan perilaku Escape/focus yang baik.

Aturan:

- Header dapat sticky bila bermanfaat, tetapi jangan menghabiskan banyak tinggi layar ponsel.
- Jangan menampilkan dua tombol yang sama-sama terlihat sebagai primary.
- Hindari navigasi terlalu panjang; kelompokkan halaman sekunder.

### 7.2 Hero

Komposisi mengikuti referensi: teks di kiri, grid visual asimetris di kanan.

\*\*Kolom teks\*\* (rata kiri, 5 dari 12 kolom), dari atas ke bawah:

1. Eyebrow: kategori lembaga, satu baris, \`--accent-text\`.
2. Headline \`display\`, maksimal dua baris, berisi manfaat utama dengan bahasa konkret.
3. Ringkasan 2–3 kalimat pendek, \`body\`, \`--muted-foreground\`, sekitar 44 karakter per baris.
4. CTA utama \`primary\` dengan panah, ditemani tautan sekunder berupa teks weight 500 tanpa border dan tanpa panah. Jarak antar-keduanya 24 px.
5. Bukti sosial satu baris: tumpukan 3–4 avatar (32 px, saling tumpang −8 px, ring putih 2 px) diikuti teks \`caption\`. Tampilkan hanya bila ada data terverifikasi dan foto berizin. Bila tidak, ganti dengan satu kalimat proses, misalnya daftar online, diverifikasi admin, lalu jadwal muncul di akun.

\*\*Kolom visual\*\* (7 dari 12 kolom): grid empat tile dalam dua kolom dengan lebar sekitar 64% dan 36%. Kolom kiri berisi dua tile bertumpuk dengan tinggi sama. Kolom kanan berisi satu tile tinggi (sekitar 59% dari tinggi kolom) di atas satu tile yang lebih pendek. Rasio keseluruhan grid sekitar 4:3. Gap 8 px, radius \`radius-xs\`, \`object-fit: cover\`.

Isi tile untuk bimbel: foto kegiatan belajar, ruang kelas, materi cetak, dan tangkapan layar platform yang asli (jadwal atau presensi). Tidak ada teks yang tertanam di dalam gambar; keterangan memakai \`alt\`.

\*\*Responsif:\*\*

- Desktop: teks dan grid berdampingan.
- Tablet: teks di atas, grid menjadi 2×2 dengan ukuran sama.
- Mobile: urutkan teks terlebih dahulu, kemudian visual (satu tile lebar 4:3 diikuti dua tile kecil berdampingan; tile keempat disembunyikan), kecuali hasil pengujian menunjukkan visual lebih penting untuk pemahaman awal.

Spesifikasi konten:

- Headline menyatakan manfaat utama dengan bahasa konkret.
- CTA utama mengarah ke langkah berikut yang jelas, umumnya pendaftaran.
- Social proof hanya menggunakan data terverifikasi. Bila belum ada data sah, gunakan penjelasan proses atau nilai layanan alih-alih membuat angka palsu.

### 7.3 Section program/layanan

- Header section rata tengah: eyebrow, judul \`h2-landing\` maksimal dua baris, dan deskripsi satu atau dua kalimat (\`body\`, \`--muted-foreground\`, sekitar 60 karakter per baris).
- Empat kartu \`ServiceCard\` dalam satu baris pada desktop (sesuai jenjang SD, SMP, SMA, UTBK; tiga kartu bila programnya tiga), dua kolom pada tablet, satu kolom pada mobile.
- Struktur kartu dari atas: ikon 20 px, judul \`h3\` weight 600, deskripsi \`body-sm\` \`--muted-foreground\` maksimal tiga baris, lalu tautan \`Pelajari program\` berwarna \`--accent-text\`, weight 500, dengan panah 14 px. Padding 24 px, jarak antarelemen 12–16 px, tautan didorong ke dasar kartu agar sejajar antar-kartu.
- Latar \`--surface\`, border 1 px \`--border\`, radius \`lg\`, tanpa shadow. Jangan memberi warna latar kuat pada kartu.
- Seluruh kartu boleh menjadi area klik, tetapi hanya dengan satu tautan di dalamnya dan ring fokus pada kartu.
- Informasi harga hanya bila harga resmi tersedia (lihat 7.8); jika tidak, arahkan ke informasi pendaftaran/kontak tanpa angka rekaan.

### 7.4 Section cara kerja

Bagian ini tidak ada di referensi. Bila dipakai, gambarkan alur sederhana, misalnya daftar → verifikasi → memilih/mendapat jadwal → mengikuti pembelajaran → memantau perkembangan. Gunakan langkah bernomor atau garis alur 1 px \`--border\` yang tetap terbaca di mobile, tanpa kartu. Jangan memakai ilustrasi proses terlalu rumit.

### 7.5 Galeri kegiatan (opsional)

Padanan bagian "realisasi" pada referensi. Aktifkan hanya bila lembaga memiliki foto sendiri atau foto berizin.

- Baris judul: eyebrow dan \`h2-landing\` rata kiri, dengan tautan \`Lihat semua\` rata kanan di baris yang sama (\`--accent-text\`, 14 px, panah).
- Empat tile berdampingan (dua kolom pada tablet dan mobile), rasio sekitar 4:3, radius \`radius-xs\`, gap 8 px.
- Keterangan di bawah tile, dua baris: kategori (\`caption\`, \`--muted-foreground\`) dan judul (\`body-sm\`, weight 500). Tidak ada overlay, gradien, atau teks di atas gambar.
- Jangan memakai gambar stok yang tidak berkaitan dengan lembaga.

### 7.6 Alasan memilih dan statistik (opsional)

- Layout dua kolom: foto besar di kiri (sekitar 55% lebar, rasio sekitar 3:2, radius \`radius-xs\`) dan teks di kanan, rata kiri dan berada di tengah secara vertikal.
- Teks: eyebrow, \`h2-landing\` dua baris, paragraf 2–3 kalimat, lalu tiga item sebaris.
- Item statistik (\`StatItem\`): ikon garis 20 px, angka \`metric\`, lalu label \`caption\` \`--muted-foreground\`. Tanpa kartu atau border.
- Angka hanya dari data terverifikasi. Bila belum ada, ganti ketiganya dengan poin layanan tanpa angka, misalnya pemantauan presensi oleh orang tua, jadwal tanpa bentrok, atau kwitansi digital, dengan ikon dan label yang sama. Pilihan lain: profil tutor dan kompetensi, cara evaluasi belajar, serta fasilitas.
- Mobile: foto di atas, teks di bawah, tiga item tetap sebaris bila muat atau menjadi daftar vertikal.

### 7.7 Testimoni (opsional)

Aktifkan hanya bila ada testimoni asli yang memiliki izin publikasi.

- Pita lebar penuh berlatar \`--surface-warm\`; eyebrow dan judul rata tengah.
- Dua kolom kutipan dipisahkan garis vertikal 1 px \`--border\`. Tiap kolom berisi avatar 44–48 px (inisial bila tanpa foto), kutipan bergaya \`quote\`, nama weight 600, dan peran \`caption\` \`--muted-foreground\`.
- Bintang rating hanya bila rating nyata, berwarna \`--accent\`, dengan teks alternatif seperti \`5 dari 5\`. Jangan dipakai sebagai dekorasi.
- Dua tombol panah bulat (ghost, border 1 px) di sisi kanan judul hanya bila testimoni lebih dari dua. Area klik 44 px dengan label \`Testimoni sebelumnya\` dan \`Testimoni berikutnya\`.
- Mobile: satu kolom bertumpuk; carousel tidak wajib.

### 7.8 Paket dan harga (opsional)

Aktifkan hanya bila harga resmi tersedia.

- Dua zona: kolom kiri (sekitar 25%) berisi eyebrow dan \`h2-landing\` rata kiri; kolom kanan (sekitar 75%) berisi tiga kartu paket. Tautan \`Minta penawaran\` rata kanan di atas kartu.
- \`PricingCard\`: nama paket (weight 600), sasaran singkat (\`caption\`), harga bergaya \`metric\` dengan keterangan periode, daftar fitur, lalu tombol di dasar kartu. Border 1 px, radius \`lg\`, padding 24 px, tanpa shadow.
- Daftar fitur memakai \`body-sm\` \`--muted-foreground\` (bukan abu-abu yang lebih muda seperti pada referensi), jarak antarbaris 12 px, dan ikon centang kecil.
- Paket yang direkomendasikan: tab gelap \`Paling populer\` menempel di tepi atas kartu (radius atas \`radius-sm\`, teks putih \`caption\`), dengan tombol \`primary\`. Paket lain memakai tombol \`outline\`. Label ini hanya dipakai bila ada dasar nyata, misalnya keputusan lembaga atau jumlah peminat.
- Format harga \`Rp 150.000\` dengan keterangan per bulan atau per paket sesuai kebijakan lembaga.
- Mobile: kartu bertumpuk satu kolom; paket rekomendasi di urutan pertama.

### 7.9 Blok CTA dan footer

\*\*Blok CTA penutup:\*\* panel gelap (\`--primary\`) di dalam container, radius \`xl\`, padding 32–40 px. Kiri: judul \`h2\` putih berisi satu kalimat ajakan dan satu baris pendukung \`--inverse-muted\`. Kanan: satu tombol \`inverse\` dengan panah. Pada mobile, teks di atas dan tombol full-width di bawah. Blok ini bukan pop-up dan tidak sticky.

\*\*Footer:\*\* latar \`--primary\`, teks \`--inverse-muted\`, judul kolom putih weight 500. Empat kolom pada desktop: (1) logo, deskripsi 2–3 baris, dan ikon sosial; (2) Navigasi; (3) Program; (4) Kontak. Baris bawah dipisahkan garis 1 px (putih 12%): hak cipta di kiri, tautan kebijakan privasi di kanan.

- Ikon sosial 18 px dengan area klik 44 px dan nama aksesibel; tampilkan hanya akun resmi.
- Tautan footer 14 px dengan underline saat hover. Fokus keyboard tetap terlihat di latar gelap (ring \`--ring\` atau putih).
- Pada mobile, susun footer menjadi satu kolom atau accordion yang dapat diakses keyboard.
- Selalu tampilkan informasi kontak sesuai data resmi lembaga; jangan menampilkan alamat contoh sebagai informasi nyata.

---

## 8. Aplikasi Setelah Login: App Shell

### 8.1 Struktur desktop

\`\`\`text
┌──────────────────────┬─────────────────────────────────────────┐
│ Brand / Workspace    │ Topbar: breadcrumb, notifikasi, profil   │
├──────────────────────┤─────────────────────────────────────────┤
│ Navigasi role        │ Page title                Primary action │
│                      │ Ringkasan / filter / tabs                │
│ Item menu aktif      │ Konten utama                             │
│                      │                                         │
│ Bantuan / akun       │                                         │
└──────────────────────┴─────────────────────────────────────────┘
\`\`\`

- Sidebar desktop sekitar 240–272 px; dapat diciutkan menjadi rail bila aplikasi memiliki banyak ruang kerja.
- Topbar sekitar 60–72 px, dengan elemen yang tidak terlalu rapat.
- Konten menggunakan padding 24–32 px pada desktop dan lebar yang sesuai dengan jenis halaman.
- Sidebar memiliki section navigasi dan penanda aktif yang konsisten. Jangan mengandalkan perubahan warna tipis saja; sertakan latar/indikator atau weight yang cukup.
- Breadcrumb digunakan untuk halaman bertingkat, bukan dipaksakan pada setiap halaman sederhana.

### 8.2 Struktur mobile

- Sidebar berubah menjadi drawer yang dibuka dari tombol menu.
- Topbar menampilkan menu, judul ringkas atau breadcrumb pendek, notifikasi bila diperlukan, dan avatar/profil bila ruang cukup.
- Sembunyikan elemen non-esensial dari topbar; pindahkan ke halaman profil/menu.
- Konten utama memakai padding 16 px, dengan 20 px pada layar lebih lebar.
- Form panjang disusun satu kolom. Tombol submit dapat dibuat sticky di bagian bawah hanya jika tidak menutupi konten dan memperhitungkan safe area.
- Jangan menjadikan sidebar desktop sekadar kolom sempit yang masih menampilkan teks penuh.

### 8.3 Pola halaman dashboard

Urutan default:

1. \*\*Page header:\*\* judul, ringkasan konteks, breadcrumb jika perlu.
2. \*\*Primary action:\*\* tombol tindakan utama yang paling sering dibutuhkan.
3. \*\*Summary:\*\* metrik atau status penting, hanya jika membantu keputusan.
4. \*\*Controls:\*\* filter, pencarian, periode, atau tab.
5. \*\*Main content:\*\* tabel, kalender, chart, daftar tugas, atau form.
6. \*\*Secondary content:\*\* aktivitas terbaru, pengumuman, bantuan kontekstual.

Tidak semua halaman perlu seluruh lapisan. Jangan menambahkan kartu KPI ke halaman yang lebih cocok langsung menampilkan form atau tabel.

---

## 9. Dashboard Berdasarkan Role

### 9.1 Admin

\*\*Tujuan utama:\*\* melihat kondisi operasional dan menangani pekerjaan yang membutuhkan tindakan.

Isi dashboard yang disarankan:

- Ringkasan pendaftaran yang menunggu verifikasi.
- Tagihan/bukti pembayaran yang menunggu verifikasi.
- Jadwal hari ini dan indikator konflik bila ada.
- Aktivitas operasional terakhir.
- Akses cepat ke data siswa, tutor, ruangan, kelas, paket, dan jadwal.

Aturan:

- Daftar yang membutuhkan tindakan harus lebih menonjol daripada metrik pasif.
- Tabel admin mendukung pencarian, filter, sorting, pagination, serta aksi baris yang jelas.
- Aksi destruktif wajib meminta konfirmasi dan menerangkan konsekuensinya.
- Form master data dikelompokkan berdasarkan konsep, bukan satu form sangat panjang.
- Konflik jadwal harus menunjukkan detail konflik (tutor/ruangan, hari, jam, serta sesi yang bertabrakan), bukan hanya teks \`Gagal menyimpan\`.

### 9.2 Tutor

\*\*Tujuan utama:\*\* mengetahui jadwal mengajar, mencatat kehadiran, membagikan materi, dan memberi evaluasi.

Isi dashboard yang disarankan:

- Jadwal mengajar hari ini dan sesi berikutnya.
- Daftar kelas yang dapat diakses tutor.
- Tugas tertunda seperti presensi belum selesai atau evaluasi yang belum diinput.
- Materi terakhir yang diunggah.

Aturan:

- Aksi terkait sesi harus dekat dengan informasi sesi.
- Tombol \`Ambil presensi\` atau padanan sejenis menjadi primary ketika ada sesi aktif yang membutuhkan presensi.
- Form nilai menampilkan nama siswa, mata pelajaran, judul evaluasi, skor 0–100, tanggal, dan catatan tutor sesuai PRD.
- Perubahan nilai/presensi harus memiliki umpan balik penyimpanan yang jelas.

### 9.3 Siswa

\*\*Tujuan utama:\*\* menemukan jadwal, mengakses materi, mengetahui hasil belajar, dan memeriksa tagihan.

Isi dashboard yang disarankan:

- Jadwal terdekat.
- Materi atau tugas terbaru.
- Ringkasan kehadiran dan nilai.
- Status tagihan serta tindakan terkait.
- Pengumuman yang ditujukan kepada siswa.

Aturan:

- Tampilkan tindakan yang diperlukan sekarang sebelum riwayat panjang.
- Materi harus memperlihatkan judul, jenis berkas/tautan, kelas/mata pelajaran, tanggal, ukuran berkas jika tersedia, dan aksi unduh/buka.
- Nilai harus memiliki konteks evaluasi dan tanggal; jangan hanya menampilkan angka tanpa judul.
- Data siswa hanya menampilkan data milik akun tersebut.

### 9.4 Orang Tua/Wali

\*\*Tujuan utama:\*\* memahami kehadiran, perkembangan, dan kewajiban administrasi anak.

Isi dashboard yang disarankan:

- Ringkasan kehadiran terbaru.
- Tren nilai per mata pelajaran dan catatan tutor.
- Tagihan dan status pembayaran.
- Pengumuman atau notifikasi penting.
- \`Child Switcher\` jika wali terhubung dengan lebih dari satu anak.

Aturan:

- Pemilih anak harus selalu menunjukkan nama anak yang sedang aktif agar pengguna tidak keliru membaca data.
- Perubahan anak aktif harus memperbarui semua panel terkait, bukan hanya heading.
- Grafik harus disertai ringkasan teks atau tabel alternatif.
- Status \`Alpa\` atau tagihan tertunda boleh diberi penekanan, tetapi hindari nada menghakimi.
- Orang tua hanya dapat membuka data anak yang terhubung secara sah dengan akunnya.

---

## 10. Pola Modul dan Alur Utama

### 10.1 Registrasi calon siswa

\*\*Tujuan:\*\* pendaftar memahami data yang dibutuhkan dan status proses sesudah mengirim formulir.

Field dari PRD:

- Nama lengkap.
- Email.
- Nomor telepon/WhatsApp.
- Sekolah asal.
- Pilihan paket/tingkat bimbingan: SD, SMP, SMA, atau UTBK.
- Field tambahan hanya ditambahkan bila memang dibutuhkan proses operasional.

Perilaku:

- Kelompokkan data menjadi bagian yang mudah dipahami.
- Beri label permanen, contoh format, helper text bila diperlukan, dan validasi setelah pengguna berinteraksi atau ketika submit.
- Email harus divalidasi format dan keunikannya oleh sistem; nomor telepon dinormalisasi dan diperiksa formatnya.
- Setelah submit berhasil, tampilkan status \*\*Menunggu Verifikasi Admin\*\*, ringkasan langkah berikutnya, dan cara masuk kembali bila disediakan.
- Saat request berjalan, nonaktifkan submit berulang dan tampilkan loading.
- Jika gagal, pertahankan input yang aman dan tampilkan cara memperbaiki tanpa menghapus seluruh data form.

### 10.2 Login dan pengalihan role

- Form login hanya menampilkan field yang diperlukan, dengan label dan pesan kesalahan spesifik.
- Jangan mengungkap apakah suatu email terdaftar jika kebijakan keamanan mengharuskan respons generik.
- Setelah autentikasi sukses, arahkan pengguna ke area yang sesuai role: \`/admin\`, \`/tutor\`, \`/student\`, atau \`/parent\`.
- Bila role atau profil belum siap, tampilkan keadaan tertangani, bukan halaman kosong atau redirect berulang.
- Sesi kedaluwarsa harus membawa pengguna ke login dan, jika aman, menyimpan tujuan navigasi awal.

### 10.3 Penjadwalan dan deteksi konflik

\*\*Informasi utama:\*\* kelas, tutor, ruangan, hari, jam mulai, jam selesai, dan kapasitas/keanggotaan bila diperlukan.

Desain halaman:

- Desktop dapat menyediakan tampilan kalender mingguan dan daftar sesi.
- Mobile memprioritaskan agenda harian/list, dengan kontrol ganti tanggal yang mudah digunakan.
- Filter tutor, ruangan, kelas, dan hari dikelompokkan di panel filter atau toolbar.
- Sesi ditampilkan dengan waktu, nama kelas, tutor, ruangan, dan status terkait.

Validasi konflik dari PRD:

- Konflik ruangan terjadi jika ruang, hari, dan rentang waktu tumpang tindih.
- Konflik tutor terjadi jika tutor, hari, dan rentang waktu tumpang tindih.
- Batas rentang waktu harus konsisten: \`start\_A &lt; end\_B\` dan \`end\_A &gt; start\_B\`.

Perilaku UI:

- Tampilkan kesalahan tepat di area editor jadwal dan di dekat field yang relevan.
- Ringkas sesi yang bertabrakan: \`Tutor X sudah mengajar pukul 09.00–10.00\` atau \`Ruangan Y digunakan oleh kelas Z\`.
- Tandai konflik dengan teks dan ikon selain warna.
- Blokir penyimpanan pada UI ketika konflik diketahui, tetapi validasi final tetap dijalankan server/database untuk mencegah race condition.
- Jangan hanya memberi border merah tanpa menjelaskan cara menyelesaikannya.

### 10.4 Presensi digital

Daftar presensi per sesi memuat:

- Nama siswa.
- Identitas/kelas seperlunya.
- Status presensi: Hadir, Sakit, Izin, Alpa.
- Catatan opsional bila dibutuhkan.

Perilaku:

- Status dapat diubah menggunakan select/radio/button group yang mudah dipakai dengan sentuhan.
- Jangan mengandalkan warna saja untuk membedakan status.
- Sediakan tindakan massal hanya jika mengurangi beban kerja dan memiliki cara memeriksa hasil sebelum disimpan.
- Tampilkan ringkasan jumlah tiap status dan jumlah siswa yang belum ditandai.
- Tunjukkan apakah perubahan tersimpan otomatis atau menunggu tombol simpan. Jangan mencampurkan kedua model tanpa penjelasan.
- Dashboard siswa/orang tua menampilkan status hari ini dan rekap kehadiran; nilai persentase harus dapat ditelusuri ke periode dan jumlah sesi yang dihitung.

### 10.5 Materi dan tugas

Metadata minimal:

- Judul materi.
- Kelas/mata pelajaran.
- Pengunggah.
- Tanggal upload.
- Jenis sumber: PDF, DOCX, PPTX, atau tautan video/eksternal.
- Ukuran file jika tersedia.

Perilaku:

- Tampilkan ekstensi/jenis file sebagai teks atau ikon yang punya label.
- Batas ukuran upload dari PRD adalah maksimal 20 MB; jelaskan batas ini sebelum pengguna memilih file.
- Validasi tipe dan ukuran file di klien untuk kenyamanan, lalu periksa kembali di server.
- Saat unggah, tampilkan progress bila tersedia, status selesai, serta aksi ulang bila gagal.
- Tautan eksternal dibuka dengan perilaku yang aman dan label yang menjelaskan tujuan.
- Siswa hanya dapat mengakses materi kelas tempat ia terdaftar.

### 10.6 Nilai dan progres belajar

Data evaluasi mengikuti PRD:

- Mata pelajaran.
- Judul evaluasi (contoh: Try Out 1 UTBK Matematika).
- Skor 0–100.
- Tanggal evaluasi.
- Catatan tutor.

Desain:

- Daftar/riwayat tetap tersedia sebagai alternatif grafik.
- Grafik tren menampilkan label sumbu, rentang nilai, periode, dan tooltip yang dapat dibaca keyboard bila komponen mendukungnya.
- Gunakan skala yang tidak menyesatkan. Untuk nilai 0–100, tampilkan konteks skala tersebut.
- Catatan tutor ditampilkan sebagai teks yang mudah dibaca, tidak dipotong secara permanen.
- Jangan menyimpulkan perkembangan positif/negatif tanpa aturan perhitungan yang jelas.

### 10.7 Tagihan, pembayaran, dan kwitansi

Status yang terlihat oleh pengguna:

- Belum Dibayar.
- Menunggu Verifikasi Admin.
- Lunas.
- Ditolak.

Alur:

1. Pengguna membuka rincian tagihan.
2. Sistem menampilkan nomor tagihan, deskripsi, jumlah, dan tanggal jatuh tempo bila tersedia.
3. Siswa/orang tua mengunggah bukti JPG/PNG/PDF.
4. Sistem menunjukkan bahwa bukti berhasil dikirim dan menunggu verifikasi.
5. Admin melihat bukti dan memilih setujui atau tolak dengan alasan bila ditolak.
6. Jika disetujui, status menjadi lunas dan kwitansi digital tersedia.

Aturan UI:

- Nominal dan status pembayaran harus terlihat jelas.
- Jangan meminta pengguna mengunggah ulang bukti tanpa menjelaskan alasan.
- Ketika ditolak, tampilkan alasan yang ditulis admin dan langkah selanjutnya.
- Tombol unduh/cetak kwitansi hanya tersedia setelah pembayaran disetujui.
- Sediakan layout kwitansi yang ramah cetak, tanpa navigasi dan elemen interaktif yang tidak perlu pada mode print.
- Unggahan bukti adalah data sensitif. Tampilkan hanya kepada pihak yang berwenang dan jangan memakai URL publik permanen bila akses seharusnya dibatasi.

### 10.8 Notifikasi

Jenis peristiwa dari PRD:

- Pembayaran diverifikasi atau ditolak.
- Jadwal sesi diubah.
- Materi baru diunggah.
- Siswa berstatus Alpa.

Perilaku:

- Ikon lonceng menampilkan jumlah belum dibaca jika tersedia.
- Panel notifikasi memiliki judul, ringkasan, waktu, dan tujuan navigasi.
- Bedakan status dibaca/belum dibaca dengan lebih dari satu sinyal visual.
- Sediakan keadaan kosong dan tindakan tandai dibaca bila didukung.
- Jangan mengirim notifikasi untuk setiap perubahan kecil yang tidak berguna bagi pengguna.
- Notifikasi in-app harus konsisten dengan izin data; informasi sensitif tidak boleh muncul di akun role lain.

---

## 11. Komponen UI Reusable

Komponen sebaiknya disusun sebagai komponen presentasional dan pola yang menerima props/data. Hindari komponen raksasa yang menggabungkan fetching, otorisasi, validasi bisnis, dan tampilan sekaligus.

### 11.1 Button

Variasi yang diperlukan:

- \`primary\`: tindakan utama halaman/form.
- \`secondary\`: tindakan penting kedua.
- \`outline\`: aksi sekunder berbingkai.
- \`ghost\`: aksi ringan pada toolbar/menu.
- \`destructive\`: hapus atau tindakan berisiko.
- \`link\`: navigasi yang tampil seperti tautan. Pada halaman publik berwarna \`--accent-text\`, weight 500, dengan panah 14 px bila pindah halaman.
- \`inverse\`: tombol putih dengan teks \`--primary\` di atas permukaan gelap, seperti blok CTA penutup.

State wajib bila relevan: default, hover, focus-visible, active, disabled, loading.

Aturan:

- Gunakan satu primary action utama pada konteks yang sama bila memungkinkan.
- Label memakai kata kerja konkret, misalnya \`Simpan jadwal\`, bukan \`OK\`.
- Pada operasi asynchronous, gunakan loading state dan cegah pengiriman berulang.
- Jangan memakai destructive style hanya untuk menandai tombol yang jarang dipakai.
- Tinggi tombol 44 px (default, ramah sentuhan) dan 40 px untuk header desktop serta toolbar. Radius \`md\`, padding horizontal 20–24 px.
- Hover \`primary\` cukup sedikit lebih terang dari \`--primary\`; jangan berubah ke warna aksen.
- Panah hanya untuk CTA dan tautan yang pindah halaman. Tombol submit dan aksi di tempat tidak memakai panah.

### 11.2 Form controls

Komponen: input teks, email, nomor telepon, password, textarea, select/combobox, date picker, time picker, checkbox, radio group, switch, file upload, dan form field wrapper.

Setiap field perlu mendukung:

- Label terlihat.
- Petunjuk/helper text opsional.
- Error text yang terhubung secara programatis ke field.
- Required state yang tidak bergantung pada warna saja.
- Disabled/read-only state yang dapat dibedakan.
- Focus ring dan navigasi keyboard.

Validasi:

- Hindari error pada saat pengguna belum sempat mengisi field.
- Validasi saat blur atau submit, sesuai kompleksitas form.
- Pesan error menerangkan masalah dan cara memperbaikinya.
- Jangan menghapus value yang sudah diisi ketika ada kegagalan jaringan.

### 11.3 Card

Gunakan kartu untuk mengelompokkan informasi yang secara mental memang satu unit, bukan membungkus semua elemen.

Tipe:

- \`summary-card\`: metrik singkat dan konteks periode.
- \`content-card\`: materi atau informasi.
- \`action-card\`: item yang punya tindakan berikutnya.
- \`profile-card\`: orang/role dan metadata relevan.
- \`status-card\`: satu status penting, misalnya pembayaran menunggu verifikasi.
- \`service-card\`: kartu program di halaman publik (ikon, judul, deskripsi, tautan). Lihat 7.3.
- \`pricing-card\`: kartu paket dengan harga dan daftar fitur. Lihat 7.8.

Kartu publik dan kartu dashboard sama-sama datar (border 1 px, tanpa shadow). Bedanya ada pada padding: 24 px untuk kartu publik, 16–20 px untuk dashboard.

Kartu tidak selalu harus clickable. Bila seluruh kartu dapat diklik, tunjukkan affordance dan dukung keyboard. Jangan menaruh tombol interaktif bertumpuk di dalam tautan/kartu klik yang sama.

### 11.4 Badge/status indicator (`StatusBadge`)

Gunakan penanda ringan berupa **dot atau ikon + teks**, bukan format pill dengan latar belakang tebal, guna mencegah kekacauan visual (*visual clutter*) pada tabel dan daftar administratif.

#### Prinsip Desain:
- **Aksesibel & Dual-Coding:** Warna selalu ditemani teks atau bentuk ikon spesifik, sehingga status tetap terbaca dan mudah dipahami tanpa bergantung pada persepsi warna semata.
- **Hierarki Bersih:** Maksimal satu badge status utama per baris data. Informasi netral (seperti nama paket bimbel, info rekening, atau kuantitas) tidak boleh dibungkus dalam pill badge berwarna.
- **Label Singkat:** Gunakan label singkat dan jelas (misalnya "Lunas", "Ditolak", "Terverifikasi").

#### Varian dan Perilaku:

| Status | Tone | Penanda Visual | Warna Teks | Perilaku & Label Dinamis |
|---|---|---|---|---|
| `menunggu` (normal) | `waiting` | Dot lingkaran 8px | `#292524` (*stone-800*) | Dot amber (`#B8780A`). Jika properti `since` diberikan, teks menampilkan durasi tunggu relatif (*"Baru masuk"*, *"Menunggu 15 menit"*, *"Menunggu 2 jam"*). |
| `menunggu` (terlambat) | `late` | Dot lingkaran 8px | `#B3261E` (*red-700*) | Dot merah (`#B3261E`). Aktif otomatis bila durasi tunggu melampaui `lateAfterHours` (default 48 jam). |
| `lunas` | `done` | Ikon centang (Check outline 16px) | `#1F6B45` (*green-700*, font-medium) | Centang hijau tanpa fill. Mendukung kustomisasi label (misal: *"Terverifikasi"*). |
| `ditolak` | `rejected` | Ikon silang (Cross outline 16px) | `#B3261E` (*red-700*, font-medium) | Silang merah outline. Digunakan untuk pembayaran tidak valid atau berkas ditolak. |

#### Aturan Teks Netral Non-Badge di Tabel:
- **Kategori Paket:** Cukup teks netral abu-abu (`text-stone-500`, 13px), contoh: `Intensif UTBK`, tanpa pill berlatar warna.
- **Jumlah Header:** Gunakan angka tabular netral (`text-stone-500 tabular-nums text-[13px]`), contoh: `2 menunggu`.
- **Info Rekening / Metadata:** Cukup teks netral (`text-stone-500 text-[13px]`), contoh: `Transfer ke BNI/BSI Cabang Palu`.
- **Header Kolom (`<th>`):** Gunakan *sentence case* (`Calon siswa`), hindari `uppercase` dan `letter-spacing` berlebih.

#### Dokumen Kwitansi Resmi (Print):
Pada dokumen kwitansi yang dicetak (*mode print*), status lunas menggunakan format lencana resmi bergaris tepi tipis (`.receipt-status-badge`) dengan ikon centang hijau berlatar hijau lembut, memastikan keterbacaan tajam baik di layar maupun printer monokrom.

### 11.5 Data table

Gunakan untuk administrasi data terstruktur seperti siswa, tutor, kelas, jadwal, nilai, dan tagihan.

Fitur bila relevan:

- Sorting yang diumumkan dengan benar kepada teknologi bantu.
- Filter dan pencarian.
- Pagination server-side untuk kumpulan data besar.
- Pilihan jumlah baris per halaman.
- Empty state dan loading skeleton.
- Kolom aksi yang tidak mengambil terlalu banyak lebar.
- Pilihan row density jika benar-benar dibutuhkan admin.
- Seleksi massal hanya bila ada aksi bulk yang jelas.

Responsive behavior:

- Pada desktop, gunakan tabel penuh dengan header yang jelas.
- Pada tablet, sembunyikan kolom sekunder hanya jika detail masih dapat ditemukan.
- Pada mobile, pilih salah satu pola: tabel dengan horizontal scroll terlokalisasi, daftar kartu ringkas, atau tampilan detail per record. Tentukan berdasarkan tugas dan jangan mengandalkan scroll horizontal tanpa petunjuk.
- Kolom pertama harus membantu mengenali record (contoh: nama siswa atau nomor tagihan).
- Jangan memotong data penting tanpa mekanisme buka detail.

### 11.6 Search dan filter toolbar

- Pencarian global dalam daftar memiliki placeholder yang spesifik, misalnya \`Cari nama siswa\`.
- Filter aktif terlihat sebagai chip atau ringkasan pilihan dan memiliki aksi hapus/reset.
- Pada desktop, pencarian dan filter dapat berada dalam satu baris.
- Pada mobile, tampilkan pencarian terlebih dahulu, sedangkan filter tambahan masuk ke drawer/popover.
- Gunakan debounce hanya untuk pencarian yang sesuai, dan tampilkan indikator ketika data sedang diperbarui.
- Pertahankan filter dalam navigasi pagination; reset hanya jika ada perubahan konteks yang memang memerlukannya.

### 11.7 Dialog, drawer, dan confirmation

Gunakan dialog untuk keputusan singkat; drawer untuk detail kontekstual atau form pendek; halaman tersendiri untuk alur kompleks.

Dialog konfirmasi tindakan destruktif wajib menjelaskan objek dan konsekuensi spesifik. Hindari pesan generik seperti \`Apakah Anda yakin?\` tanpa konteks.

Keyboard:

- Fokus masuk ke dialog saat terbuka.
- Escape menutup dialog jika aman.
- Fokus kembali ke elemen pemicu setelah dialog ditutup.
- Jangan menjebak pengguna pada dialog yang tidak dapat ditutup kecuali memang harus menyelesaikan proses yang jelas.

### 11.8 Toast dan inline feedback

- Toast digunakan untuk feedback singkat yang tidak membutuhkan tindakan panjang.
- Kesalahan validasi, konflik jadwal, atau penolakan pembayaran harus tampil dekat konteks yang relevan.
- Pesan sukses menyebut hasil: \`Jadwal berhasil disimpan\`.
- Pesan gagal memberikan alasan bila diketahui dan tindakan yang dapat dicoba.
- Jangan menampilkan stack trace, query, token, atau detail teknis sensitif kepada pengguna.

### 11.9 Tabs dan segmented controls

Gunakan ketika pilihan merupakan bagian dari satu halaman dan perpindahannya tidak mengubah konteks secara membingungkan. Untuk navigasi halaman besar, gunakan menu/route alih-alih tabs berlebihan.

### 11.10 Calendar dan agenda

- Kalender desktop dapat menggunakan tampilan mingguan/bulanan sesuai kebutuhan operasional.
- Agenda mobile menjadi tampilan default jika grid kalender sulit digunakan pada layar kecil.
- Sesi harus memiliki teks waktu dan nama kelas, bukan hanya blok warna.
- Sediakan daftar alternatif bagi pengguna keyboard/teknologi bantu.
- Konflik dan pembatalan harus memiliki penjelasan teks yang jelas.

### 11.11 Chart dan metric

- Setiap metrik memiliki label, nilai, periode, dan konteks.
- Grafik tidak boleh menjadi satu-satunya penyajian data penting.
- Hindari chart yang hanya memberi warna tanpa legenda.
- Gunakan jumlah seri seperlunya; terlalu banyak garis membuat tren tidak terbaca.
- Jika tidak ada data, tampilkan alasan dan cara mulai menghasilkan data, bukan grafik kosong palsu.

### 11.12 File upload

- Area upload harus memiliki label yang jelas dan mendukung tombol pilih berkas selain drag-and-drop.
- Tampilkan tipe/ukuran yang diizinkan sebelum memilih file.
- Tampilkan nama file, ukuran, progress, status, dan aksi hapus/ganti jika sesuai.
- Jelaskan alasan file ditolak dan batasnya.
- Jangan menjadikan ikon upload sebagai satu-satunya instruksi.

### 11.13 Avatar dan profil

- Foto tidak wajib. Gunakan inisial jika avatar tidak tersedia.
- Hindari mengandalkan warna avatar untuk menentukan role.
- Nama dan identitas anak yang sedang dipilih harus mudah dikenali.
- Foto pengguna harus memiliki fallback jika gagal dimuat.

### 11.14 Empty states

Setiap daftar/panel penting memiliki keadaan kosong yang menjawab:

1. Mengapa belum ada data?
2. Apakah ini kondisi normal atau ada masalah?
3. Apa tindakan berikutnya, jika pengguna memang dapat melakukannya?

Contoh: \`Belum ada jadwal untuk hari ini.\` Untuk admin dengan izin membuat jadwal, tambahkan CTA \`Buat jadwal\`; untuk siswa, jangan tampilkan CTA admin.

### 11.15 Loading dan skeleton

- Gunakan skeleton untuk konten yang strukturnya dapat diperkirakan.
- Gunakan spinner untuk aksi pendek yang tidak memiliki bentuk konten stabil.
- Untuk proses panjang seperti unggah berkas, tampilkan status/progress jika tersedia.
- Hindari layar kosong saat fetch berlangsung.
- Jangan mengubah seluruh layout secara drastis ketika data masuk; skeleton sebaiknya mendekati dimensi konten akhir.

### 11.16 Komponen khusus halaman publik

Komponen berikut hanya untuk landing page. Semua teks dan data diambil dari konfigurasi konten (17.1), bukan ditulis langsung di komponen.

| Komponen | Props utama | Aturan |
|---|---|---|
| \`SectionHeader\` | \`eyebrow?\`, \`title\`, \`description?\`, \`align\` (\`left\` atau \`center\`), \`action?\` | Satu eyebrow per section; perataan mengikuti 7.0 |
| \`Eyebrow\` | \`children\` | Token \`eyebrow\`, uppercase lewat CSS, \`--accent-text\` |
| \`BentoGrid\` | \`tiles\` (4 item: \`src\`, \`alt\`) | Pola hero pada 7.2, \`radius-xs\`, gap 8 px |
| \`AvatarStack\` | \`people\` (\`name\`, \`src?\`), \`max\` | 32 px, saling tumpang, fallback inisial, label aksesibel ringkas |
| \`ServiceCard\` | \`icon\`, \`title\`, \`description\`, \`href\`, \`linkLabel\` | Lihat 7.3 |
| \`GalleryTile\` | \`src\`, \`alt\`, \`category\`, \`title\` | Lihat 7.5 |
| \`StatItem\` | \`icon\`, \`value\`, \`label\` | Lihat 7.6; \`value\` dari data terverifikasi |
| \`TestimonialColumns\` | \`items\` (\`quote\`, \`name\`, \`role\`, \`avatar?\`, \`rating?\`) | Lihat 7.7 |
| \`PricingCard\` | \`name\`, \`audience\`, \`price\`, \`features\`, \`highlight?\`, \`cta\` | Lihat 7.8 |
| \`CtaBand\` | \`title\`, \`description\`, \`action\` | Lihat 7.9 |
| \`SiteFooter\` | \`brand\`, \`columns\`, \`legal\` | Lihat 7.9 |

---

## 12. Informasi, Bahasa, dan Microcopy

### 12.1 Gaya bahasa

Gunakan Bahasa Indonesia yang ringkas, ramah, dan langsung. Hindari istilah teknis jika pengguna tidak perlu mengetahuinya.

- Label tindakan: \`Simpan\`, \`Unggah bukti pembayaran\`, \`Tandai hadir\`, \`Lihat rapor\`.
- Pesan hasil: \`Bukti pembayaran berhasil dikirim dan menunggu verifikasi.\`
- Error yang membantu: \`Jam selesai harus lebih akhir daripada jam mulai.\`
- Konfirmasi spesifik: \`Hapus jadwal Matematika kelas 12 pada Senin, 09.00–10.00?\`

### 12.2 Konsistensi istilah

Satu konsep memiliki satu istilah tampilan utama. Hindari bergantian memakai \`murid\`, \`peserta\`, dan \`siswa\` di bagian yang sama bila produk telah menetapkan \`Siswa\`.

Untuk reuse lintas domain, istilah domain ditempatkan pada konfigurasi copy, bukan tersebar dalam komponen generik. Contohnya, komponen generik \`EntityList\` tidak perlu mengasumsikan entitas selalu \`Siswa\`.

### 12.3 Format data

- Gunakan format tanggal Bahasa Indonesia yang konsisten, misalnya \`10 Okt 2026\` pada tabel ringkas dan \`10 Oktober 2026\` pada detail.
- Tampilkan waktu lokal yang relevan dengan pengguna. PRD menyebut konteks Kota Palu, sehingga aplikasi bimbel memakai WITA jika tidak ada pengaturan zona waktu lain.
- Gunakan format rupiah \`Rp 150.000\` atau format IDR konsisten sesuai hasil uji produk.
- Nilai selalu menampilkan skala, misalnya \`85/100\`, bila konteks tidak langsung jelas.
- Telepon dinormalisasi untuk penyimpanan, tetapi display tetap mudah dibaca.

---

## 13. Responsivitas Mendalam per Jenis Halaman

### 13.1 Landing page

| Area | Desktop | Tablet | Mobile |
|---|---|---|---|
| Header | Logo, menu di tengah, CTA | Menu disederhanakan | Drawer/menu overlay |
| Hero | Teks 5 kolom dan grid 4 tile 7 kolom | Teks di atas, grid 2×2 sama besar | Headline, CTA, lalu 1 tile lebar dan 2 tile kecil |
| Program | 4 kartu per baris (3 bila programnya tiga) | 2 kartu per baris | 1 kartu per baris |
| Galeri | 4 tile | 2×2 | 2 kolom |
| Alasan memilih | Foto kiri, teks kanan | Foto dan teks bertumpuk | Foto, teks, lalu 3 statistik sebaris bila muat |
| Cara kerja | Langkah horizontal | Grid 2 kolom atau vertikal | List vertikal bernomor |
| Testimoni | 2 kolom dengan garis pemisah | 2 kolom | Satu kolom; hindari carousel wajib |
| Paket | Judul di kiri, 3 kartu di kanan | 3 kartu atau 1 kolom bila sempit | 1 kolom, paket rekomendasi pertama |
| Blok CTA | Teks kiri, tombol kanan | Sama | Teks di atas, tombol full-width |
| Footer | 4 kolom | 2 kolom | Satu kolom/accordion aksesibel |

### 13.2 Dashboard

| Area | Desktop | Tablet | Mobile |
|---|---|---|---|
| Sidebar | Tetap, dapat collapse | Rail atau drawer | Drawer |
| KPI | 3–4 kolom bila bermakna | 2 kolom | 1–2 kolom, pilih metrik penting |
| Filter | Toolbar inline | Wrap ke beberapa baris | Panel filter terpisah |
| Table | Tabel penuh | Kurangi kolom sekunder bila aman | Kartu/list atau scroll horizontal terlokalisasi |
| Chart | Lebar penuh atau split panel | Satu kolom bila padat | Satu kolom dengan legend/label terbaca |
| Aksi halaman | Dekat judul | Tetap terlihat | Tombol utama dekat heading, full-width bila cocok |

### 13.3 Form panjang

- Desktop: gunakan dua kolom hanya untuk field pendek dan berpasangan seperti nama depan/nama belakang atau tanggal/jam. Field narasi tetap lebar.
- Tablet: kurangi jumlah kolom sebelum input mulai terasa sempit.
- Mobile: semua field satu kolom, termasuk field yang pada desktop berpasangan.
- Field dengan error tidak boleh membuat halaman bergeser secara mengejutkan tanpa konteks.
- Tombol submit dan cancel harus mudah ditemukan; pada mobile tombol utama dapat ditampilkan setelah form, bukan selalu sticky.

### 13.4 Kalender dan jadwal

- Desktop: kalender mingguan + filter dan/atau agenda samping.
- Tablet: kalender menyesuaikan jumlah kolom waktu yang dapat dibaca; pertimbangkan mode agenda.
- Mobile: daftar agenda per hari adalah pilihan utama; kalender mini dapat dipakai untuk memilih tanggal.
- Informasi tutor/ruangan tidak boleh hilang hanya karena kartu jadwal menjadi lebih kecil.

### 13.5 Pembayaran dan bukti transfer

- Desktop: detail tagihan dan panel unggah/verifikasi dapat berdampingan.
- Mobile: ringkasan tagihan terlebih dahulu, kemudian unggah bukti, status, dan riwayat.
- Nominal, status, tenggat, dan tindakan utama harus terlihat tanpa zoom.
- Preview bukti file tidak boleh melebihi lebar viewport; dukung nama file jika preview tidak dapat ditampilkan.

### 13.6 Print layout

Kwitansi atau dokumen pembayaran harus:

- Memakai latar putih dan teks gelap.
- Menghilangkan sidebar, header navigasi, tombol, dan kontrol aplikasi.
- Menjaga nomor kwitansi, identitas lembaga, nama pembayar/siswa, nominal, tanggal, dan status tetap terbaca.
- Menghindari pemotongan tabel atau elemen penting antarhalaman.
- Tidak mengandalkan warna sebagai satu-satunya penanda lunas.

---

## 14. Aksesibilitas

Target implementasi adalah \*\*WCAG 2.2 AA\*\* sejauh relevan dengan komponen dan konteks aplikasi.

Checklist dasar:

- Kontras teks normal minimal 4.5:1; teks besar minimal 3:1.
- Semua fungsi utama bisa digunakan dengan keyboard.
- Focus indicator terlihat dan tidak tertutup elemen sticky.
- Setiap input memiliki label programatis; placeholder bukan pengganti label.
- Error dikaitkan ke field dan disampaikan sebagai teks.
- Ikon-only button mempunyai nama aksesibel.
- Gambar informatif memiliki alternative text; gambar dekoratif memakai alt kosong.
- Struktur heading berurutan dan landmark halaman konsisten.
- Status tidak dibedakan hanya dengan warna.
- Modal/dialog mengatur fokus dengan benar.
- Tabel memiliki header dan hubungan header-cell yang tepat.
- Grafik disertai ringkasan atau data alternatif.
- Animasi menghormati \`prefers-reduced-motion\`.
- Jangan menggunakan flash atau animasi yang mengganggu.
- Jangan menyampaikan informasi penting hanya lewat hover.

---

## 15. Motion dan Interaction Feedback

Motion bersifat fungsional, singkat, dan tidak menghambat.

- Durasi transisi mikro: sekitar 120–200 ms.
- Drawer/dialog: sekitar 160–240 ms bila motion diaktifkan.
- Gunakan perubahan opacity/transform ringan untuk open/close, bukan animasi berlebihan.
- Semua animasi dekoratif harus dikurangi atau dimatikan saat \`prefers-reduced-motion: reduce\` aktif.
- Jangan menganimasikan perubahan angka KPI secara terus-menerus.
- Loading harus menunjukkan aktivitas tanpa membuat layout berkedip.
- Toast tidak boleh menutupi tombol penting atau input yang sedang digunakan.
- Landing page: tanpa animasi scroll-reveal per section dan tanpa efek hover berlebihan pada setiap kartu. Bila perlu satu momen masuk, batasi pada hero (fade 200–240 ms) dan hormati \`prefers-reduced-motion\`.

---

## 16. Respons terhadap Error dan Edge Cases

Desain harus mengantisipasi kondisi berikut:

- Koneksi lambat atau request gagal.
- Session berakhir.
- Data belum tersedia.
- Daftar sangat panjang.
- Nama, alamat, atau judul sangat panjang.
- File terlalu besar atau tipe tidak didukung.
- Upload terputus.
- Jadwal bentrok setelah dua admin mengedit hampir bersamaan.
- Perubahan data tidak punya izin.
- Pengguna mengakses detail yang sudah dihapus atau tidak lagi tersedia.
- Chart belum memiliki cukup data.
- Notifikasi tidak dapat dimuat.
- Pengguna memiliki beberapa anak yang terhubung.

Untuk setiap kondisi, tentukan apakah UI akan menampilkan inline error, halaman error, retry action, atau redirect login. Hindari hanya menampilkan error generik \`Terjadi kesalahan\` jika sistem dapat memberi penjelasan yang aman dan berguna.

---

## 17. Konfigurasi agar Reusable Lintas Domain

Pisahkan desain ke tiga lapisan:

1. \*\*Foundation:\*\* warna, tipografi, spacing, radius, focus, elevasi, breakpoints.
2. \*\*Patterns:\*\* app shell, form, table, filter, dashboard, file upload, notifikasi, empty/loading/error states.
3. \*\*Domain configuration:\*\* nama produk, logo, istilah entitas, role, menu, halaman, field, status, aturan bisnis, dan konten landing page.

### 17.1 Hal yang harus menjadi konfigurasi

- Nama aplikasi dan nama pendek.
- Logo/wordmark dan favicon.
- Warna aksen merek.
- Daftar role beserta labelnya.
- Daftar navigasi per role.
- Nama entitas (contoh: Siswa, Tutor, Kelas) dan label plural.
- Enum status dan mapping warna/label.
- Format tanggal, uang, dan zona waktu.
- Section landing page yang aktif.
- CTA utama dan rute tujuan.
- Metadata tabel dan filter yang tersedia.
- Ketentuan upload untuk tiap kategori file.
- Keluarga font (sans dan serif) serta warna \`accent\` dan \`accentText\`.
- Aktif atau tidaknya tiap section landing page (\`gallery\`, \`whyUs\`, \`testimonials\`, \`pricing\`) berdasarkan ketersediaan data resmi.
- Teks hero, program, statistik, testimoni, paket, dan kontak footer.

### 17.2 Contoh konfigurasi domain

Contoh berikut merupakan ilustrasi struktur konfigurasi, bukan kontrak API wajib. Sesuaikan dengan arsitektur kode proyek.

\`\`\`ts
export const productDesignConfig = {
  product: {
    name: "Sistem Informasi Bimbel",
    shortName: "Bimbel",
    language: "id-ID",
    timezone: "Asia/Makassar",
  },
  brand: {
    // Tetap gunakan neutral foundation; ubah accent sesuai identitas organisasi.
    primary: "#202124",
    accent: "#B59A7B", // dekoratif saja
    accentText: "#7F5F3F", // teks kecil; wajib lolos kontras AA
    logoPath: "/brand/logo.svg",
  },
  fonts: {
    sans: "Inter",
    serif: "Source Serif 4", // hanya untuk kutipan dan monogram
  },
  terminology: {
    people: "Siswa",
    peoplePlural: "Siswa",
    instructors: "Tutor",
    groups: "Kelas",
    sessions: "Jadwal",
    invoices: "Tagihan",
  },
  roles: \[
    { id: "admin", label: "Admin", homePath: "/admin" },
    { id: "tutor", label: "Tutor", homePath: "/tutor" },
    { id: "student", label: "Siswa", homePath: "/student" },
    { id: "parent", label: "Orang Tua", homePath: "/parent" },
  \],
  publicNavigation: \[
    { label: "Beranda", href: "/" },
    { label: "Program", href: "/program" },
    { label: "Tentang", href: "/tentang" },
    { label: "Kontak", href: "/kontak" },
  \],
  landing: {
    // Section opsional hanya diaktifkan bila datanya resmi dan tersedia.
    sections: \[
      { id: "hero", enabled: true },
      { id: "programs", enabled: true },
      { id: "gallery", enabled: false },
      { id: "whyUs", enabled: true },
      { id: "testimonials", enabled: false },
      { id: "pricing", enabled: false },
      { id: "cta", enabled: true },
    \],
  },
};
\`\`\`

Untuk domain lain, ganti \`terminology\`, role, route, label, status, dan landing content. Fondasi visual dan pola interaksi tidak perlu ditulis ulang.

### 17.3 Prinsip komponen generik

Contoh penamaan abstrak yang lebih reusable:

- \`EntityTable\` menerima kolom dan data, bukan mengunci kolom siswa.
- \`StatusBadge\` menerima label dan semantic variant.
- \`RoleNavigation\` menerima daftar menu berdasarkan role.
- \`MetricCard\` menerima label, nilai, periode, dan konteks.
- \`FileUploadField\` menerima accepted types, max size, dan callback.
- \`EmptyState\` menerima title, description, dan optional action.
- \`PageHeader\` menerima title, description, breadcrumb, dan optional primary action.

Hindari membuat semua komponen abstrak secara berlebihan. Abstraksi layak dilakukan ketika pola digunakan ulang dan variasi/kontraknya sudah jelas.

---

## 18. Rekomendasi Implementasi untuk Stack PRD

Bagian ini adalah pemetaan desain ke stack yang tercantum di PRD, bukan pengganti dokumentasi framework.

- \*\*TanStack Start + React 19:\*\* implementasikan kerangka halaman, routing bertipe, dan kebutuhan SSR sesuai arsitektur aplikasi.
- \*\*Tailwind CSS v4:\*\* petakan design tokens ke custom properties dan utility styles. Token harus memiliki satu sumber kebenaran.
- \*\*Font:\*\* muat Inter dan serif untuk kutipan secara self-host (misalnya lewat paket Fontsource) dengan \`font-display: swap\` dan fallback sistem sesuai 4.4. Jangan memuat weight atau gaya yang tidak dipakai.
- \*\*shadcn/ui + Radix UI:\*\* gunakan sebagai basis komponen yang aksesibel, kemudian atur token, varian, dan komposisinya agar sesuai design system.
- \*\*TanStack Query v5:\*\* konsistenkan state loading/error/refetch dan invalidasi cache untuk perubahan presensi, pembayaran, jadwal, atau materi.
- \*\*TanStack Table v8:\*\* gunakan untuk daftar administratif dengan sorting/filter/pagination yang sesuai; pilih server-side pagination untuk daftar besar sebagaimana disebut di PRD.
- \*\*Supabase Auth/PostgreSQL/Storage/Realtime:\*\* UI menampilkan hasil sesuai hak akses, sedangkan otorisasi, RLS, validasi data, dan akses berkas tetap dipastikan di layer backend/database.

### 18.1 Aturan implementasi tema

- Simpan token warna/typography/spacing di lokasi tema bersama.
- Jangan menaruh warna brand sebagai literal di setiap komponen.
- Gunakan semantic token seperti \`background\`, \`foreground\`, \`primary\`, \`muted\`, \`border\`, \`destructive\`, bukan token berdasarkan nama halaman.
- Bedakan komponen visual dari query/fetching bila memungkinkan.
- Gunakan format data dan komponen status yang konsisten.
- Semua halaman role harus berbagi shell dan komponen dasar yang sama, tetapi menerima navigasi serta data sesuai hak akses.
- Periksa dark mode hanya bila memang masuk scope produk. Jangan setengah mendukung dark mode dengan token yang belum diuji.

---

## 19. Struktur Halaman yang Disarankan

Contoh struktur route untuk implementasi awal. Nama rute boleh berubah menyesuaikan pola routing proyek, tetapi makna dan hak akses harus dipertahankan.

\`\`\`text
/
├── /program
├── /tentang
├── /kontak
├── /daftar
├── /login
├── /admin
│   ├── /pendaftaran
│   ├── /siswa
│   ├── /tutor
│   ├── /orang-tua
│   ├── /ruangan
│   ├── /mata-pelajaran
│   ├── /paket
│   ├── /kelas
│   ├── /jadwal
│   ├── /pembayaran
│   └── /pengumuman
├── /tutor
│   ├── /jadwal
│   ├── /presensi
│   ├── /materi
│   └── /nilai
├── /student
│   ├── /jadwal
│   ├── /materi
│   ├── /presensi
│   ├── /nilai
│   └── /tagihan
└── /parent
    ├── /anak
    ├── /presensi
    ├── /rapor
    ├── /tagihan
    └── /notifikasi
\`\`\`

Daftar subroute di atas adalah usulan pengelompokan UI dari kebutuhan PRD, bukan bukti bahwa semua halaman telah diimplementasikan. Jangan menampilkan menu atau rute yang belum tersedia sebagai seolah-olah sudah berfungsi.

---

## 20. Design QA dan Acceptance Checklist

### Visual consistency

- \[ \] Semua halaman memakai token yang sama untuk warna, tipografi, radius, dan spacing.
- \[ \] Warna aksen digunakan hemat dan tidak menurunkan kontras.
- \[ \] Hierarki heading dan tombol utama konsisten.
- \[ \] Kartu hanya digunakan bila membantu pengelompokan informasi.
- \[ \] Ikon berasal dari keluarga yang sama dan memiliki ukuran konsisten.

### Kesesuaian dengan referensi

- \[ \] Hero memakai teks di kiri dan grid 4 tile asimetris di kanan (gap 8 px, radius tile 2 px).
- \[ \] Headline hero maksimal dua baris dan satu warna.
- \[ \] Eyebrow hanya ada di halaman publik, satu per section, dan memakai \`--accent-text\`.
- \[ \] Hanya ada satu CTA primary gelap per konteks; panah hanya pada tautan yang pindah halaman.
- \[ \] Kartu datar (border 1 px, tanpa shadow) dengan radius sesuai token.
- \[ \] Galeri, statistik, testimoni, dan paket hanya tampil bila datanya resmi tersedia.
- \[ \] Teks aksen lolos kontras 4.5:1 dan tidak ada teks abu-abu sangat muda.
- \[ \] Blok CTA dan footer gelap memakai \`--inverse-muted\` untuk teks sekunder.

### Responsive behavior

- \[ \] Halaman diuji pada lebar 320, 360, 390, 768, 1024, 1280, dan 1440 px.
- \[ \] Tidak ada overflow horizontal pada seluruh halaman.
- \[ \] Sidebar menjadi drawer pada layar kecil.
- \[ \] Form berubah menjadi satu kolom pada mobile.
- \[ \] Tabel memiliki strategi mobile yang disengaja.
- \[ \] Tombol utama dan field mudah digunakan dengan sentuhan.
- \[ \] Kalender memiliki mode agenda/daftar untuk mobile.
- \[ \] Konten sticky tidak menutup fokus atau input.

### Functional states

- \[ \] Setiap halaman data memiliki loading, error, empty, dan populated state.
- \[ \] Form menampilkan validasi yang relevan dan mempertahankan input aman ketika gagal.
- \[ \] Tombol asynchronous mencegah submit berulang.
- \[ \] Status pembayaran dan presensi memakai label yang jelas.
- \[ \] Konflik jadwal menjelaskan sumber konflik dan cara memperbaiki.
- \[ \] Notifikasi mengarah ke detail yang relevan.
- \[ \] Aksi destruktif memiliki konfirmasi spesifik.
- \[ \] Upload menunjukkan batas ukuran/tipe dan feedback hasil.

### Access and data privacy

- \[ \] Menu dan aksi mengikuti role yang aktif.
- \[ \] UI tidak menjadi satu-satunya layer otorisasi.
- \[ \] Data siswa dan orang tua sesuai relasi akses.
- \[ \] Bukti pembayaran dan materi privat tidak ditampilkan ke pengguna tanpa izin.
- \[ \] Pesan error tidak mengekspos detail teknis sensitif.

### Accessibility

- \[ \] Semua tindakan inti dapat dilakukan dengan keyboard.
- \[ \] Focus ring terlihat.
- \[ \] Input memiliki label dan error terhubung.
- \[ \] Kontras warna memenuhi target.
- \[ \] Status tidak hanya dibedakan melalui warna.
- \[ \] Dialog mengelola fokus dengan benar.
- \[ \] Grafik memiliki ringkasan atau alternatif data.
- \[ \] Reduced motion dihormati.

### Domain portability

- \[ \] Nama produk dan istilah domain berada di konfigurasi.
- \[ \] Role dan menu tidak di-hardcode ke komponen generik.
- \[ \] Status menggunakan mapping label/variant terpusat.
- \[ \] Tanggal, mata uang, dan zona waktu dapat dikonfigurasi.
- \[ \] Landing page dapat mengubah section aktif dan CTA tanpa menulis ulang fondasi.
- \[ \] Komponen generik tidak menyimpan asumsi khusus tentang bimbel.

---

## 21. Definition of Done untuk Halaman Baru

Sebuah halaman dinyatakan selesai secara desain jika:

1. Tujuan pengguna dan primary action jelas.
2. Data, label, status, dan tindakan sesuai role.
3. Tampilan desktop, tablet, dan mobile sudah ditinjau.
4. Loading, error, empty, dan success state yang relevan sudah dirancang.
5. Validasi form dan pesan kesalahan dapat dipahami pengguna.
6. Fokus keyboard, label aksesibel, dan kontras sudah diperiksa.
7. Konten tidak menggunakan data, angka, harga, alamat, atau testimoni rekaan.
8. Komponen memakai design tokens dan pola yang sudah ada sebelum membuat pola baru.
9. Perubahan data penting memberikan feedback yang jelas.
10. Tidak ada informasi sensitif yang bocor melalui menu, notifikasi, preview, atau state UI.

---

## 22. Ringkasan Arah Desain

Gunakan gaya editorial minimalis dari referensi untuk membangun identitas yang tenang dan profesional pada halaman publik: latar putih hangat, headline besar dan rapat, hero asimetris dengan grid visual, kartu datar bergaris tipis, aksen beige untuk dekorasi dan cokelat untuk teks kecil, CTA serta footer gelap, dan visual yang relevan. Section opsional (galeri, statistik, testimoni, paket) hanya tampil bila datanya resmi. Setelah login, pertahankan karakter tersebut melalui warna netral, border halus, komponen konsisten, serta hierarki yang jelas, tetapi utamakan kecepatan kerja dan kepadatan informasi yang sesuai.

Untuk implementasi bimbel, desain harus secara eksplisit mendukung empat role, pendaftaran, jadwal anti-bentrok, presensi, materi, progres nilai, pembayaran, dan notifikasi. Untuk penggunaan lintas proyek, pertahankan foundation dan patterns, lalu pindahkan istilah domain, role, rute, status, format data, serta konten pemasaran ke konfigurasi. Dengan pendekatan ini, \`DESIGN.md\` dapat menjadi acuan implementasi yang reusable, bukan sekadar moodboard atau deskripsi visual.