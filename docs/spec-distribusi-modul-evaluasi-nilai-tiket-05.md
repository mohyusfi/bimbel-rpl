# Spesifikasi: Distribusi Modul Belajar & Evaluasi Nilai Rapor (LEARN-01, LEARN-02 & LEARN-03)

Triage Label: `ready-for-agent`

---

## Problem Statement

Pada bimbingan belajar konvensional di Kota Palu, proses distribusi modul belajar dan penyampaian hasil evaluasi belajar siswa masih menghadapi kendala operasional yang signifikan:

1. **Distribusi Materi Tercecer dan Boros Kertas**: Bahan ajar (modul teori, latihan soal, kisi-kisi ujian, dan lembar pembahasan) dibagikan secara manual lewat fotokopi fisik atau tautan obrolan instan yang tercecer. Siswa sering kehilangan modul fisik dan kesulitan mencari kembali materi bimbingan terdahulu.
2. **Ketiadaan Repositori Modul Terstruktur per Rombel Kelas**: Materi belajar belum terisolasi secara terorganisir per rombel kelas di penyimpanan terpusat. Siswa dari kelas berbeda dapat salah mengakses modul yang tidak relevan dengan kurikulum kelasnya.
3. **Penyimpanan Nilai Evaluasi Tidak Terpusat**: Hasil penilaian Try Out UTBK, kuis berkala, dan tugas mandiri masih dicatat pada berkas spreadsheet lokal tutor atau buku nilai fisik yang rentan hilang dan tidak terhubung ke basis data utama.
4. **Ketiadaan Transparansi Evaluasi bagi Orang Tua & Siswa**: Orang tua dan siswa tidak dapat memantau riwayat skor evaluasi secara real-time. Umpan balik kualitatif (*feedback*) dari tutor jarang sampai ke orang tua tepat waktu, sehingga kesulitan mendeteksi kelemahan akademik anak sedini mungkin.
5. **Ketergantungan pada Mock Data & LocalStorage**: Implementasi awal antarmuka modul materi dan nilai masih bergantung pada data mock statis dan penyimpanan browser `localStorage`, sehingga pembaruan materi dan penilaian tidak tersimpan permanen di cloud database Supabase serta tidak tersinkronisasi lintas perangkat.

---

## Solution

Membangun modul **Distribusi Modul Belajar & Evaluasi Nilai Rapor** terpadu yang 100% terintegrasi dengan database Supabase PostgreSQL dan Supabase Storage bucket `learning-materials`:

1. **Repositori Modul Pembelajaran Digital Berbasis Cloud Storage (LEARN-01)**:
   - Tutor dapat mengunggah berkas modul dalam format legal PDF dan PPTX (batas ukuran maksimal 20MB) ke bucket Supabase Storage `learning-materials`.
   - Metadata modul (judul, deskripsi, kategori modul, tipe berkas, ukuran, class ID, tutor ID, dan public storage URL) tersimpan di tabel `materials` Supabase.
   - Pustaka kategori modul terstruktur: `Modul Teori`, `Lembar Tugas`, `Bank Soal`, `Pembahasan Soal`, dan `Kisi-kisi Ujian`.
   - Pratinjau langsung di dalam aplikasi (*in-app previewer*) untuk berkas PDF dan PPTX, serta tombol unduh resmi bagi siswa dan tutor.
2. **Penghapusan Bersih Terpadu (Atomic Deletion)**:
   - Saat Tutor menghapus materi, sistem secara atomik menghapus baris metadata di tabel `materials` dan menghapus objek berkas fisik dari bucket Supabase Storage, mencegah penumpukan berkas sampah (*orphaned files*).
3. **Hak Akses Modul Terisolasi per Rombel Kelas**:
   - Siswa hanya dapat melihat dan mengunduh berkas modul pembelajaran yang secara eksplisit ditugaskan ke rombel kelas aktifnya (`materials.class_id = student.class_id`).
4. **Pencatatan Nilai Evaluasi & Feedback Kualitatif Tutor (LEARN-02)**:
   - Tutor dapat menginput nilai evaluasi numerik (rentang valid 0–100) per siswa untuk kategori `Try Out`, `Kuis`, atau `Tugas`.
   - Tutor menyertakan catatan evaluasi kualitatif individual (*tutor feedback*) untuk memberikan arahan perbaikan belajar siswa.
   - Sistem secara otomatis menghitung nilai rata-rata kelas (*class average*) berdasarkan seluruh siswa di rombel kelas tersebut dan menyimpannya ke kolom `class_average` di tabel `grades`.
5. **Rapor Perkembangan & Grafik Tren Belajar Siswa (LEARN-03)**:
   - Portal Siswa dan Orang Tua menampilkan rekapitulasi rapor nilai lengkap: rata-rata nilai keseluruhan, nilai tertinggi, total evaluasi yang telah diselesaikan, dan perbandingan terhadap rata-rata kelas.
   - Grafik perkembangan nilai visual (*score progress chart*) yang menggambarkan tren kenaikan/penurunan nilai siswa dari waktu ke waktu per kategori evaluasi.
   - Komponen *Child Switcher* pada portal Orang Tua yang secara dinamis beralih antar-anak dan memuat rapor nilai riil dari database Supabase untuk anak yang dipilih.
6. **Zero Mock Data & Zero LocalStorage Fallback**:
   - Menghapus seluruh data mock (`INITIAL_MATERIALS`, `INITIAL_GRADES`) dan properti state `learningMaterials` serta `gradeRecords` dari `adminStore`.
   - Mengaktifkan mekanisme auto-purge pada browser `localStorage` agar tidak ada data residu lama yang muncul kembali.
   - Menjalankan seeder data master riil ke tabel `materials` dan `grades` di Supabase untuk menyediakan data awal operasional.
7. **Sinkronisasi Instan via TanStack Query & Supabase Realtime**:
   - Pembaruan materi dan nilai langsung meng-invalidate cache TanStack Query.
   - Pemasangan listener Supabase Realtime pada tabel `materials` dan `grades` agar layar siswa dan orang tua terbarui otomatis saat tutor menambahkan nilai atau mengunggah materi baru.

---

## User Stories

### A. Pengajar (Tutor)
1. As a Tutor, I want to select a specific class from my assigned teaching classes when uploading a learning module, so that the learning material is directed only to the relevant class group.
2. As a Tutor, I want to upload PDF and PPTX files up to 20MB directly to Supabase Storage, so that my students have immediate access to high-quality course slide decks and handouts.
3. As a Tutor, I want the system to reject invalid file extensions (such as .exe, .zip, .mp4) with a clear error notification, so that storage integrity and security are preserved.
4. As a Tutor, I want to categorize my uploaded materials into standard categories (Modul Teori, Lembar Tugas, Bank Soal, Pembahasan Soal, Kisi-kisi Ujian), so that course content is cleanly organized for students.
5. As a Tutor, I want to provide a title and optional descriptive notes for each module, so that students understand the objectives and instructions for that material.
6. As a Tutor, I want to preview uploaded PDF and PPTX documents directly inside the portal before or after publishing, so that I can verify formatting and content correctness.
7. As a Tutor, I want to delete obsolete or duplicate learning materials, so that both the database record and the physical storage file are permanently cleaned up.
8. As a Tutor, I want to view a filterable list of all modules I have authored, filterable by class and category, so that I can quickly manage my curriculum library.
9. As a Tutor, I want to select an evaluation category (Try Out, Kuis, or Tugas) when submitting grades, so that assessments are categorized accurately in student report cards.
10. As a Tutor, I want to enter a numeric score between 0 and 100 for each enrolled student in a class, so that performance records conform to standard grading scales.
11. As a Tutor, I want the system to reject out-of-range numeric scores (< 0 or > 100) or non-numeric inputs immediately, so that invalid grades cannot corrupt student records.
12. As a Tutor, I want to write qualitative constructive feedback for each student (e.g. "Perlu perbanyak latihan trigonometri"), so that students and parents receive actionable academic guidance.
13. As a Tutor, I want the system to automatically compute the class average score across all student submissions for that evaluation, so that I do not need to perform manual mathematical calculations.
14. As a Tutor, I want to edit previously submitted scores and feedback within my authorized classes, so that grading corrections or re-evaluation requests can be accommodated.
15. As a Tutor, I want all my module uploads and grade submissions to persist directly to Supabase PostgreSQL, so that no data is lost upon browser refreshes or device changes.

### B. Siswa (Student)
16. As a Student, I want to access a dedicated "Materi Belajar" page showing only the modules assigned to my active class rombel, so that I am not distracted or confused by materials from other classes.
17. As a Student, I want to see clear information for each material including subject name, module title, category, file size, and upload date, so that I can easily find the document I need.
18. As a Student, I want to preview PDF handouts and presentation slide decks in-app without downloading, so that I can quickly study on mobile or desktop browsers.
19. As a Student, I want to download original PDF or PPTX files directly to my device, so that I can study offline when internet access is unavailable.
20. As a Student, I want to filter my learning materials by category (Modul Teori, Lembar Tugas, Bank Soal, Pembahasan Soal, Kisi-kisi Ujian), so that I can quickly retrieve specific study resources.
21. As a Student, I want to view an informative empty state if no materials have been uploaded for my class yet, so that I understand why the list is currently empty.
22. As a Student, I want to access my comprehensive "Nilai & Rapor" page, so that I can monitor my academic progress throughout my enrollment.
23. As a Student, I want to see key summary metric cards displaying my cumulative average score, highest achieved score, and total completed evaluations, so that I have a quick snapshot of my standing.
24. As a Student, I want to view a visual score progress chart showing my score trajectories over time across various assessments, so that I can track whether my performance is improving.
25. As a Student, I want to inspect a detailed evaluation table listing assessment titles, categories, dates, individual scores, class averages, and comparative differences, so that I know where I stand relative to my peers.
26. As a Student, I want to read tutor qualitative feedback on each of my assessments, so that I understand my strengths and areas needing improvement.
27. As a Student, I want new grades and modules uploaded by tutors to appear automatically without having to reload the web page, so that I have a seamless real-time experience.

### C. Orang Tua / Wali Murid (Parent)
28. As a Parent, I want to access the "Rapor Progres Belajar" portal for my registered children, so that I can monitor their academic development transparently.
29. As a Parent with multiple enrolled children, I want a persistent Child Switcher to switch between my children with one click, so that each child's academic records can be inspected independently.
30. As a Parent, I want the child switcher to immediately fetch and render real grade records from Supabase for the selected child, so that there is zero stale or cross-contaminated data.
31. As a Parent, I want to see an executive KPI summary of my child's performance (Average Score, Top Score, Class Average comparison, and Best Performing Assessment), so that I can gauge overall academic health.
32. As a Parent, I want to view a visual trend chart depicting my child's test scores over consecutive dates, so that I can visually verify learning momentum.
33. As a Parent, I want to filter evaluation records by category (All, Try Out, Kuis, Tugas), so that I can analyze performance in major exams versus routine homework.
34. As a Parent, I want to read qualitative observations and notes written by tutors for my child, so that I can provide targeted support and encouragement at home.
35. As a Parent, I want clear visual indicators highlighting whether my child scored above or below the class average, so that I can quickly identify subjects requiring extra attention.

---

## Implementation Decisions

### 1. Zero Mock Data & Auto-Purge LocalStorage Architecture
- **Elimination of Mock Data**: Remove `INITIAL_MATERIALS` and `INITIAL_GRADES` from state models.
- **Store Decoupling**: Completely remove `learningMaterials` and `gradeRecords` from `AdminState` in `adminStore`. The state store will no longer maintain in-memory or localStorage mirrors for learning modules and grade evaluations.
- **LocalStorage Auto-Purge**: On application bootstrap, `adminStore` checks for legacy keys (`tc_bimbel_admin_state_v1`) containing `learningMaterials` or `gradeRecords` and purges those properties to prevent legacy mock records from lingering in user browsers.
- **Single Source of Truth**: All queries and mutations for modules and grades are executed strictly against Supabase PostgreSQL (`materials` and `grades` tables) and Supabase Storage (`learning-materials` bucket).

### 2. Service Layer: `learning.service.ts`
Implement a dedicated server service `learningService` located at `src/server/services/learning.service.ts` adhering to the `ServerResult<T>` pattern:
- `getMaterialsByClass(classId: string): Promise<LearningMaterial[]>`: Fetches modules for a given class ordered by `createdAt DESC`.
- `getMaterialsByTutor(tutorId: string): Promise<LearningMaterial[]>`: Fetches authored modules for a given tutor.
- `uploadMaterial(input: UploadMaterialInput): Promise<ServerResult<LearningMaterial>>`:
  1. Validates file extension (PDF/PPTX) and file size (<= 20MB).
  2. Uploads file to Supabase Storage bucket `learning-materials` under path `classes/{classId}/{timestamp}_{filename}`.
  3. Obtains public URL for the file.
  4. Inserts new record into `materials` table.
- `deleteMaterial(materialId: string): Promise<ServerResult<boolean>>`:
  1. Retrieves `storagePath` from `materials` table.
  2. Removes physical file from bucket `learning-materials`.
  3. Deletes record from `materials` table in Supabase.
- `getGradesByStudent(studentId: string): Promise<GradeRecord[]>`: Fetches all evaluation grades for a student ordered by `assessmentDate DESC`.
- `getGradesByClass(classId: string): Promise<GradeRecord[]>`: Fetches class grades for tutor evaluation matrices.
- `saveGrade(input: SaveGradeInput): Promise<ServerResult<GradeRecord>>`:
  1. Validates score (0 <= score <= 100) and required fields.
  2. Automatically calculates `classAverage` by querying existing scores for the same `classId` and `assessmentTitle`.
  3. Inserts evaluation record into `grades` table.
  4. Recalculates and updates `class_average` across all student records belonging to that assessment in the same class.
- `updateGrade(id: string, updates: Partial<GradeRecord>): Promise<ServerResult<GradeRecord>>`: Updates score/feedback and synchronizes `class_average`.
- `deleteGrade(id: string): Promise<ServerResult<boolean>>`: Deletes grade record from `grades` table.

### 3. Database Schema & Data Seeding
- **Existing Tables Utilized**:
  - `materials`: `id`, `class_id`, `tutor_id`, `title`, `description`, `category`, `file_type`, `file_size`, `file_url`, `storage_path`, `created_at`.
  - `grades`: `id`, `student_id`, `class_id`, `tutor_id`, `subject_name`, `assessment_title`, `category`, `score`, `class_average`, `tutor_feedback`, `assessment_date`, `created_at`.
- **Database Seeding (`src/db/seed.ts`)**:
  - Insert realistic master learning materials (e.g. Modul Fisika Mekanika, Modul UTBK TPS Penalaran Matematika, Slide Presentasi Biologi Sel) assigned to active classes.
  - Insert realistic historical grade records (Try Out 1 UTBK, Kuis 1 Logika Matematika, Tugas Mandiri) for active demo students (Fahri Ramadhan, Siti Nurhaliza, dll.) with comprehensive qualitative tutor notes and calculated class averages.

### 4. Hook Layer & Real-time Synchronization (`use-admin-data.ts`)
- Refactor `useLearningMaterials()`, `useClassMaterials()`, `useTutorMaterials()`, and `useGradeRecords()` to query `learningService` asynchronously via TanStack Query.
- Refactor `useStudentDashboardData()` and `useParentDashboardData()` to consume dynamic database query data rather than static store state.
- Wire Supabase Realtime channel (`postgres_changes`) listening for `INSERT`, `UPDATE`, and `DELETE` on `materials` and `grades` to trigger TanStack Query cache invalidation (`ADMIN_KEYS.materials` and `ADMIN_KEYS.grades`).

### 5. UI/UX & Design Guardrails
- Strictly enforce AGENTS.md styling guidelines:
  - High-contrast poster design system: `#000000` (Hitam), `#CB2957` (Merah Kirmizi), `#EEEEEE` (Kanvas Abu-abu).
  - Clean typography: Archivo for Display/Headings, Instrument Sans for Body and Data Tables.
  - Semantic status indicators without border or background boxes (Zero Fake Buttons).
  - Strictly **NO EMOJIS** in user-facing texts, logs, notifications, and code comments. Official Lucide React SVG icons only (`FileText`, `CheckCircle2`, `AlertCircle`, `Download`, `Eye`, `Trash2`).

---

## Testing Decisions

### Seam Architecture
- **Primary Testing Seam**: `learningService` Public Interface & TanStack Query Hook Data Resolvers.
  Testing at this highest functional seam verifies full end-to-end integration with Supabase database tables and storage while insulating tests from internal UI presentation details.
  
  The test harness verifies:
  1. **Storage & Format Integrity**: Validation of PDF and PPTX extensions, 20MB file size limits, and rejection of illegal mime types.
  2. **Atomic Module Persistence**: Correct insertion into Supabase `materials` table, retrieval of public URLs, and coordinated removal of both database rows and storage files.
  3. **Class Isolation Enforcement**: Verification that queries for Student A in Class 1 never return materials authored for Class 2.
  4. **Score Range & Math Verification**: Numerical boundary enforcement (0–100), automated calculation of `class_average`, and accurate report card metrics (overall average, highest score, differences).
  5. **Zero LocalStorage & Mock Regression**: Asserting that `adminStore` contains zero mock material/grade entries and that state is persisted 100% via Supabase PostgreSQL.
  6. **Parent Child Switcher Integrity**: Switching `selectedChildId` correctly resolves distinct grade records for the target child directly from Supabase.

### Quality Characteristics of Tests
- Tests observe external behavior, database query responses, and public service contracts only.
- Strict rejection of mock data and legacy localStorage state.
- Test suites run via `vitest run` and must achieve 100% pass rate alongside `npm run typecheck`.

### Prior Art
- `src/lib/__tests__/materials-storage-persistence.test.ts` (File format & size validators).
- `src/lib/__tests__/grade-evaluation-persistence.test.ts` (Grade calculations and student dashboard adapters).
- `src/server/services/__tests__/schedule-attendance-integration.test.ts` (Database service integration and Supabase live query patterns).

---

## Out of Scope

- Pembayaran tagihan les dan verifikasi bukti transfer SPP (Tiket 06 / Issue #9).
- Modul autentikasi Supabase Auth login multi-role dan RBAC route guarding (Tiket 07 / Issue #10).
- Unggah video berukuran besar langsung ke Supabase Storage (hanya mendukung berkas dokumen PDF dan PPTX hingga 20MB; video disarankan menggunakan tautan embed).

---

## Further Notes

- Supabase Storage bucket `learning-materials` sudah dibuat dan terkonfigurasi dengan status `public: true` serta batasan ukuran 20MB (`20971520` bytes).
- Seluruh rute dashboard (`/tutor/*`, `/student/*`, `/parent/*`) menggunakan rendering CSR (`ssr: false`) sesuai pedoman TanStack Start di `AGENTS.md`.
