# DESIGN_LOGIN.md — Spesifikasi UI/UX & Implementasi Halaman Login (`/login`)

> **Project profile:** Sistem Informasi Bimbingan Belajar Berbasis Web (Tadulako Cendekia)  
> **Parent specification:** `DESIGN.md` v2.0 (Poster Kontras Tinggi)  
> **Layout reference:** Split-Panel Card dengan Top-Left Cutout Notch & Editorial Visual  
> **Primary language:** Bahasa Indonesia  
> **Target consumer:** AI Coding Agent & Frontend Engineer

---

## 1. Tujuan & Konteks Halaman

Halaman `/login` adalah pintu masuk utama menuju area operasional aplikasi setelah halaman publik (`index.html`). Desain halaman ini mengadaptasi komposisi **Split-Screen Showcase** dari referensi visual (kolom formulir di kiri, panel visual berlekuk dengan tombol kembali bulat di kanan), namun diterjemahkan secara ketat ke dalam identitas **Poster Kontras Tinggi** (`#EEEEEE`, `#000000`, `#CB2957`, `#FFFFFF`).

Prinsip utama yang wajib dipatuhi oleh *agent*:
1. **Satu Sumber Kebenaran Palet:** Dilarang menggunakan warna ungu/lavender atau efek *blur glassmorphism* pastel dari gambar referensi. Seluruh warna wajib memakai token `:root` dari `DESIGN.md`.
2. **Bebas Slop & Emote Kasar:** Gunakan ikon resmi `lucide-react` (`ArrowLeft`, `Eye`, `EyeOff`, `AlertCircle`, `Loader2`). Dilarang menggunakan panah karakter unicode mentah (`←`, `→`, `✓`, `✕`).
3. **Pengalihan Berbasis Peran (Role-Aware Redirect):** Autentikasi tunggal yang mengarahkan pengguna secara otomatis ke `/admin`, `/tutor`, `/student`, atau `/parent` berdasarkan profil akun.

---

## 2. Sistem Warna & Pemetaan Token (High-Contrast Poster)

Setiap elemen pada layout referensi dipetakan ulang ke palet warna proyek sebagai berikut:

| Elemen pada Referensi | Token CSS (`DESIGN.md`) | Nilai Hex | Aturan Implementasi |
|---|---|---|---|
| Latar Belakang Luar (Outer Canvas) | `--background` | `#EEEEEE` | Kanvas dasar seluruh viewport (`min-h-screen bg-[#EEEEEE]`). |
| Kontainer Utama (Main Card) | `--surface` | `#FFFFFF` | Permukaan putih bersih dengan garis batas tegas `2px solid #000000`. |
| Garis Struktur & Heading | `--foreground` | `#000000` | Tipografi judul, border kontainer, border kartu visual, dan elemen kontras tinggi. |
| Tombol Tindakan Primer (CTA Login) | `--accent` | `#CB2957` | Tombol utama **Masuk** menggunakan Merah Kirmizi (`#CB2957`) dengan teks putih `#FFFFFF` (`--accent-on`). |
| Tombol Kembali Bulat (di Notch) | `--primary` / `--surface` | `#000000` / `#EEEEEE` | Lingkaran di sudut kiri atas panel visual: latar `#EEEEEE` dengan border `2px solid #000000` (hover: latar `#CB2957`, teks `#FFFFFF`). |
| Label Form & Teks Konten | — | `#292524` | Warna label input (`Email`, `Kata Sandi`) dan teks isi input yang sedang diketik. |
| Teks Sekunder & Metadata | `--muted-foreground` | `#555555` | Subjudul pengantar, pemisah *"Atau"*, catatan ketentuan layanan di kaki form, dan placeholder. |
| Tautan Interaktif (`Daftar`, `Lupa Sandi`) | `--accent-text` | `#A81E46` | Teks kecil beraksen di atas latar terang (rasio kontras 5.9:1 lolos WCAG AA), bergaris bawah `#CB2957` saat hover. |
| Border Input Form | `--border-input` | `#6B6B6B` | Garis tepi input default `1.5px solid #6B6B6B`; berubah menjadi `2px solid #000000` + ring `#CB2957` saat fokus. |
| Panel Kutipan Bawah (di atas Foto) | `--primary` | `#000000` | Menggantikan *frosted glass* referensi menjadi blok hitam pekat `#000000` bergaya poster dengan aksen garis kiri `4px solid #CB2957` dan teks `#EEEEEE`. |
| Pesan Kesalahan (Error State) | `--destructive` | `#A1301C` | Teks dan border kesalahan validasi/autentikasi (merah bata, dibedakan dari merah brand `#CB2957`). |

---

## 3. Tipografi

Mengikuti pasangan font wajib dari `DESIGN.md`:

- **Heading & Brand (`--font-display` — `Archivo`):**
  - **Identitas Brand:** `Tadulako Cendekia` (`Archivo`, `font-stretch: 75%`, `Tadulako` weight `800`, `Cendekia` weight `500`, warna `#000000`, dengan titik atau penanda kecil `#CB2957`).
  - **Judul Halaman (`Selamat Datang Kembali`):** `Archivo`, ukuran `clamp(1.75rem, 2.8vw, 2.25rem)`, `line-height: 1.1`, `font-weight: 800`, `letter-spacing: -0.02em`, warna `#000000`.
- **Body, Form, & UI (`--font-sans` — `Instrument Sans`):**
  - **Subjudul:** `0.9375rem` (15px), `line-height: 1.5`, warna `#555555`.
  - **Label Form:** `0.875rem` (14px), `font-weight: 600`, warna `#292524`.
  - **Input Text:** `0.9375rem` (15px), `font-weight: 400`, warna `#292524` (placeholder `#555555`).
  - **Tombol CTA:** `0.9375rem` (15px), `font-weight: 600`, warna `#FFFFFF`.
  - **Catatan Kaki / Legal:** `0.75rem` (12px), `line-height: 1.4`, warna `#555555`.

---

## 4. Arsitektur Layout & Wireframe

### 4.1 Struktur Desktop (`>= 1024px`)

Halaman menempatkan satu kontainer kartu besar (`max-w-[1080px] w-full bg-[#FFFFFF] border-2 border-[#000000]`) di tengah kanvas `#EEEEEE`. Di dalamnya terdapat grid 2 kolom (`grid-cols-12`):

- **Kolom Kiri (5 atau 6 kolom):** Area formulir autentikasi, terpusat secara vertikal dan horizontal dengan lebar isi form maksimum `380px`.
- **Kolom Kanan (6 atau 7 kolom):** Panel poster visual berbingkai dengan lekukan sudut kiri atas (*top-left cutout notch*) tempat tombol bulat kembali ke beranda (`/`), foto editorial kegiatan belajar/siswa, dan kartu informasi hitam pekat di bagian bawah.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ KANVAS LUAR (#EEEEEE)                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ KONTAINER UTAMA (#FFFFFF, Border 2px #000000, Radius 14px)             │  │
│  │                                                                        │  │
│  │                                      ╭─────╮  ┌─────────────────────┐  │  │
│  │          Tadulako Cendekia           │  ←  │  │ PANEL VISUAL POSTER │  │  │
│  │       Selamat Datang Kembali         ╰─────╯  │                     │  │  │
│  │   Masuk untuk memantau jadwal,      ┌─────────┘                     │  │  │
│  │    presensi, dan progres belajar.   │                               │  │  │
│  │                                     │   [Foto Editorial Kontras     │  │  │
│  │   Email                             │    Tinggi / Suasana Belajar]  │  │  │
│  │   ┌─────────────────────────────┐   │                               │  │  │
│  │   │ nama@email.com              │   │                               │  │  │
│  │   └─────────────────────────────┘   │                               │  │  │
│  │   Kata Sandi         Lupa sandi?    │                               │  │  │
│  │   ┌─────────────────────────────┐   │                               │  │  │
│  │   │ ••••••••••••            [👁] │   │                               │  │  │
│  │   └─────────────────────────────┘   │  ┌─────────────────────────┐  │  │  │
│  │                                     │  │ █ BLOK INFO (#000000) █ │  │  │  │
│  │   ┌─────────────────────────────┐   │  │ "Jadwal pasti, presensi │  │  │  │
│  │   │      Masuk ke Akun  (#CB2957)│   │  │  transparan, dan rapor  │  │  │  │
│  │   └─────────────────────────────┘   │  │  terpantau setiap sesi."│  │  │  │
│  │                                     │  │                         │  │  │  │
│  │   ───────────  Atau  ───────────    │  │ — Portal Terpadu        │  │  │  │
│  │                                     │  │   Siswa, Ortu & Tutor   │  │  │  │
│  │   [ Simulasi Role / Masuk Cepat ]   │  └─────────────────────────┘  │  │  │
│  │                                     └───────────────────────────────┘  │  │
│  │   Belum terdaftar sebagai siswa?                                       │  │
│  │   Daftar program sekarang                                              │  │
│  │                                                                        │  │
│  │   Dengan masuk, Anda menyetujui                                        │  │
│  │   Ketentuan Layanan & Privasi Data.                                    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Perilaku Responsif (`< 1024px`)

| Breakpoint | Perilaku Layout |
|---|---|
| **Desktop (`>= 1024px`)** | Grid 2 kolom penuh. Panel visual kanan tampil lengkap bersama *top-left cutout notch* dan tombol kembali bulat `56×56px`. |
| **Tablet (`768px – 1023px`)** | Kontainer menyempit (`max-w-[520px]`), berubah menjadi **1 kolom**. Panel visual kanan disembunyikan atau diringkas menjadi banner pendek di bawah form. Tombol kembali (`Kembali ke beranda`) ditampilkan sebagai baris navigasi di bagian paling atas kartu form. |
| **Mobile (`< 768px`)** | Satu kolom penuh dengan padding luar `16px`. Kontainer utama memakai `bg-[#FFFFFF] border-2 border-[#000000] rounded-[10px] p-6`. Semua input dan tombol memiliki tinggi minimal `44px` (*touch-friendly*). |

---

## 5. Spesifikasi Detail Komponen

### 5.1 Kolom Kiri: Area Formulir Login

1. **Header Form:**
   - **Wordmark:** Teks `Tadulako Cendekia` di bagian atas tengah (`text-center`), tanpa ikon dekoratif generik/logo tumpukan warna-warni dari gambar referensi. Boleh menambahkan lencana garis kecil di atasnya atau titik aksen `#CB2957`.
   - **Judul Utama (`<h1>`):** `Selamat Datang Kembali` (`Archivo`, `font-extrabold`, `#000000`).
   - **Deskripsi Pendukung:** `Masuk ke portal akademik sesuai peran akun Anda.` (`Instrument Sans`, `text-sm`, `#555555`).

2. **Field Input (`Email` & `Kata Sandi`):**
   - **Label:** Wajib terlihat permanen di atas input (`text-[#292524] font-semibold text-sm mb-1.5 block`). Jangan pernah mengandalkan placeholder sebagai satu-satunya label.
   - **Input Box:**
     - Latar: `#FFFFFF`
     - Tinggi: `44px` (`h-11`)
     - Radius: `8px` (`rounded-[8px]`)
     - Border default: `1.5px solid #6B6B6B`
     - Hover state: `border-[#000000]`
     - Focus state: `outline-none border-[#000000] ring-2 ring-[#CB2957] ring-offset-1`
     - Error state: `border-[#A1301C] ring-1 ring-[#A1301C]` disertai teks pesan di bawah input dengan ikon `AlertCircle` (`14px`, `#A1301C`).
   - **Toggle Kata Sandi:** Tombol ikon di sisi kanan dalam input password menggunakan `Eye` / `EyeOff` dari Lucide (`text-[#555555] hover:text-[#000000]`), wajib memiliki `aria-label="Tampilkan kata sandi"` atau `"Sembunyikan kata sandi"`.
   - **Tautan Lupa Kata Sandi:** Diletakkan sejajar di sebelah kanan label `Kata Sandi` (`text-xs font-semibold text-[#A81E46] hover:text-[#CB2957] hover:underline`).

3. **Tombol Utama Submit (`Masuk`):**
   - Menggunakan warna aksen utama proyek: **Merah Kirmizi (`#CB2957`)** dengan teks **Putih Bersih (`#FFFFFF`)**.
   - Tinggi `44px` (`h-11`), lebar penuh (`w-full`), radius `8px` (`rounded-[8px]`), border `2px solid #000000` (untuk menjaga ketegasan garis poster kontras tinggi).
   - Hover state: latar sedikit lebih gelap (`bg-[#A81E46]`) dengan transisi halus `150ms`.
   - Active / Loading state: tombol dinonaktifkan (`disabled:opacity-70`), menampilkan spinner `Loader2` (`animate-spin`) di samping teks `Memverifikasi...`.

4. **Pemisah Sekunder (`Atau`) & Aksi Alternatif:**
   - Garis horizontal tipis `1px solid #D2D2D2` dengan teks tengah `Atau` (`text-xs font-medium text-[#555555] bg-[#FFFFFF] px-3`).
   - **Konteks Bimbel:** Menggantikan tombol Apple/X/Google generik dari gambar referensi dengan salah satu dari dua opsi sesuai mode lingkungan:
     - **Mode Produksi (Supabase Auth):** Tombol `Masuk dengan Google` berbingkai `1.5px solid #000000`, latar `#FFFFFF`, hover `bg-[#EEEEEE]`, teks `#292524 font-semibold`.
     - **Mode Demo / Evaluasi Role (Bila fitur Quick Demo aktif):** 4 tombol pilihan cepat (`Admin`, `Tutor`, `Siswa`, `Orang Tua`) dalam grid 4 kolom atau 2×2 untuk mengisi kredensial uji coba secara instan, menggunakan `bg-[#FFFFFF] border border-[#000000] text-xs font-semibold text-[#292524] hover:bg-[#EEEEEE]`.

5. **Navigasi Pendaftaran & Catatan Kaki:**
   - Teks ajakan daftar: `Belum terdaftar sebagai siswa?` (`text-sm text-[#555555]`) diikuti tautan `Daftar program sekarang` (`font-bold text-[#000000] underline decoration-[#CB2957] decoration-2 underline-offset-4 hover:text-[#CB2957]`) yang mengarah ke `/daftar` atau membuka formulir registrasi calon siswa.
   - Footer form di bagian paling bawah: `Dengan masuk ke sistem, Anda menyetujui Ketentuan Penggunaan & Kebijakan Privasi Tadulako Cendekia.` (`text-xs text-[#555555] text-center`).

---

### 5.2 Kolom Kanan: Panel Visual dengan Top-Left Cutout Notch

Bagian ini mereplikasi geometri unik pada gambar referensi (lekukan sudut kiri atas tempat tombol kembali berada), namun dengan estetika **Poster Kontras Tinggi**:

1. **Teknik Pembuatan Top-Left Cutout Notch:**
   - Panel kanan menggunakan kontainer relatif (`relative h-full min-h-[580px] rounded-[16px] overflow-hidden border-2 border-[#000000] bg-[#000000]`).
   - Di sudut kiri atas (`top-0 left-0`), terdapat area *cutout* berbentuk kotak `w-[84px] h-[84px] bg-[#FFFFFF] rounded-br-[28px] z-20 flex items-start justify-start p-1.5` yang menyatu dengan warna permukaan kartu utama (`#FFFFFF`), dilengkapi pseudo-element atau border yang menjaga keutuhan garis.
   - Di dalam *cutout* tersebut, ditempatkan **Tombol Bulat Kembali ke Beranda (`/`):**
     - Ukuran: `56px × 56px` (`w-14 h-14 rounded-full`).
     - Warna default: Latar `#EEEEEE`, teks/ikon `#000000`, border `2px solid #000000`.
     - Warna hover: Latar `#CB2957`, teks/ikon `#FFFFFF`, border `2px solid #000000`.
     - Ikon: `<ArrowLeft className="w-5 h-5" />` dari Lucide.
     - Aksesibilitas: Wajib menyertakan `aria-label="Kembali ke halaman utama"` dan `title="Kembali ke beranda"`.

2. **Visual Utama (Gambar / Poster):**
   - Menggunakan foto kegiatan belajar tatap muka atau potret siswa/tutor dengan kontras tinggi (`object-cover w-full h-full`).
   - Agar selaras dengan palet `#000000` / `#CB2957` / `#EEEEEE`, berikan perlakuan filter halus (`grayscale-[20%] contrast-[1.08]`) dan lapisan gradasi gelap tipis di bagian bawah (`bg-gradient-to-t from-black/80 via-black/20 to-transparent`) supaya kartu kutipan di bawah memiliki pemisahan visual yang tegas.

3. **Kartu Informasi / Kutipan Bawah (High-Contrast Editorial Box):**
   - Menggantikan kartu transparan *glassmorphism* pada referensi menjadi **Blok Hitam Pekat (`#000000`)** yang sesuai dengan aturan `DESIGN.md` (menghindari efek kaca/blur).
   - Posisi: Melayang di bagian bawah panel kanan (`absolute bottom-5 left-5 right-5 z-20`).
   - Styling: `bg-[#000000] text-[#EEEEEE] border-2 border-[#000000] border-l-4 border-l-[#CB2957] rounded-[10px] p-5`.
   - Konten:
     - **Pernyataan Nilai Utama:** *"Kehadiran tercatat setiap sesi, jadwal bebas bentrok, dan perkembangan nilai terpantau langsung oleh orang tua maupun siswa."* (`Instrument Sans`, `text-sm leading-relaxed text-[#EEEEEE]`).
     - **Atribusi / Metadata:** Baris di bawahnya memuat judul kecil `Sistem Informasi Akademik Terpadu` (`Archivo`, `font-bold text-xs text-[#FFFFFF] mt-3`) dan keterangan `Admin · Tutor · Siswa · Orang Tua` (`font-mono text-[11px] text-[#A3A3A3]`).

---

## 6. Alur Interaksi, Validasi & Penanganan Error

1. **Validasi Input Sebelum Submit:**
   - Jika email kosong atau format tidak valid: tampilkan pesan inline di bawah field email: `Masukkan alamat email yang valid (contoh: budi@email.com).`
   - Jika kata sandi kosong: tampilkan pesan inline di bawah field kata sandi: `Kata sandi wajib diisi.`
2. **Keamanan Pesan Kegagalan Autentikasi:**
   - Sesuai `DESIGN.md` Bagian 10.2, jangan membocorkan apakah suatu email terdaftar atau tidak.
   - Jika kredensial salah, tampilkan banner peringatan inline di atas tombol submit (`bg-[#FBEAEF] border-l-4 border-[#A1301C] p-3 text-xs font-medium text-[#7A1534]` dengan ikon `AlertCircle`):
     `Email atau kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali.`
   - Pertahankan nilai email yang sudah diketik pengguna agar tidak perlu mengetik ulang dari awal.
3. **Pengalihan Role (Post-Login Redirect):**
   - `admin` $\rightarrow$ `/admin`
   - `tutor` $\rightarrow$ `/tutor`
   - `student` $\rightarrow$ `/student`
   - `parent` $\rightarrow$ `/parent`
   - Jika terdapat query parameter tujuan awal yang aman (misal `?redirect=/student/tagihan`), arahkan pengguna ke rute tersebut selama sesuai dengan hak akses role-nya.
4. **Status Menunggu Verifikasi (Edge Case Calon Siswa Baru):**
   - Jika akun siswa baru mendaftar dan belum diverifikasi oleh Admin, tampilkan informasi status yang ramah (menggunakan ikon `Clock` warna `#85600F`):
     `Pendaftaran Anda sedang menunggu verifikasi Admin. Kami akan mengirimkan kabar melalui WhatsApp setelah akun aktif.`

---

## 7. Blueprint Referensi Komponen (React + Tailwind CSS + Lucide)

*Agent* dapat menjadikan struktur JSX berikut sebagai acuan implementasi langsung yang mematuhi seluruh aturan warna dan geometri:

```tsx
import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <main className="min-h-screen w-full bg-[#EEEEEE] text-[#000000] flex items-center justify-center p-4 md:p-8 font-sans">
      {/* Kontainer Utama Kartu Split */}
      <div className="w-full max-w-[1060px] bg-[#FFFFFF] border-2 border-[#000000] rounded-[14px] p-6 sm:p-8 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Navigasi Kembali khusus Mobile/Tablet (< 1024px) */}
        <div className="lg:hidden flex items-center justify-between pb-2 border-b border-[#D2D2D2]">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#292524] hover:text-[#CB2957] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke beranda</span>
          </a>
        </div>

        {/* KOLOM KIRI: Area Form Login (5 Kolom di Desktop) */}
        <section className="lg:col-span-5 flex flex-col justify-between py-2 sm:py-6 px-1 sm:px-4">
          <div className="w-full max-w-[360px] mx-auto my-auto">
            {/* Identitas Brand & Judul */}
            <div className="text-center mb-8">
              <a
                href="/"
                className="inline-block font-display text-lg tracking-tight text-[#000000] mb-3"
              >
                <span className="font-extrabold">Tadulako</span>{" "}
                <span className="font-medium">Cendekia</span>
                <span className="text-[#CB2957] font-extrabold">.</span>
              </a>
              <h1 className="font-display text-3xl sm:text-[34px] font-extrabold tracking-tight text-[#000000] leading-[1.08]">
                Selamat Datang Kembali!
              </h1>
              <p className="mt-2 text-sm text-[#555555]">
                Masuk untuk mengakses jadwal, presensi, dan evaluasi belajar.
              </p>
            </div>

            {/* Banner Error (bila ada) */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 bg-[#FBEAEF] border-l-4 border-[#A1301C] p-3 rounded-[6px] text-xs font-medium text-[#7A1534]"
              >
                <AlertCircle className="w-4 h-4 text-[#A1301C] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Formulir Autentikasi */}
            <form className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-[#292524] mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Masukkan alamat email Anda"
                  className="w-full h-11 px-3.5 bg-[#FFFFFF] text-[#292524] placeholder:text-[#555555] text-sm rounded-[8px] border-[1.5px] border-[#6B6B6B] hover:border-[#000000] focus:outline-none focus:border-[#000000] focus:ring-2 focus:ring-[#CB2957] transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-[#292524]"
                  >
                    Kata Sandi
                  </label>
                  <a
                    href="/lupa-sandi"
                    className="text-xs font-semibold text-[#A81E46] hover:text-[#CB2957] hover:underline"
                  >
                    Lupa kata sandi?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Masukkan kata sandi"
                    className="w-full h-11 pl-3.5 pr-11 bg-[#FFFFFF] text-[#292524] placeholder:text-[#555555] text-sm rounded-[8px] border-[1.5px] border-[#6B6B6B] hover:border-[#000000] focus:outline-none focus:border-[#000000] focus:ring-2 focus:ring-[#CB2957] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center text-[#555555] hover:text-[#000000] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#CB2957]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tombol CTA Primer (#CB2957) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#CB2957] hover:bg-[#A81E46] text-[#FFFFFF] font-semibold text-sm rounded-[8px] border-2 border-[#000000] inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957] focus:ring-offset-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>Masuk</span>
                  )}
                </button>
              </div>
            </form>

            {/* Pemisah Sekunder */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-[#D2D2D2]" />
              <span className="bg-[#FFFFFF] px-3 text-xs font-medium text-[#555555] absolute">
                Atau masuk cepat (Demo Role)
              </span>
            </div>

            {/* Pemilih Role Cepat / Alternatif Login */}
            <div className="grid grid-cols-4 gap-2">
              {["Admin", "Tutor", "Siswa", "Ortu"].map((role) => (
                <button
                  key={role}
                  type="button"
                  className="h-10 bg-[#FFFFFF] hover:bg-[#EEEEEE] text-[#292524] font-semibold text-xs rounded-[8px] border border-[#000000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957]"
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Tautan Daftar */}
            <p className="mt-6 text-center text-sm text-[#555555]">
              Belum punya akun siswa?{" "}
              <a
                href="/daftar"
                className="font-bold text-[#000000] underline decoration-[#CB2957] decoration-2 underline-offset-4 hover:text-[#CB2957]"
              >
                Daftar sekarang
              </a>
            </p>
          </div>

          {/* Catatan Kaki Ketentuan */}
          <p className="mt-8 text-center text-xs text-[#555555]">
            Dengan masuk, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi
            kami.
          </p>
        </section>

        {/* KOLOM KANAN: Panel Visual dengan Top-Left Cutout Notch (7 Kolom di Desktop) */}
        <aside className="hidden lg:block lg:col-span-7 relative min-h-[600px]">
          {/* Cutout Notch Sudut Kiri Atas + Tombol Bulat Kembali */}
          <div className="absolute top-0 left-0 w-[76px] h-[76px] bg-[#FFFFFF] rounded-br-[28px] z-20 flex items-start justify-start pr-3 pb-3 border-b-2 border-r-2 border-[#000000]">
            <a
              href="/"
              aria-label="Kembali ke halaman utama"
              title="Kembali ke beranda"
              className="w-14 h-14 rounded-full bg-[#EEEEEE] hover:bg-[#CB2957] text-[#000000] hover:text-[#FFFFFF] border-2 border-[#000000] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB2957]"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
          </div>

          {/* Kontainer Gambar Utama */}
          <div className="w-full h-full rounded-[16px] overflow-hidden border-2 border-[#000000] bg-[#000000] relative">
            <img
              src="/assets/login-showcase.jpg"
              alt="Suasana belajar terfokus di kelas Tadulako Cendekia"
              className="w-full h-full object-cover object-center contrast-[1.05]"
            />

            {/* Overlay Kartu Informasi Bawah (High-Contrast Poster Block) */}
            <div className="absolute bottom-5 left-5 right-5 bg-[#000000] text-[#EEEEEE] border-2 border-[#000000] border-l-4 border-l-[#CB2957] rounded-[10px] p-5">
              <p className="text-sm leading-relaxed text-[#EEEEEE]">
                &ldquo;Kelas kecil maksimal 12 siswa, jadwal bebas bentrok, serta
                laporan kehadiran dan evaluasi belajar yang selalu dapat dipantau
                langsung oleh orang tua.&rdquo;
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-xs text-[#FFFFFF] tracking-wide uppercase">
                    Tadulako Cendekia
                  </p>
                  <p className="font-mono text-[11px] text-[#A3A3A3]">
                    Portal Akademik · Admin, Tutor, Siswa & Orang Tua
                  </p>
                </div>
                <span className="font-mono text-xs text-[#CB2957] font-bold">
                  SD — UTBK
                </span>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
```

---

## 8. Checklist QA Halaman Login (Wajib Diperiksa Agent)

- [ ] **Kepatuhan Palet Warna:** Kanvas menggunakan `#EEEEEE`, kartu utama `#FFFFFF`, garis tepi `#000000`, tombol CTA utama `#CB2957` dengan teks `#FFFFFF`, label `#292524`, dan teks sekunder `#555555`.
- [ ] **Bebas Warna Referensi Asli:** Tidak ada warna ungu/lavender atau efek kaca transparan (*frosted glass*) dari gambar referensi yang terbawa ke kode.
- [ ] **Geometri Cutout Notch:** Pada layar desktop (`>= 1024px`), sudut kiri atas panel visual kanan memiliki lekukan (*notch*) yang memuat tombol kembali bulat (`ArrowLeft` dari Lucide).
- [ ] **Responsivitas Mobile:** Pada layar `< 1024px`, panel gambar kanan tidak merusak tata letak; tombol kembali berpindah menjadi navigasi bar ringkas di bagian atas form.
- [ ] **Aksesibilitas Form:** Semua input memiliki `<label htmlFor="...">` yang terlihat jelas, tombol mata password memiliki `aria-label`, dan seluruh kontrol memiliki focus ring `#CB2957`.
- [ ] **Anti-Slop & Anti-Hardcode Emote:** Tidak ada simbol unicode mentah (`←`, `👁`, `✓`, `✕`) di dalam template; semuanya menggunakan komponen resmi `lucide-react`.