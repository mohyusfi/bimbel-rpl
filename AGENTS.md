# AGENTS.md — Panduan & Aturan Pengembangan Proyek

Dokumen ini adalah **aturan utama (Rules of Engagement)** wajib untuk setiap agen AI dan pengembang.

---

## 1. Profil Proyek & Peran Pengguna (RBAC)
Sistem Informasi Bimbel Berbasis Web (**Pintar Yuk**). Platform terpadu single-tenant dengan 4 peran terisolasi:
1. **Admin**: Tata usaha, verifikasi pendaftaran & pembayaran, manajemen jadwal anti-bentrok, master data.
2. **Tutor**: Jadwal mengajar, checklist presensi harian, modul/tugas, input nilai & catatan evaluasi.
3. **Siswa**: Jadwal belajar, unduh materi, pantau kehadiran & nilai, status tagihan SPP.
4. **Orang Tua**: Multi-child switcher, pantau kehadiran real-time, akses rapor, unggah bukti bayar & unduh kwitansi.

---

## 2. Single Source of Truth (SSOT)
1. **Logika Bisnis & Fitur → [PRD.md](file:///home/mint/orca/workspaces/bimbel/limpet/PRD.md)**: Wajib patuhi alur sistem (bentrok `SCHED-02`, status presensi `Hadir`/`Sakit`/`Izin`/`Alpa` `ATTEND-01`, dll).
2. **Gaya Visual & UI/UX → [DESIGN.md](file:///home/mint/orca/workspaces/bimbel/limpet/DESIGN.md)**: Poster Kontras Tinggi:
   - Warna: Hitam (`#000000`), Merah Kirmizi (`#CB2957`), Kanvas abu-abu (`#EEEEEE`).
   - Tipografi: **Archivo** (Heading/Display) dan **Instrument Sans** (Body, Form, Table).
   - Kepadatan: Publik (tajam, radius `2–4px`, garis `1–2px`, tanpa drop-shadow); Dashboard (radius `6–14px`, kartu putih, tabel padat).

---

## 3. Tech Stack & Arsitektur Rendering
- **React 19 & Compiler**: Dilarang menulis `useMemo`, `useCallback`, `React.memo` manual berlebihan. Patuhi Rules of React.
- **Rendering TanStack Start**:
  - Halaman Publik (`/`, `/program`, `/faq`): **Wajib SSR**.
  - Dashboard (`/admin/*`, `/tutor/*`, `/student/*`, `/parent/*`): **Wajib CSR (`ssr: false`)**.
- **State & Data**: **TanStack Query (v5)** untuk server state & caching; **TanStack Table (v8)** untuk tabel data interaktif.
- **UI Components**: Base UI (`@base-ui/react`) + pola shadcn di `src/components/ui/*` via `cn()`, Tailwind CSS v4.

---

## 4. Database, ORM & Supabase
- **Drizzle ORM**: Skema type-safe di `src/db/schema/*`.
- **Database**: Supabase PostgreSQL via `postgres.js` (port pooler 6543, `prepare: false`).
- **Supabase Features**: Auth (RBAC), Storage (`receipts`, `learning-materials`, `avatars`), Realtime (broadcast).

---

## 5. Arsitektur Business Logic & Lapisan Data

### 5.1 Struktur & Pemisahan Boundary
```text
src/
├── db/
│   ├── schema/              # Definisi tabel Drizzle ORM
│   ├── index.ts             # Koneksi client Drizzle (SERVER ONLY)
│   └── seed.ts              # Seeder data master & demo ke Supabase
├── server/
│   ├── services/            # Aturan bisnis murni & kalkulasi (SERVER ONLY)
│   └── functions/           # TanStack Start createServerFn RPC endpoints (SERVER ONLY)
├── hooks/                   # Custom React hooks (useQuery / useMutation TanStack Query)
├── components/              # Komponen UI (CLIENT)
└── routes/                  # File-based routing TanStack Start
```

### 5.2 Aturan Lapisan Data
1. **Server Isolation**: `src/db/` dan `src/server/` bersifat **SERVER-ONLY**. Dilarang di-import langsung oleh file komponen UI atau rute client. Akses data UI wajib via Server Functions (`src/server/functions/*`).
2. **Input Validation**: Wajib gunakan `zod` pada `.validator()` di setiap `createServerFn`.
3. **Format Standar Response (Result Pattern)**:
   ```ts
   export type ServerResult<T> =
     | { success: true; data: T }
     | { success: false; error: string; code?: string }
   ```
4. **Transaksi Multi-Tabel**: Operasi mutasi lintas tabel wajib dibungkus dalam `db.transaction()`. Rollback otomatis jika ada langkah gagal.
5. **Validasi Server-Side Kritis**:
   - Anti-bentrok jadwal (`SCHED-02`): Wajib divalidasi pada service layer sebelum insert/update jadwal.
     $$\text{Bentrok jika: } (\text{Target}_A = \text{Target}_B) \land (\text{Hari}_A = \text{Hari}_B) \land (\text{Mulai}_A < \text{Selesai}_B) \land (\text{Selesai}_A > \text{Mulai}_B)$$
   - Kapasitas rombel kelas: Maksimal 10–12 siswa. Wajib divalidasi sebelum penetapan siswa ke kelas.

---

## 6. Standar Mutu Kode & UI Guardrails
1. **TypeScript Strict**: Dilarang menggunakan `any`. Selalu definisikan tipe data eksplisit.
2. **Verifikasi Wajib**: Jalankan `npm run typecheck` (`tsc --noEmit`) dan `npm run build` sebelum tugas selesai.
3. **Copywriting & Anti-Slop**:
   - Label "Kota Palu" hanya untuk landing page publik dan dokumen resmi. Dilarang di dashboard.
   - Dilarang menampilkan kode PRD internal (seperti `(BILL-01)`, `(SCHED-02)`) di antarmuka pengguna.
4. **Status Indicator (Zero Border/Background)**:
   - Status wajib berupa **inline text semantik** (`font-medium text-xs`) + icon SVG resmi Lucide (`Clock`, `AlertCircle`, `CheckCircle2`, `XCircle`).
   - Dilarang membungkus status dengan background, border, atau badge tombol palsu.
   - Dilarang memakai unicode mentah (`✓`, `✗`, `•`, `↗`) atau bare naked dots.
5. **Zero Fake Buttons**: Teks statis non-klik (nomor invoice, NIS, ID) tidak boleh diberi border/background yang menyerupai tombol. Gunakan monospace netral (`font-mono text-xs text-[#555555]`).
6. **KPI Card Footers**: Gunakan tipografi netral seragam (`font-medium text-[#292524]` dan `text-[11px] text-[#555555]`).
7. **Zero Emojis in Code & Messages (Aturan Bebas Emoji)**:
   - Dilarang keras menggunakan karakter emoji (seperti `⚠️`, `❌`, `✅`, `🧹`, `🎉`, dll.) pada kode program, pesan log (`console.log`, `console.warn`, `console.error`), pesan error API, notifikasi sistem, maupun teks antarmuka pengguna (UI).
   - Gunakan tag penanda teks profesional berstandar industri:
     - Peringatan: `[WARN]` (misal: `console.warn('[WARN] Gagal mengambil...')`)
     - Kesalahan/Error: `[ERROR]` (misal: `console.error('[ERROR] Gagal login...')`)
     - Sukses/Konfirmasi: `[OK]` atau `[INFO]`
     - Operasi Seeder/Migrasi: `[SEED]` atau `[CLEANUP]`
   - Pada komponen antarmuka pengguna (UI), gunakan selalu ikon SVG resmi dari pustaka Lucide React (`AlertCircle`, `CheckCircle2`, `XCircle`, `Clock`, dll.).
8. **Pembersihan Data Pengujian Wajib (Zero Stale Test Data)**:
   - Setiap pengujian, baik End-to-End (Playwright) maupun Unit/Integration Test (Vitest), yang membuat atau memanipulasi data uji sementara (akun auth, profil, registrasi, transaksi) di database Supabase maupun memori lokal **WAJIB menghapus tuntas (cleanup/delete)** data tersebut pada hook `afterAll` atau `afterEach`.
   - Dilarang keras meninggalkan baris data uji sisa di database development, staging, maupun produksi yang dapat mengotori data operasional pengguna asli.
   - Dilarang menyematkan array data mock statis di dalam kode aplikasi runtime. Seluruh data operasional wajib bersumber murni dari Supabase Database sebagai Single Source of Truth (SSOT).

---

## 7. Issue Tracker & Manajemen Tugas
- Issue dilacak via GitHub CLI `gh` di repositori `mohyusfi/bimbel-rpl`.
- Kerjakan tiket satu per satu secara berurutan:
  - **Tiket 01 (#4)**: Database Seeding & Persistensi Master Data
  - **Tiket 02 (#5)**: Pendaftaran Siswa & Rombel Kelas
  - **Tiket 03 (#6)**: Penjadwalan Bimbingan Anti-Bentrok
  - **Tiket 04 (#7)**: Presensi Sesi Digital
  - **Tiket 05 (#8)**: Distribusi Modul & Input Nilai
  - **Tiket 06 (#9)**: Tagihan SPP & Verifikasi Pembayaran
  - **Tiket 07 (#10)**: Autentikasi Pengguna & RBAC
