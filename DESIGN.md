# DESIGN.md — Reusable Design System &amp; UI/UX Specification

&gt; \*\*Project profile:\*\* Sistem Informasi Bimbingan Belajar Berbasis Web, Kota Palu  
&gt; \*\*Document version:\*\* 2.0  
&gt; \*\*Status:\*\* Design baseline — Poster Kontras Tinggi (\`#000000\`, \`#CB2957\`, \`#EEEEEE\`)  
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

### 2.2 Arah visual: Poster Kontras Tinggi

Landing page memakai pendekatan \*\*poster editorial kontras tinggi\*\* yang tegas, bebas jargon teknis, dan langsung berbicara kepada orang tua serta siswa:

- Kanvas terang abu-abu dingin (\`#EEEEEE\`), teks dan garis struktur hitam pekat (\`#000000\`), serta satu aksen merah kirmizi (\`#CB2957\`) yang dipakai terukur.
- Tipografi display memakai grotesk tebal/condensed (\`Archivo\`) untuk judul besar dan angka, dipadukan dengan sans-serif bersih (\`Instrument Sans\`) untuk paragraf dan UI.
- Hero tipografi skala penuh tanpa mockup aplikasi SaaS generik; diakhiri strip 3 fakta nyata di bagian bawah.
- Pemisah antarbagian dan antarelemen menggunakan garis hitam tegas (\`1–2px\`), sudut tajam (\`2–4px\`), tanpa shadow pada halaman publik (\`landing.css\`).
- Ikon dikurangi seminimal mungkin di halaman publik: hanya panah pada CTA utama, chevron pada accordion FAQ, dan tombol menu mobile.
- Copy menggunakan bahasa sehari-hari yang sopan ("Anak Anda", "kamu") tanpa istilah internal sistem (seperti kode fitur, nama database, atau jargon operasional).

Karakter ini diterapkan dengan dua tingkat kepadatan:

1. \*\*Halaman publik (\`index.html\` + \`landing.css\`):\*\* tajam, datar, tipografis, berorientasi pada kejelasan manfaat bagi orang tua dan pendaftaran cepat.
2. \*\*Aplikasi setelah login (\`dashboard.html\` + \`styles.css\`):\*\* mewarisi palet warna dan pasangan font yang sama dari \`:root\`, namun mempertahankan radius yang nyaman (\`6–14px\`) dan permukaan kartu putih (\`#FFFFFF\`) agar tabel, form, dan tugas harian mudah dipindai.

#### Pemetaan blok halaman publik

| Blok | Fungsi utama | Aturan konten & visual | Flag section |
|---|---|---|---|
| Header | Identitas, 4 tautan jangkar, \`Masuk\` (link), \`Daftar\` (tombol hitam) | Logo teks tanpa kotak monogram | \`header\` (wajib) |
| Hero | Headline raksasa + 1 kata aksen merah, kalimat pendukung, CTA + link, strip 3 fakta | Tanpa mockup; angka diambil dari fakta nyata layanan | \`hero\` (wajib) |
| Program (\`01–04\`) | Daftar baris bernomor untuk SD, SMP, SMA, dan UTBK | Bukan grid kartu; baris \`04\` (UTBK) disorot dengan blok hitam penuh | \`programs\` (wajib) |
| Untuk Orang Tua | Menjelaskan manfaat pemantauan anak + contoh pesan WhatsApp kehadiran | 2 kolom: kiri narasi + contoh pesan WA hitam, kanan 4 poin manfaat | \`forParents\` (wajib) |
| Cara Daftar | 3 langkah sederhana dari isi formulir sampai kelas percobaan gratis | Nomor raksasa berwarna \`#CB2957\`, tanpa kotak kartu/ikon | \`steps\` (wajib) |
| FAQ | 7 pertanyaan umum dengan accordion | Judul di kiri (sticky pada desktop), daftar accordion di kanan | \`faq\` (wajib) |
| CTA & Footer | Permukaan hitam penutup berisi ajakan kelas gratis + informasi lembaga | Blok hitam menyatu dari CTA hingga footer 4 kolom | \`cta\`, \`footer\` (wajib) |

#### Yang dibawa ke aplikasi setelah login

Dibawa: token warna \`:root\` (\`--background: #EEEEEE\`, \`--foreground: #000000\`, \`--accent: #CB2957\`, warna status semantik yang diredam), serta pasangan font \`Archivo\` (heading) dan \`Instrument Sans\` (body/tabel/form).

Tidak dibawa: sudut siku tajam \`2px\`, garis pemisah hitam \`2px\`, ukuran judul poster raksasa, dan penghapusan shadow pada modal/panel melayang.

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
- Mockup dashboard generik ala template SaaS atau istilah teknis internal di halaman publik yang ditujukan untuk orang tua/siswa.
- Menampilkan terlalu banyak kartu KPI tanpa menjelaskan arti atau tindakan lanjutnya.
- Menggunakan warna merah untuk semua hal yang dianggap penting, atau mencampuradukkan merah brand (\`#CB2957\`) dengan merah error (\`--destructive\`).
- Mengandalkan placeholder sebagai label form.
- Menampilkan tabel desktop penuh di layar ponsel tanpa strategi responsif.
- Menampilkan seluruh menu semua role kepada setiap pengguna.
- Menggunakan dialog untuk setiap operasi kecil; gunakan halaman atau panel kontekstual bila tugasnya panjang.
- Mengandalkan toast sebagai satu-satunya penjelasan untuk kesalahan penting.
- Menggunakan gambar stok generik atau ikon dekoratif di setiap paragraf/kartu.

### 3.3 Aturan Khusus Copywriting & Indikator Status (Anti-Slop & Anti-Hardcode Emote)

1. **Aturan Copywriting & Konteks Wilayah**:
   - Frasa nama kota (*"Kota Palu"*) hanya diperuntukkan bagi halaman publik (Hero, Footer, SEO metadata) dan dokumen faktual (alamat fisik lembaga, surat/kwitansi resmi).
   - Di panel internal/dashboard admin, dilarang menaruh embel-embel "· Kota Palu" pada setiap *eyebrow*, heading, atau label menu. Staf operasional sudah mengetahui entitas lembaganya, sehingga teks harus padat, fungsional, dan langsung ke inti (*to the point*).
   - Dilarang keras menampilkan kode PRD internal (seperti `(BILL-01)`, `(BILL-03)`, `(SCHED-01)`, `(SCHED-02)`) pada antarmuka pengguna. Tuliskan deskripsi tindakan secara manusiawi dan profesional.

2. **Aturan Indikator Status (Zero Background / Border & Anti-Hardcode Emote)**:
   - Dilarang menggunakan background tonal atau border pada status indikator (anti-slop). Status tidak boleh berbentuk kotak atau pill badge tombol.
   - Status wajib tampil bersih sebagai **inline text semantik** (`font-medium text-xs`) disertai ikon resmi Lucide (`Clock`, `AlertCircle`, `CheckCircle2`, `XCircle`).
   - Dilarang menggunakan karakter unicode kasar/hardcode seperti `✓`, `✗`, `✕`, `•`, `↗`, atau huruf `X` telanjang sebagai indikator status.
   - Dilarang menggunakan titik mengambang telanjang (*bare naked dots*, seperti `<span className="w-2 h-2 rounded-full" />`).

3. **Aturan Teks Non-Klik (Zero Fake Buttons)**:
   - Dilarang membungkus teks statis non-klik (seperti nomor invoice, NIS siswa, ID registrasi, kode mapel/ruangan, durasi jam, atau metadata) dengan background dan border (`bg-[#F6F6F6] border border-[#D2D2D2]`) yang membuatnya menyerupai tombol interaktif.
   - Teks statis dan kode identifikasi wajib ditampilkan sebagai teks bersih (misal: monospace netral `font-mono text-xs text-[#555555]`). Background dan border hanya diizinkan untuk tombol, input form, atau elemen yang secara eksplisit diminta pengguna.

4. **Aturan Keseragaman Tipografi Footer Metrik KPI**:
   - Footer kartu metrik/KPI wajib menggunakan tipografi netral yang konsisten (`font-medium text-[#292524]` dan `text-[11px] text-[#555555]`).
   - Dilarang menggunakan panah kasar `↗` atau kombinasi warna-warni yang bertabrakan pada footer metrik.

---

## 4. Identitas Visual

### 4.1 Karakter merek

\*\*Kata kunci:\*\* tegas, jujur, terorganisir, transparan, mudah dipahami, dan tidak bertele-tele.

Halaman publik berbicara langsung kepada orang tua dan siswa dengan bahasa sehari-hari yang jelas, sedangkan dashboard mengutamakan keterbacaan data dan kecepatan kerja harian.

### 4.2 Palet warna dasar

Palet utama dibangun dari tiga warna inti (\`#EEEEEE\`, \`#000000\`, \`#CB2957\`) dan dipetakan ke CSS variables pada \`:root\` di \`styles.css\`.

| Token | Nilai | Kegunaan |
|---|---|---|
| \`--background\` | \`#EEEEEE\` | Kanvas utama halaman publik dan latar kerja dashboard |
| \`--foreground\` | \`#000000\` | Teks utama dan garis struktur pada landing page |
| \`--surface\` | \`#FFFFFF\` | Permukaan kartu dashboard, tabel, dan input form |
| \`--surface-muted\` | \`#EEEEEE\` | Area sekunder setara kanvas |
| \`--surface-subtle\` | \`#E3E3E3\` | Hover lembut dan kelompok kontrol |
| \`--surface-warm\` | \`#F6F6F6\` | Permukaan terang sekunder (mis. kwitansi) |
| \`--border\` | \`#D2D2D2\` | Garis kartu, separator, dan tabel di dashboard |
| \`--border-input\` | \`#6B6B6B\` | Garis input, select, dan kontrol form di dashboard |
| \`--muted-foreground\` | \`#555555\` | Keterangan, metadata, dan teks sekunder |
| \`--primary\` | \`#000000\` | Tombol hitam utama, baris unggulan UTBK, serta blok CTA & footer |
| \`--primary-foreground\` | \`#EEEEEE\` | Teks di atas permukaan hitam \`--primary\` |
| \`--inverse-muted\` | \`#A3A3A3\` | Teks sekunder di atas permukaan hitam (CTA, footer, baris UTBK) |
| \`--accent\` | \`#CB2957\` | Aksen utama: tombol CTA merah, 1 kata sorotan di headline, nomor langkah besar, garis bawah hover |
| \`--accent-text\` | \`#A81E46\` | Varian merah lebih gelap untuk teks kecil beraksen di latar terang |
| \`--accent-foreground\` | \`#7A1534\` | Teks di atas latar \`--accent-light\` |
| \`--accent-on\` | \`#FFFFFF\` | Teks di atas tombol/badge \`--accent\` (\`#CB2957\`) |
| \`--accent-light\` | \`#FBEAEF\` | Latar merah sangat muda untuk badge aksen |
| \`--ring\` | \`#CB2957\` | Focus ring yang terlihat jelas |
| \`--success\` | \`#2E6B4C\` | Keberhasilan dan status positif (diredam agar selaras dengan palet) |
| \`--warning\` | \`#85600F\` | Peringatan dan kondisi yang membutuhkan perhatian |
| \`--destructive\` | \`#A1301C\` | Kesalahan/penolakan (merah bata ber-hue oranye agar berbeda dari \`#CB2957\`) |
| \`--info\` | \`#3A5A80\` | Informasi netral dan status sedang diproses |

\*\*Aturan penggunaan warna:\*\*

- Kanvas utama memakai \`#EEEEEE\` dan struktur teks/garis memakai \`#000000\`. Permukaan hitam penuh di halaman publik hanya digunakan pada baris program unggulan (UTBK) serta bagian penutup (CTA + footer).
- \`#CB2957\` (\`--accent\`) dipakai secara hemat untuk mengarahkan mata: tombol CTA utama, 1 kata penekanan pada headline hero/CTA, angka langkah \`1–2–3\`, penanda poin program, dan garis bawah hover.
- Karena rasio kontras \`#CB2957\` di atas \`#EEEEEE\` adalah \*\*4.5:1\*\* (tepat di batas minimum AA), gunakan \`#CB2957\` hanya pada teks besar/tebal atau elemen grafis. Untuk teks kecil beraksen di latar terang, gunakan \`--accent-text\` (\`#A81E46\`, 5.9:1).
- Di atas permukaan \`#CB2957\` (seperti tombol CTA dan badge unggulan), selalu gunakan teks putih \`#FFFFFF\` (\`--accent-on\`, 5.3:1). Jangan pernah meletakkan teks hitam di atas \`#CB2957\`.
- Warna status di dashboard bersifat semantik dan selalu disertai label teks atau ikon supaya tidak tertukar dengan merah brand.

\*\*Kontras pasangan utama\*\* (dihitung dengan rumus WCAG 2.x):

| Teks / elemen | Latar | Rasio | Catatan |
|---|---|---:|---|
| \`--foreground\` (\`#000000\`) | \`--background\` (\`#EEEEEE\`) | 18.1:1 | Lolos AAA untuk semua ukuran teks |
| \`--muted-foreground\` (\`#555555\`) | \`--background\` (\`#EEEEEE\`) | 6.5:1 | Lolos AA untuk teks kecil |
| \`--accent\` (\`#CB2957\`) | \`--background\` (\`#EEEEEE\`) | 4.5:1 | Pas batas AA; batasi untuk teks besar/tebal & aksen |
| \`--accent-text\` (\`#A81E46\`) | \`--background\` (\`#EEEEEE\`) | 5.9:1 | Lolos AA untuk teks kecil |
| \`--accent-on\` (\`#FFFFFF\`) | \`--accent\` (\`#CB2957\`) | 5.3:1 | Lolos AA untuk tombol CTA & badge |
| \`--primary-foreground\` (\`#EEEEEE\`) | \`--primary\` (\`#000000\`) | 18.1:1 | Lolos AAA di blok hitam |
| \`--inverse-muted\` (\`#A3A3A3\`) | \`--primary\` (\`#000000\`) | 8.3:1 | Lolos AAA untuk teks sekunder di blok hitam |

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

Gunakan pasangan font yang kontras antara judul dan isi:

- \*\*Display / Heading (\`--font-display\`):\*\* \*\*Archivo\*\* (variable width \`62..125\`, weight \`500..900\`), digunakan dengan \`font-stretch: 70%–85%\` dan weight \`700–800\` untuk memberikan karakter poster yang padat dan tegas.
- \*\*Body & UI (\`--font-sans\`):\*\* \*\*Instrument Sans\*\* (weight \`400..700\`), fallback \`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif\`.

| Token | Ukuran / line-height | Pemakaian |
|---|---|---|
| \`display-hero\` | \`clamp(3.25rem, 9vw, 8.25rem) / 0.9\`, \`Archivo\` stretch 72%, weight 800, tracking \`-0.025em\` | Headline hero halaman publik |
| \`display-cta\` | \`clamp(2.75rem, 7vw, 6rem) / 0.92\`, \`Archivo\` stretch 72%, weight 800 | Judul blok CTA penutup |
| \`h2-landing\` | \`clamp(2.25rem, 5vw, 4rem) / 0.95\`, \`Archivo\` stretch 75%, weight 800 | Judul section halaman publik |
| \`h1\` (dashboard) | \`clamp(1.75rem, 3vw, 2.5rem) / 1.15\`, \`Archivo\` weight 700 | Judul halaman utama di dashboard |
| \`h2\` / \`h3\` | \`1.125rem–1.5rem / 1.15–1.35\`, \`Archivo\` weight 700 | Judul subbagian, baris program, dan panel |
| \`body-landing\` | \`1rem–1.1875rem / 1.55–1.6\`, \`Instrument Sans\` | Paragraf halaman publik |
| \`body\` (dashboard) | \`0.9375rem / 1.55\`, \`Instrument Sans\` | Paragraf, tabel, dan informasi operasional |
| \`label\` / \`button\` | \`0.875rem–0.9375rem / 1.25\`, weight 600 | Label form dan tombol |
| \`caption\` | \`0.75rem–0.8125rem / 1.4\` | Metadata, timestamp, helper text |

Aturan tipografi:

- Pada headline hero dan judul CTA penutup di halaman publik, diperbolehkan menyorot \*\*maksimal satu kata kunci\*\* dengan warna \`--accent\` (\`#CB2957\`) menggunakan elemen \`<em>\` (\`font-style: normal\`).
- Paragraf utama dibatasi sekitar 45–65 karakter per baris agar nyaman dibaca.
- Angka statistik, nomor urut program (\`01–04\`), nilai, dan nominal uang wajib memakai \`font-variant-numeric: tabular-nums\`.

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

### 4.6 Radius, border, dan shadow

Sistem membedakan perlakuan bentuk antara halaman publik (\`body.landing\` di \`landing.css\`) dan aplikasi dashboard (\`styles.css\`):

| Konteks | Radius | Border & Pemisah | Shadow |
|---|---|---|---|
| \*\*Landing Page (\`body.landing\`)\*\* | Tajam: \`2px\` (\`--radius-sm/md\`) hingga \`4px\` (\`--radius-lg/xl\`) | Garis hitam tegas \`2px solid #000000\` (\`--rule\`) untuk struktur utama dan \`1px solid #000000\` (\`--rule-thin\`) untuk sub-baris | \*\*Tidak ada shadow\*\* (\`none\`) pada seluruh elemen termasuk modal |
| \*\*Dashboard (\`styles.css\`)\*\* | Nyaman: \`6px\` (\`sm\`), \`10px\` (\`md\`), \`14px\` (\`lg\`) | Border abu-abu \`1px solid #D2D2D2\` (\`--border\`) untuk kartu dan tabel | Halus (\`--shadow-sm\` s.d. \`--shadow-lg\`) untuk kartu dan dialog melayang |

### 4.7 Ikon

- Di halaman publik (\`index.html\`), penggunaan ikon dibatasi secara ketat: hanya panah (\`arrow-right\`) pada CTA utama, \`chevron-down\` pada pemicu FAQ, serta ikon \`menu\` dan \`x\` pada navigasi mobile/modal. Jangan menambahkan ikon dekoratif pada daftar program, langkah pendaftaran, atau poin manfaat.
- Di dashboard (\`dashboard.html\`), ikon Lucide (\`16–20px\`) tetap digunakan pada sidebar, tombol aksi, dan indikator status untuk mempercepat pemindaian tugas operasional.

---

## 5. Layout System

### 5.1 Grid dan container

- Gunakan container terpusat dengan lebar maksimum \`1240px\`, padding horizontal \`16px\` pada ponsel dan \`24px\` pada desktop.
- Area kerja dashboard menggunakan sisa lebar layar setelah sidebar (\`256px\`).

### 5.2 Breakpoint responsif

| Nama | Lebar | Perilaku utama |
|---|---:|---|
| \`xs / sm\` | \`&lt; 768px\` | Satu kolom penuh, strip fakta hero tersusun vertikal, baris program dan langkah pendaftaran bertumpuk, tombol CTA full-width |
| \`md\` | \`768–900px\` | Navigasi header berubah menjadi tombol hamburger + drawer samping; grid 2 kolom disederhanakan menjadi 1 kolom |
| \`lg\` | \`901–1024px\` | Baris program menyusun tombol di bawah deskripsi; sidebar dashboard menjadi drawer |
| \`xl+\` | \`&gt; 1024px\` | Layout desktop penuh |

### 5.3 Target sentuh dan fokus

- Target interaksi minimal \`44 × 44 px\` pada perangkat sentuh.
- Semua elemen interaktif memiliki focus ring \`2px solid var(--ring)\` (\`#CB2957\`).

---

## 6. Arsitektur Pengalaman Pengguna

### 6.1 Area publik (\`index.html\`)

Tujuan: menjelaskan manfaat nyata bimbingan belajar kepada orang tua dan siswa tanpa istilah teknis, menampilkan program SD–UTBK, dan mengarahkan ke pendaftaran atau percobaan kelas gratis.

### 6.2 Area aplikasi setelah login (\`dashboard.html\`)

Tujuan: menyelesaikan pekerjaan harian untuk empat peran (\`admin\`, \`tutor\`, \`student\`, \`parent\`).

---

## 7. Halaman Publik: Landing Page

### 7.0 Urutan section dan wireframe

Halaman publik terdiri dari **5 blok utama** di atas permukaan hitam penutup (CTA + Footer):

\`\`\`text
┌────────────────────────────────────────────────────────────────────┐
│ Tadulako Cendekia     Program  Untuk Orang Tua  Cara Daftar  FAQ   │
│                                                  Masuk   [Daftar]  │  header (border 2px hitam)
├────────────────────────────────────────────────────────────────────┤
│ Bimbingan belajar tatap muka     │ █ JADWAL KELAS SORE · PALU █    │  1. HERO 2 kolom:
│ KELAS KECIL, JADWAL PASTI,       │ ─────────────────────────────── │     teks utama (kiri) +
│ ORANG TUA SELALU TAHU.           │ SD Cendekia      [Sisa 3 kursi] │     papan jadwal (kanan)
│                                  │ SMP Prestasi     [Sisa 4 kursi] │
│ Paragraf ringkas & aksi:         │ SMA Sukses       [Sisa 2 kursi] │
│ [Daftar sekarang →] Lihat program│ Intensif UTBK    [Sisa 2 kursi] │
│ ─────────────────────────────────┴──────────────────────────────── │
│ 12 siswa maks/kelas   │ 4 jenjang SD–UTBK    │ Gratis kelas 1      │  strip 3 fakta
├────────────────────────────────────────────────────────────────────┤
│ PILIH SESUAI JENJANG ANAK                   Ringkasan paket        │  2. PROGRAM (baris 01–04)
│ ══════════════════════════════════════════════════════════════════ │
│ 01  SD Cendekia       │ Deskripsi & 2 poin utama       │ [Pilih]   │
│ ──────────────────────┼────────────────────────────────┼────────── │
│ 02  SMP Prestasi      │ Deskripsi & 2 poin utama       │ [Pilih]   │
│ ──────────────────────┼────────────────────────────────┼────────── │
│ 03  SMA Sukses        │ Deskripsi & 2 poin utama       │ [Pilih]   │
│ ██████████████████████████████████████████████████████████████████ │
│ █ 04 [PROGRAM UNGGULAN]                                          █ │  baris UTBK blok hitam
│ █    Intensif UTBK    │ Deskripsi & 2 poin utama       │ [Pilih] █ │
│ ██████████████████████████████████████████████████████████████████ │
├────────────────────────────────────────────────────────────────────┤
│ ANAK SUDAH SAMPAI DI KELAS?   │ Kabar setiap pertemuan             │  3. UNTUK ORANG TUA
│ ANDA LANGSUNG TAHU.           │ ────────────────────────────────── │
│ ┌───────────────────────────┐ │ Nilai dan catatan tutor            │
│ │ Contoh pesan WhatsApp     │ │ ────────────────────────────────── │
│ │ kehadiran anak (hitam)    │ │ Jadwal tidak pernah bentrok        │
│ └───────────────────────────┘ │ ────────────────────────────────── │
│ Lihat contoh halaman ortu →   │ Bayar les tanpa repot              │
├────────────────────────────────────────────────────────────────────┤
│ TIGA LANGKAH UNTUK MULAI                                           │  4. CARA DAFTAR
│ ───────────────────  ───────────────────  ──────────────────────── │
│ 1 (merah besar)      2 (merah besar)      3 (merah besar)          │
│ Isi formulir         Kami hubungi Anda    Ikut kelas pertama gratis│
├────────────────────────────────────────────────────────────────────┤
│ YANG SERING          │ Apa bedanya dengan bimbel lain?           ^ │  5. FAQ (accordion)
│ DITANYAKAN           │ ─────────────────────────────────────────── │
│                      │ Pertanyaan 2–7                            v │
├════════════════════════════════════════════════════════════════════┤
│ █ COBA SATU KELAS DULU. GRATIS.                                  █ │  CTA + FOOTER hitam
│ █ Ringkasan singkat          [Daftar sekarang →] [Tanya via WA]  █ │
│ █ ────────────────────────────────────────────────────────────── █ │
│ █ Tadulako Cendekia │ Program │ Masuk (4 peran) │ Kontak         █ │
└────────────────────────────────────────────────────────────────────┘
\`\`\`

### 7.1 Header

- **Logo:** Teks \`Tadulako Cendekia\` (\`Archivo\` condensed, \`Tadulako\` tebal 800, \`Cendekia\` 500), tanpa kotak ikon/monogram.
- **Navigasi desktop:** 4 tautan (\`Program\`, \`Untuk Orang Tua\`, \`Cara Daftar\`, \`FAQ\`) dengan garis bawah merah \`2px\` saat hover.
- **Aksi kanan:** \`Masuk\` sebagai tautan teks dan \`Daftar\` sebagai tombol hitam (\`.btn-primary\`).
- **Mobile (\`<= 900px\`):** Tombol hamburger berbingkai hitam \`2px\` membuka drawer kanan berlatar \`#EEEEEE\`.

### 7.2 Hero

- **Grid 2 kolom (\`.lp-hero-grid\`):**
  - **Kolom kiri (\`.lp-hero-main\`):** Baris pengantar singkat, headline \`Archivo\` raksasa (\`clamp(3.25rem, 6.8vw, 6.25rem)\`) dengan kata terakhir \`tahu.\` berwarna \`#CB2957\`, paragraf penjelasan, serta tombol \`.btn-accent\` (\`Daftar sekarang\`) + tautan \`Lihat program\`.
  - **Kolom kanan (\`aside.lp-board\`):** Papan **Jadwal Kelas Sore** bergaya poster cetak (bingkai \`2px solid #000000\`, header hitam pekat, 4 baris interaktif SD, SMP, SMA, dan UTBK beserta hari/jam dan sisa kursi). Setiap baris dapat diklik untuk langsung membuka modal pendaftaran sesuai jenjang.
- Di bawah grid 2 kolom terdapat daftar 3 fakta nyata yang dipisahkan garis hitam (\`12\` siswa maks/kelas, \`4\` jenjang, \`Gratis\` kelas pertama).

### 7.3 Section Program (\`01–04\`)

- Disusun sebagai daftar baris horizontal (\`<ol class="lp-programs">\`), bukan kartu.
- Setiap baris memiliki 4 kolom pada desktop: nomor urut (\`01–04\`), nama jenjang + kelas, deskripsi + poin fitur (dengan penanda kotak kecil merah \`8×8px\`), dan tombol pilih paket yang langsung membuka modal pendaftaran sesuai jenjang.
- Baris \`04\` (\`Intensif UTBK-SNBT\`) menggunakan blok latar hitam penuh (\`.is-featured\`), badge \`Program unggulan\` berlatar \`#CB2957\` dengan teks putih, dan tombol merah.

### 7.4 Section Untuk Orang Tua

- Dua kolom: kolom kiri (sticky pada desktop) memuat judul, penjelasan singkat, simulasi gelembung pesan WhatsApp kehadiran anak berlatar hitam, serta tautan ke simulasi halaman orang tua (\`dashboard.html?role=parent\`).
- Kolom kanan memuat 4 manfaat operasional yang ditulis dari sudut pandang orang tua (kabar kehadiran, nilai & catatan tutor, jadwal bebas bentrok, dan pembayaran/kwitansi).

### 7.5 Section Cara Daftar

- Tiga kolom langkah berurutan tanpa kartu dan tanpa ikon: angka \`1\`, \`2\`, \`3\` berukuran raksasa (\`clamp(4.5rem, 8vw, 7rem)\`) dengan warna \`#CB2957\` di bawah garis hitam \`2px\`.

### 7.6 Section FAQ, Blok CTA, dan Footer

- **FAQ:** Grid 2 kolom (judul besar di kiri, daftar 7 item accordion di kanan). Animasi buka-tutup menggunakan transisi \`grid-template-rows\` yang ringan dan menghormati \`prefers-reduced-motion\`.
- **CTA & Footer (\`.lp-end\`):** Satu permukaan hitam penuh (\`#000000\`) di bagian paling bawah halaman. Bagian atas berisi ajakan \`Coba satu kelas dulu. Gratis.\` beserta tombol merah \`Daftar sekarang\` dan tombol outline terang ke WhatsApp; bagian bawah berisi footer 4 kolom.

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

Gunakan penanda bersih berupa **ikon resmi Lucide + teks semantik inline** tanpa background tonal dan tanpa border (`StatusBadge`), guna mengeliminasi kekacauan visual (*visual clutter*) dan mencegah teks statis tampak seperti tombol (*fake-button slop*).

#### Prinsip Desain:
- **Zero Background / Zero Border:** Status murni berupa teks berwarna semantik dengan ikon Lucide pendamping tanpa bungkus kotak/pill.
- **Aksesibel & Dual-Coding:** Warna selalu ditemani teks atau bentuk ikon spesifik (`Clock`, `AlertCircle`, `CheckCircle2`, `XCircle`), sehingga status tetap terbaca dan mudah dipahami tanpa bergantung pada persepsi warna semata. Dilarang keras memakai dot atau emote unicode kasar (`✓`, `✗`, `•`).
- **Hierarki Bersih:** Maksimal satu indikator status utama per baris data. Informasi netral (seperti nama paket bimbel, info rekening, kode ID) tidak boleh dibungkus dalam badge berwarna.
- **Label Singkat:** Gunakan label singkat dan jelas (misalnya "Lunas", "Ditolak", "Terverifikasi").

#### Varian dan Perilaku:

| Status | Tone | Penanda Visual (Lucide) | Warna Teks | Perilaku & Label Dinamis |
|---|---|---|---|---|
| `menunggu` (normal) | `waiting` | `Clock` (14px) | `#8C5806` (*amber-700*, font-medium) | Jam amber tanpa background. Jika properti `since` diberikan, teks menampilkan durasi tunggu relatif (*"Baru masuk"*, *"Menunggu 15 menit"*, *"Menunggu 2 jam"*). |
| `menunggu` (terlambat) | `late` | `AlertCircle` (14px) | `#901B14` (*red-700*, font-medium) | Lingkaran seru merah tanpa background. Aktif otomatis bila durasi tunggu melampaui `lateAfterHours` (default 48 jam). |
| `lunas` / `terverifikasi` | `done` | `CheckCircle2` (14px) | `#166534` (*green-700*, font-medium) | Lingkaran centang hijau resmi Lucide tanpa background. |
| `ditolak` / `belum_dibayar` | `rejected` | `XCircle` (14px) | `#901B14` (*red-700*, font-medium) | Lingkaran silang merah resmi Lucide tanpa background. |

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
    background: "#EEEEEE",
    primary: "#000000",
    accent: "#CB2957", // CTA utama, sorotan 1 kata di headline, angka langkah
    accentText: "#A81E46", // teks kecil beraksen di latar terang; lolos kontras AA (5.9:1)
  },
  fonts: {
    display: "Archivo",
    sans: "Instrument Sans",
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
    { label: "Program", href: "#program" },
    { label: "Untuk Orang Tua", href: "#orang-tua" },
    { label: "Cara Daftar", href: "#cara-daftar" },
    { label: "FAQ", href: "#faq" },
  \],
  landing: {
    sections: \[
      { id: "hero", enabled: true },
      { id: "programs", enabled: true },
      { id: "forParents", enabled: true },
      { id: "steps", enabled: true },
      { id: "faq", enabled: true },
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
- \*\*Font:\*\* muat \`Archivo\` (variable width & weight) dan \`Instrument Sans\` dengan \`font-display: swap\` dan fallback sistem sesuai 4.4. Jangan memuat weight atau gaya yang tidak dipakai.
- \*\*shadcn/ui + Radix UI:\*\* gunakan sebagai basis komponen yang aksesibel, kemudian atur token, varian, dan komposisinya agar sesuai design system.
- \*\*TanStack Query v5:\*\* konsistenkan state loading/error/refetch dan invalidasi cache untuk perubahan presensi, pembayaran, jadwal, atau materi.
- \*\*TanStack Table v8:\*\* gunakan untuk daftar administratif dengan sorting/filter/pagination yang sesuai; pilih server-side pagination untuk daftar besar sebagaimana disebut di PRD.
- \*\*Supabase Auth/PostgreSQL/Storage/Realtime:\*\* UI menampilkan hasil sesuai hak akses, sedangkan otorisasi, RLS, validasi data, dan akses berkas tetap dipastikan di layer backend/database.

### 18.1 Aturan implementasi tema

- Simpan token warna/typography/spacing di lokasi tema bersama (\`:root\` pada \`styles.css\`).
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

- \[ \] Semua halaman memakai token yang sama untuk warna (\`#EEEEEE\`, \`#000000\`, \`#CB2957\`) dan tipografi (\`Archivo\` + \`Instrument Sans\`).
- \[ \] Warna aksen \`#CB2957\` digunakan hemat (CTA, 1 kata headline, angka langkah, garis bawah hover) dan tidak menurunkan kontras.
- \[ \] Tombol/badge berlatar \`#CB2957\` selalu memakai teks putih \`#FFFFFF\` (5.3:1), bukan hitam.
- \[ \] Landing page memakai sudut tajam (\`2–4px\`), garis hitam (\`1–2px\`), tanpa shadow; dashboard mempertahankan radius nyaman (\`6–14px\`).
- \[ \] Ikon di landing page dibatasi hanya pada panah CTA, chevron FAQ, dan tombol menu/tutup mobile.

### Kesesuaian arah halaman publik

- \[ \] Hero tipografi penuh dengan 1 kata aksen merah dan strip 3 fakta nyata di bawahnya (tanpa mockup aplikasi generik).
- \[ \] Daftar program berupa baris bernomor \`01–04\`; hanya baris UTBK yang menggunakan blok latar hitam penuh.
- \[ \] Blok "Untuk Orang Tua" menampilkan contoh pesan kehadiran WhatsApp dan 4 poin manfaat dalam bahasa sehari-hari.
- \[ \] Bagian "Cara Daftar" terdiri dari 3 langkah teks dengan nomor besar merah tanpa kartu/ikon.
- \[ \] Seluruh copy halaman publik bebas dari istilah teknis internal (seperti kode fitur, nama database, atau istilah aksesibilitas).
- \[ \] Blok CTA dan footer menyatu dalam permukaan hitam penuh di bagian akhir halaman.

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

Gunakan arah **poster kontras tinggi** pada halaman publik: kanvas terang \`#EEEEEE\`, teks dan garis struktur hitam \`#000000\`, serta aksen merah \`#CB2957\` yang terukur; dipadukan dengan tipografi \`Archivo\` (condensed display) dan \`Instrument Sans\` (body), sudut tajam tanpa shadow, serta bahasa sehari-hari yang langsung berbicara kepada orang tua dan siswa. Setelah login, dashboard mewarisi palet warna dan pasangan font yang sama dari \`:root\`, namun mempertahankan radius yang nyaman dan permukaan kartu bersih demi kemudahan membaca tabel, form, dan tugas operasional keempat peran.