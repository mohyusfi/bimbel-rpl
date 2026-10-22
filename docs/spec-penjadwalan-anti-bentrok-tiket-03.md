# Spesifikasi: Penjadwalan Bimbingan Anti-Bentrok & Sesi Belajar (SCHED-02)

Triage Label: `ready-for-agent`

---

## Problem Statement

Pada Sistem Informasi Bimbingan Belajar Tadulako Cendekia, penjadwalan bimbingan belajar mingguan dan pembentukan sesi kelas sebelumnya masih mengandalkan mock data di penyimpanan lokal peramban (*localStorage / in-memory store*). Kondisi ini menimbulkan sejumlah masalah operasional nyata:

1. **Jadwal Tidak Tersimpan Permanen**: Setiap jadwal bimbingan yang disusun oleh Administrator Tata Usaha tidak tersimpan di basis data pusat (Supabase PostgreSQL `schedules`), sehingga jadwal hilang ketika peramban di-refresh atau diakses dari komputer staf lain.
2. **Tidak Ada Rekaman Sesi Belajar Aktual**: Jadwal mingguan yang berulang belum otomatis memicu pembentukan entri sesi belajar aktual di tabel `sessions`. Akibatnya, Tutor tidak memiliki lembar sesi riil untuk melakukan presensi digital dan evaluasi belajar.
3. **Potensi Tabrakan Ruang dan Tutor (Double Booking)**: Tanpa validasi anti-bentrok berbasis database, satu ruangan fisik atau satu tutor dapat dijadwalkan secara bersamaan pada rombel kelas yang berbeda di jam yang beririsan.
4. **Ketiadaan Visibilitas Jadwal Riil bagi Siswa dan Tutor**: Kalender bimbingan di portal Siswa dan Tutor belum memuat data riil dari database pusat, melainkan hanya menampilkan data dummy tiruan.

---

## Solution

Membangun modul penjadwalan bimbingan belajar terpadu dengan arsitektur **100% Database-Driven** (Supabase PostgreSQL):

1. **Validasi Anti-Bentrok Dua Lapis (SCHED-02)**: Menerapkan mesin deteksi bentrok pada sisi klien (antarmuka input langsung mengunci tombol simpan dan memberikan rekomendasi ruangan kosong alternatif) dan sisi server (`scheduleService`) sebelum data disimpan ke database.
2. **Persistensi Penuh ke Database**: Menyimpan setiap jadwal bimbingan mingguan yang sah secara permanen ke tabel `schedules` di Supabase PostgreSQL, dengan keterikatan foreign key pada tabel `classes`, `rooms`, dan `tutors`.
3. **Pembentukan Sesi Aktual Otomatis**: Setiap penyimpanan jadwal baru secara otomatis menurunkan 1 entri sesi belajar perdana pada tabel `sessions` untuk tanggal pertemuan terdekat berikutnya (`next occurrence of day_of_week`), lengkap dengan topik awal, sehingga siap digunakan untuk presensi.
4. **Sinkronisasi Sesi pada Mutasi Jadwal**: Jika jadwal diubah atau dibatalkan, sesi belajar yang belum berlangsung (`is_completed = false`) otomatis disesuaikan atau dibatalkan, sedangkan sesi yang telah selesai dipertahankan utuh sebagai riwayat audit presensi.
5. **Penyajian Data Riil pada Portal Tutor dan Siswa**: Menghilangkan seluruh mock/localStorage pada modul penjadwalan. Portal Tutor dan Siswa memuat data murni dari database, dilengkapi penanda tanggal sesi terdekat berikutnya.

---

## User Stories

1. As an Administrator, I want to create a weekly guidance schedule for a class group with specified tutor, room, day of week, and time range, so that learning sessions are officially registered in the central database.
2. As an Administrator, I want the system to validate that end time is strictly greater than start time, so that invalid or inverted session durations cannot be submitted.
3. As an Administrator, I want the system to detect physical room conflicts when two schedules use the same room on the same day during overlapping time slots, so that room double-booking is prevented.
4. As an Administrator, I want the system to detect tutor conflicts when a tutor is assigned to multiple classes on the same day during overlapping time slots, so that a tutor is never double-booked.
5. As an Administrator, I want real-time visual feedback on the schedule form indicating conflicting schedules and classes, so that I immediately understand why a submission is blocked.
6. As an Administrator, I want intelligent suggestions of alternative vacant rooms during the requested time slot when a room conflict occurs, so that I can reallocate the class with a single click.
7. As an Administrator, I want the server-side service layer to independently re-validate schedule conflicts before database insertion, so that race conditions from concurrent administrative sessions are safely rejected.
8. As an Administrator, I want every newly created schedule to automatically generate an initial session record in the database for the next upcoming calendar date matching the schedule's day of week, so that class sessions are immediately ready for attendance tracking.
9. As an Administrator, I want to update an existing schedule (modifying subject, tutor, room, day, or time), so that schedule adjustments reflect accurately in the database.
10. As an Administrator, I want updates to a schedule to safely exclude the schedule's own identifier during conflict checks, so that saving unchanged time slots does not falsely report self-conflicts.
11. As an Administrator, I want schedule modifications to automatically update the room, tutor, and calendar date of any pending uncompleted sessions, so that future sessions match the revised schedule.
12. As an Administrator, I want schedule modifications to preserve completed past sessions untouched, so that historical attendance and curriculum audits remain uncompromised.
13. As an Administrator, I want to delete a schedule from the database, so that discontinued classes or obsolete time slots are purged cleanly.
14. As an Administrator, I want schedule deletion to safely clean up uncompleted sessions while preserving historical records of completed sessions.
15. As an Administrator, I want to see a clean empty state in the administrative schedule table when the database contains zero schedules, so that I am clearly prompted to create the first schedule.
16. As an Administrator, I want to filter schedules by day of week, room, or tutor, so that I can inspect the facility allocation efficiently.
17. As a Tutor, I want to view my weekly teaching schedule loaded directly from the database, so that I have guaranteed visibility into my assigned classes.
18. As a Tutor, I want to see the specific calendar date and time of my next upcoming teaching session, so that I know exactly when my next class takes place.
19. As a Tutor, I want to see a clear empty state message when I currently have no assigned schedules in the database, so that I know no teaching duties are currently scheduled for me.
20. As a Tutor, I want to initiate digital attendance directly from my active schedule entry, so that I can smoothly transition into recording student presence.
21. As a Student, I want to view the weekly guidance schedule of my enrolled class group loaded directly from the database, so that I know when and where my lessons are held.
22. As a Student, I want to see the exact room and assigned tutor for each subject schedule, so that I know where to go and who will teach.
23. As a Student, I want to see the upcoming calendar date for my next session, so that I can prepare my study materials in advance.
24. As a Student, I want to see a clean empty state message if my enrolled class has not yet been assigned a schedule in the database, so that I am informed without confusing error messages.
25. As a Parent, I want to see the scheduled guidance times of my enrolled child directly from the database, so that I can support their learning attendance.

---

## Implementation Decisions

### Modules & Architecture
- **Schedule Service Module**: Dedicated server-side service responsible for all database interactions with Supabase `schedules` and `sessions` tables. It encapsulates conflict checking, transaction-safe persistence, session generation, and cascading updates.
- **Conflict Detection Engine (SCHED-02)**: Shared conflict evaluation logic implementing the canonical interval overlap formula:
  $$(Mulai_A < Selesai_B) \land (Selesai_A > Mulai_B)$$
  applied across identical room or identical tutor targets on matching days of week.
- **Session Auto-Generation**: Deterministic date calculation that computes the next calendar date matching the schedule's day of week from the current timestamp, inserting an initial record into the `sessions` table with status `isCompleted: false`.
- **Zero-Mock Policy**: Elimination of all mock/localStorage fallbacks for schedules and sessions. If the database returns zero records, the application strictly returns an empty list `[]` and displays semantic empty states.
- **Client State Synchronization**: TanStack Query hooks (`useAdminSchedules`, `useAttendanceSessions`, `useTutorDashboardData`, `useStudentDashboardData`) integrated directly with the Schedule Service, reacting to mutations via query invalidation.

---

## Testing Decisions

### Seam Architecture
- **Primary Testing Seam**: The **Schedule Service Interface** and the **Dashboard Query Hooks**.
  Testing at this high seam exercises real database operations, strict conflict detection, initial session synthesis, and data delivery to Tutor/Student consumers without binding to fragile UI markup or private helper functions.

### Quality Characteristics of Tests
- Tests only assert external observable behaviors:
  - Rejection of overlapping schedule entries with descriptive conflict reasons.
  - Identification of unoccupied alternative rooms during conflicting time slots.
  - Creation of corresponding session rows in the database upon schedule creation.
  - Accurate filtering of schedules by active tutor identity and student class membership.
  - Graceful handling of empty database tables without throwing exceptions.

### Prior Art
- `src/server/services/__tests__/master-data.service.test.ts` (Supabase CRUD, auto-session, clamping guardrails).
- `src/lib/__tests__/schedule-conflict-engine.test.ts` (Pure math of interval overlaps and schema contracts).
- `src/lib/__tests__/schedule-conflict-persistence.test.ts` (Store & Hook integration harnesses).

---

## Out of Scope

- Recording individual student attendance status (`Hadir`, `Sakit`, `Izin`, `Alpa`) on sessions (covered in Ticket 04 / Issue #7).
- Uploading curriculum modules, worksheets, or presentation slides (covered in Ticket 05 / Issue #8).
- Managing student tuition fees, invoices, and payment receipts (covered in Ticket 06 / Issue #9).
- User authentication, role-based route guards, and credential resets (covered in Ticket 07 / Issue #10).

---

## Further Notes

- The database tables `schedules` and `sessions` are verified and currently clean (`0 rows`), ready for production-grade population by Admin workflows.
- All database mutations leverage authenticated administrative sessions (`ensureAdminSession()`) to respect PostgreSQL Row Level Security (RLS) policies.
