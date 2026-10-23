# Spesifikasi: Persistensi Edit & Tambah Data Siswa ke Supabase serta Halaman Detail Siswa

**Issue Tracker**: [#14 (mohyusfi/bimbel-rpl#14)](https://github.com/mohyusfi/bimbel-rpl/issues/14)  
**Triage Label**: `ready-for-agent`

---

## Problem Statement

Administrator Tata Usaha saat ini mengalami kendala ketika mengelola data siswa pada Sistem Informasi Bimbel Tadulako Cendekia di direktori siswa (`/admin/siswa`):

1. **Perubahan Data Siswa Tidak Tersimpan (Mental)**: Ketika Admin menekan tombol "Detail & Edit" pada tabel siswa dan menyimpan perubahan (nama, kontak, sekolah, rombel, atau status), perubahan tersebut hanya disimpan sementara di state memori lokal peramban, bukan di database Supabase PostgreSQL. Akibatnya, saat query otomatis memuat ulang data dari database, perubahan yang baru saja disimpan langsung tertimpa kembali oleh data lama database.
2. **Ketiadaan Halaman Detail Siswa**: Tabel direktori siswa hanya memuat data ringkas (nama, NIS, sekolah, paket/rombel, kontak wali, tanggal gabung, status). Admin tidak memiliki tampilan komprehensif untuk meninjau data identitas lengkap siswa, riwayat rombel, detail wali murid, serta jadwal bimbingan yang diikuti siswa tersebut.
3. **Formulir Edit Kurang Lengkap**: Formulir modal edit siswa belum mencakup field email siswa, pekerjaan wali murid, dan alamat domisili.
4. **Penambahan Siswa Belum Terkoneksi ke Database**: Formulir "Tambah Siswa & Wali Baru" juga masih mengandalkan memori lokal peramban, sehingga siswa baru tidak tersimpan secara permanen di database.

---

## Solution

Mengembangkan modul manajemen data siswa yang 100% terkoneksi ke basis data Supabase PostgreSQL dengan arsitektur komprehensif:

1. **Layanan Pembaruan Data Siswa Terpadu**:
   - Memperbarui tabel data siswa (sekolah asal, jenjang/paket, status keaktifan, dan penempatan kelas).
   - Memperbarui profil siswa (nama lengkap, nomor telepon, dan email).
   - Memperbarui profil orang tua (pekerjaan dan alamat) serta profil wali murid (nama dan nomor telepon/WhatsApp).
   - Mengelola mutasi rombel kelas pada tabel keanggotaan kelas dengan validasi kapasitas maksimal 12 siswa per rombel. Jika rombel tujuan penuh, sistem menolak mutasi dengan pesan kesalahan yang jelas.
   - Menyinkronkan kode paket siswa secara otomatis mengikuti paket kursus rombel baru.
2. **Layanan Penambahan Siswa Baru**:
   - Mengenerate Nomor Induk Siswa (NIS) unik berurutan secara otomatis (TC-2026-XXX).
   - Menyimpan seluruh profil siswa, akun wali, data siswa, dan penetapan rombel secara atomik di basis data.
3. **Halaman Khusus Detail Siswa**:
   - Menyediakan rute detail mandiri dengan navigasi kembali ke direktori siswa (`/admin/siswa/$studentId`).
   - Menampilkan kartu ringkasan identitas lengkap siswa (NIS, Nama Lengkap, Sekolah Asal, Jenjang, Email, Telepon, Tanggal Masuk, Status).
   - Menampilkan kartu data orang tua/wali murid (Nama, Nomor WhatsApp, Pekerjaan, Alamat Domisili).
   - Menampilkan kartu akademik dan rombel belajar (Nama Rombel, Kapasitas Siswa, Tutor Pengampu).
   - Menampilkan kartu jadwal bimbingan mingguan rombel yang diikuti siswa.
   - Dilengkapi tombol aksi cepat untuk membuka dialog modal edit data.
4. **Penyempurnaan Antarmuka Tabel dan Modal Edit**:
   - Menambahkan kolom input Email Siswa, Pekerjaan Wali, dan Alamat Domisili pada modal edit.
   - Memisahkan aksi pada tabel direktori siswa menjadi dua tombol independen: "Lihat Detail" (navigasi ke halaman detail) dan "Edit" (membuka modal edit cepat).
   - Menampilkan pesan error validasi kapasitas secara inline jika rombel kelas yang dipilih telah penuh.

---

## User Stories

1. As an Admin, I want to edit a student's basic details (name, school, phone number, and email) and have those changes saved directly to Supabase, so that the academic directory reflects up-to-date student information across all devices.
2. As an Admin, I want student status updates (active or inactive) to persist immediately in the database, so that inactive students do not consume tutoring quotas or appear active in subsequent sessions.
3. As an Admin, I want to update parent/guardian contact information (name, WhatsApp number, occupation, and home address) from the student edit dialog, so that emergency contact channels remain reliable.
4. As an Admin, I want the system to validate class capacity (maximum 12 students per class) when reassigning a student to a different class group, so that classrooms never exceed pedagogical room limits.
5. As an Admin, I want an informative error message if I attempt to reassign a student to a classroom that is already full, so that I can choose another suitable class without losing the student's edited data.
6. As an Admin, I want a student's package code and grade level to automatically synchronize with their new class group's curriculum upon transfer, so that study materials and tuition rates remain aligned.
7. As an Admin, I want adding a new student through the "Tambah Siswa & Wali Baru" modal to create persistent records in Supabase, so that new enrollments are permanently stored in the system.
8. As an Admin, I want newly created students to automatically receive a formatted sequential NIS (TC-2026-XXX), so that each student has a standardized unique academic identifier.
9. As an Admin, I want to click a dedicated "Lihat Detail" button on any student in the directory table, so that I can navigate to a comprehensive student profile page at the dedicated detail URL.
10. As an Admin, I want the student detail page to display a prominent "Kembali ke Direktori" button, so that I can easily return to the main student list with preserved filter context.
11. As an Admin, I want the student detail page to present full identity details (NIS, full name, school of origin, package code, email, phone number, join date, and active status badge), so that I have a 360-degree view of the student's profile.
12. As an Admin, I want the student detail page to show parent/guardian profile details, so that administrative staff can contact guardians without navigating to a separate billing or parent directory.
13. As an Admin, I want the student detail page to display current class placement information, including class name, active student count versus maximum capacity, and the assigned tutor, so that I can monitor academic grouping.
14. As an Admin, I want the student detail page to list weekly tutoring schedules for the student's class group, so that I can inform parents or students of session times upon request.
15. As an Admin, I want an "Edit Data Siswa" button on the student detail page, so that I can open the update modal directly from the profile overview.
16. As an Admin, I want separate "Lihat Detail" and "Edit" action buttons on the directory table rows, so that I can choose between full profile inspection and rapid inline modification.
17. As an Admin, I want TanStack Query caches to invalidate and refetch cleanly following student creation or modification, so that directory counters, summary cards, and tables update instantaneously without a full page reload.
18. As a Tutor, I want student class group reassignments to reflect immediately on class rosters and attendance checklists, so that session attendances are accurately accounted for.
19. As a Student, I want my updated profile details and class schedule to synchronize seamlessly with my personal portal dashboard, so that I see my correct schedule and personal data.
20. As a Parent, I want my contact details and my child's updated class group to stay consistent across the parent portal, so that progress reports and billings reflect current enrollment.

---

## Implementation Decisions

- Module Registration Service Enhancement: Expand the registration service to provide `updateStudent`, `createStudent`, and `getStudentById` methods directly interfacing with Supabase tables (`students`, `profiles`, `parents`, `class_members`, `classes`, and `courses`).
- Transactional Multi-Entity Updates: Student updates modify records across multiple tables (student profile, parent profile, student record, parent record, and class membership). All foreign key relationships and identity IDs must be resolved and updated cleanly.
- Strict Capacity Guardrail: When transferring a student between classes, query active class memberships for the target class. If count >= 12, reject the transfer with a structured failure message (`"Rombel {class_name} sudah penuh (12/12 siswa)"`).
- Direct Route Creation: Add a dedicated student detail route using the unnested file convention (`src/routes/admin/siswa_.$studentId.tsx`), allowing direct URL deep-linking without altering the parent directory layout.
- Mutation Hook Integration: Connect `updateStudent` and `addStudent` in the administrative mutations hook to call the registration service methods, replacing legacy in-memory mock handlers and invalidating student, class, and registration cache keys.
- Form Modal Expansion: Update the student modal dialog with inputs for student email, parent occupation, and parent home address, matching the database schema.
- Two-Tier Action Layout: Update the table column definition to provide distinct "Lihat Detail" (navigation link) and "Edit" (modal trigger) buttons styled with semantic icons and clean neutral borders.

---

## Testing Decisions

### Seam Architecture

- **Primary Testing Seam**: The Registration Service Interface (`registrationService.updateStudent`, `registrationService.createStudent`, and `registrationService.getStudentById`).
Testing at this high seam validates database operations, foreign key updates, capacity restriction logic (max 12 students), and data retrieval contracts without fragile dependence on browser rendering or transient DOM states.

### Quality Characteristics of Tests

- Tests verify external observable behavior and business rules:
  - Updates to student name, phone, email, and school persist and return updated entity records.
  - Updates to parent name, WhatsApp number, occupation, and address persist and link correctly.
  - Class transfer moves student in class memberships and synchronizes class ID and package code.
  - Class transfer to a classroom at maximum capacity (12 students) fails gracefully with an informative error.
  - Creation of a new student persists full profile, parent, and class membership data with an auto-generated sequential NIS.
  - Single student lookup retrieves full aggregated profile, parent info, class group, and schedule list.

### Prior Art

- `src/server/services/__tests__/registration.service.test.ts` (Registration sequence generation and capacity clamping).
- `src/server/services/__tests__/schedule.service.test.ts` (Supabase database CRUD, capacity checking, and anti-conflict validation).
- `src/server/services/__tests__/master-data.service.test.ts` (Master data persistence and relational lookups).

---

## Out of Scope

- Student attendance marking and digital session checklists (handled in Ticket 04 / Issue #7).
- Grade recording and learning material uploads (handled in Ticket 05 / Issue #8).
- Monthly SPP invoice generation and payment verification (handled in Ticket 06 / Issue #9).
- User authentication and role-based access control (handled in Ticket 07 / Issue #10).
- Permanent hard-deletion of student records (deletion policy requires soft-deactivation via status nonaktif).

---

## Further Notes

- The design adheres to high-contrast poster guidelines (Archivo for headings, Instrument Sans for body, no fake buttons, no unicode icons).
- Administrative actions execute with an authenticated session (`ensureAdminSession()`) to comply with PostgreSQL Row Level Security (RLS) policies.
