# AGENTS.md — Panduan & Aturan Pengembangan Proyek

Dokumen ini adalah **aturan utama (Rules of Engagement)** untuk setiap agen AI dan pengembang yang bekerja pada repositori ini. Semua instruksi di bawah ini bersifat **wajib dipatuhi**.

---

## 1. Profil Proyek & Peran Pengguna

Sistem Informasi Bimbingan Belajar (Bimbel) Berbasis Web untuk Kota Palu (**Tadulako Cendekia**). Platform terpadu (*single-tenant*) untuk mengelola siklus operasional: pendaftaran mandiri, penjadwalan kelas anti-bentrok, presensi digital, distribusi materi, rapor progres, dan verifikasi pembayaran SPP.

Terdapat 4 peran pengguna terisolasi (**Role-Based Access Control / RBAC**):
1. **Admin**: Pengelola tata usaha, verifikasi pendaftaran & pembayaran, manajemen jadwal bimbingan anti-bentrok, master data.
2. **Tutor (Pengajar)**: Jadwal mengajar, checklist presensi harian, upload modul/tugas, input nilai & catatan evaluasi.
3. **Siswa**: Jadwal belajar, unduh materi, pantau riwayat kehadiran & nilai, status tagihan les.
4. **Orang Tua**: Multi-child switcher, pantau kehadiran anak real-time, akses rapor & evaluasi tutor, unggah bukti bayar SPP & unduh kwitansi.

---

## 2. Pilar Single Source of Truth (SSOT)

Dilarang mengasumsikan atau mengarang alur bisnis maupun gaya desain di luar dua dokumen acuan ini:

1. **Kebutuhan Fitur & Logika Bisnis → [PRD.md](file:///home/mint/orca/workspaces/bimbel/limpet/PRD.md)**
   - Setiap kode fitur, relasi data, hak akses role, serta alur sistem (seperti deteksi bentrok jadwal pada modul `SCHED-02` dan status presensi `Hadir`/`Sakit`/`Izin`/`Alpa` pada modul `ATTEND-01`) wajib mematuhi [PRD.md](file:///home/mint/orca/workspaces/bimbel/limpet/PRD.md).

2. **Gaya Visual & Spesifikasi UI/UX → [DESIGN.md](file:///home/mint/orca/workspaces/bimbel/limpet/DESIGN.md)**
   - Wajib mengikuti arah visual **Poster Kontras Tinggi**:
     - Warna primer: Hitam (`#000000`), Merah Kirmizi aksen (`#CB2957`), Kanvas abu-abu dingin (`#EEEEEE`), serta status semantik yang terstandarisasi.
     - Tipografi: **Archivo** (Heading / Display) dan **Instrument Sans** (Body text, Form, Data Table).
     - Aturan dua kepadatan:
       - **Halaman Publik**: Tajam (radius `2–4px`), garis tegas (`1–2px`), tanpa shadow mengambang.
       - **Dashboard Aplikasi**: Nyaman untuk produktivitas (radius `6–14px`), kartu putih (`#FFFFFF`), tata letak tabel yang padat dan informatif.

---

## 3. Tech Stack & Arsitektur Rendering

### 3.1 React 19 & React Compiler
- **React Compiler Aktif**: Proyek dikonfigurasi dengan `babel-plugin-react-compiler`.
- **Aturan Penulisan Kode**: 
  - **Dilarang** menulis `useMemo`, `useCallback`, atau `React.memo` manual secara berlebihan. Biarkan compiler melakukan auto-memoization.
  - Wajib mematuhi **Rules of React**: fungsi render harus murni (*pure/idempotent*), jangan pernah memutasi state/props secara langsung.

### 3.2 Strategi Rendering (SSR vs CSR) dengan TanStack Start
- **Landing Page & Halaman Publik (`/`, `/program`, `/faq`) → Wajib SSR (Server-Side Rendering)**:
  - *Analogi:* Seperti brosur di etalase toko yang harus langsung tercetak rapi agar cepat dibaca calon siswa/orang tua dan terbaca oleh mesin pencari (SEO).
- **Dashboard & Panel Portal (`/admin/*`, `/tutor/*`, `/student/*`, `/parent/*`) → Wajib CSR (Client-Side Rendering)**:
  - *Analogi:* Seperti meja kerja staf yang hanya dibuka di dalam browser setelah membawa kunci login.
  - Implementasi: Atur `ssr: false` pada definisi route TanStack Start untuk rute-rute dashboard terproteksi guna memaksimalkan performa interaktif tanpa beban server render data privat.

### 3.3 State Management & Data Presentation
- **TanStack Query (v5)**: Digunakan untuk seluruh server-state data fetching, caching, optimasi mutasi, dan revalidasi instan.
- **TanStack Table (v8)**: Digunakan untuk seluruh tabel operasional (daftar siswa, jadwal bimbingan, rekap presensi, nilai rapor, riwayat transaksi SPP) dengan fitur sorting, filtering multi-kolom, dan paginasi.

### 3.4 Komponen Antarmuka: Base UI + Pola shadcn + Tailwind CSS
- **Headless Core**: Gunakan **Base UI** (`@base-ui/react`) dari tim MUI/Radix untuk komponen interaktif dan aksesibilitas (Dialog, Popover, Menu, Select, Tabs, Accordion, Tooltip).
- **Pola shadcn**: Letakkan komponen pada `src/components/ui/*` menggunakan fungsi pembantu `cn()` (`clsx` + `tailwind-merge`).
- **Styling**: Tailwind CSS v4 dengan token variabel yang merujuk pada [DESIGN.md](file:///home/mint/orca/workspaces/bimbel/limpet/DESIGN.md).

---

## 4. Database & ORM (Drizzle ORM + Supabase)

1. **ORM**: **Drizzle ORM** (`drizzle-orm` dan `drizzle-kit`).
   - Seluruh skema tabel PostgreSQL didefinisikan secara type-safe di `src/db/schema/`.
2. **Provider Database**: **Supabase (PostgreSQL)**.
   - Koneksi database menggunakan driver `postgres` (`postgres.js`) via Connection Pooler Supabase.
3. **Ekosistem Supabase yang Digunakan**:
   - **Supabase Auth**: Autentikasi email & password terintegrasi dengan RBAC pada metadata/tabel pengguna.
   - **Supabase Storage**:
     - Bucket `receipts`: Bukti transfer pembayaran SPP dari orang tua.
     - Bucket `learning-materials`: Modul PDF, lembar tugas, materi bimbel.
     - Bucket `avatars`: Foto profil pengguna.
   - **Supabase Realtime**: Broadcast pengumuman dan in-app notification jadwal/presensi.
4. **Integritas Bisnis di Level Query**:
   - Logika anti-bentrok ruangan & tutor (`SCHED-02`) wajib divalidasi pada query Drizzle / server function sebelum jadwal baru disimpan ke database:
     $$\text{Bentrok jika: } (\text{Target}_A = \text{Target}_B) \land (\text{Hari}_A = \text{Hari}_B) \land (\text{Mulai}_A < \text{Selesai}_B) \land (\text{Selesai}_A > \text{Mulai}_B)$$

---

## 5. Direktif Penggunaan Skills & Tools

Agen AI wajib memanfaatkan skills yang terpasang sesuai spesialisasi masing-masing:

| Skill | Kapan Digunakan |
| :--- | :--- |
| **`context7-mcp`** | **Wajib dijalankan** (`resolve-library-id` dan `query-docs`) untuk mengambil dokumentasi resmi terbaru sebelum membuat konfigurasi atau menulis kode TanStack Start, Base UI (`@base-ui/react`), Drizzle ORM, atau Supabase. Jangan menebak API. |
| **`shadcn`** | Digunakan saat menambahkan, mengonfigurasi, dan menyusun komponen UI di `src/components/ui/*`. Mengatur aturan styling Tailwind semantik, struktur form (`FieldGroup` + `Field`), serta integrasi Base UI (menggunakan prop `render` untuk trigger, bukan `asChild`). |
| **`vercel-react-best-practices`** | Digunakan saat menyusun komponen React 19, mencegah re-render sia-sia, mengelola boundary client/server, dan mengoptimalkan performa bundle. |
| **`ui-ux-pro-max`** | Digunakan untuk panduan detail UX antarmuka: status loading skeleton, empty state informatif, dialog konfirmasi aksi destruktif, dan responsivitas mobile-first. |
| **`supabase` & `supabase-postgres-best-practices`** | Digunakan saat mendesain skema Drizzle, relasi foreign key, indeks performa pencarian, serta kebijakan keamanan Row Level Security (RLS). |
| **`copywriting`** | Digunakan saat merumuskan teks landing page, headline hero, petunjuk pendaftaran, dan pesan notifikasi agar bernada humanis, santun, dan bebas dari gaya bahasa generik AI (*anti-AI-slop*). |

---

## 6. Rencana Pemetaan Migrasi File Eksisting

Saat proses migrasi dari purwarupa statis ke React TanStack dilakukan, gunakan peta acuan berikut:

| File Prototipe Asal | Sasaran Migrasi di React / TanStack | Catatan Implementasi |
| :--- | :--- | :--- |
| [`index.html`](file:///home/mint/orca/workspaces/bimbel/limpet/index.html) + [`landing.css`](file:///home/mint/orca/workspaces/bimbel/limpet/landing.css) | `src/routes/index.tsx` (SSR) | Header, Hero tanpa mockup, strip 3 fakta, Program 01–04, Untuk Orang Tua, Cara Daftar, FAQ Accordion, Footer. |
| [`dashboard.html`](file:///home/mint/orca/workspaces/bimbel/limpet/dashboard.html) + [`styles.css`](file:///home/mint/orca/workspaces/bimbel/limpet/styles.css) | `src/routes/_auth/` (CSR, `ssr: false`) | Sidebar navigasi berbasis role, User profile badge, kartu KPI, layout tabular, modal popups. |
| [`script.js`](file:///home/mint/orca/workspaces/bimbel/limpet/script.js) | TanStack Router / TanStack Query hooks | Logika simulasi role, validasi jadwal bentrok, filter data, dan manajemen modal dikonversi menjadi state React & service queries yang type-safe. |

---

## 7. Standar Mutu Kode & Guardrails

1. **TypeScript Strict**: Hindari penggunaan tipe `any`. Selalu sediakan type definition untuk payload, data tabel, dan parameter rute.
2. **Modularitas Folder**:
   ```text
   src/
   ├── components/
   │   ├── ui/             # Headless Base UI wrapper bergaya shadcn (Button, Dialog, Select, Table)
   │   ├── landing/        # Komponen khusus halaman publik SSR
   │   └── dashboard/      # Komponen khusus panel operasional CSR
   ├── db/
   │   ├── schema/         # Definisi skema tabel Drizzle ORM
   │   └── index.ts        # Inisialisasi koneksi Postgres Supabase
   ├── routes/             # File-based routing TanStack Start (SSR public, CSR dashboard)
   ├── hooks/              # Custom React hooks (auth, role switcher)
   └── lib/                # Utilitas (cn, format tanggal, formatting mata uang IDR)
   ```
3. **Penyampaian Respon**: Selalu jawab dengan singkat, jelas, dan langsung ke inti permasalahan (*to the point*), serta gunakan analogi yang sederhana untuk konsep teknis yang kompleks.
4. **Perintah Verifikasi Wajib**: Sebelum menyatakan suatu tugas selesai, jalankan `npm run typecheck` (`tsc --noEmit`) dan `npm run build`. Repo belum memiliki linter; bila ditambahkan, script `lint` harus ikut dijalankan.
