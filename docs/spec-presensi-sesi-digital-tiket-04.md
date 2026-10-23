# Spesifikasi: Presensi Sesi Digital & Rekap Kehadiran Real-time (ATTEND-01 & ATTEND-02)

Triage Label: `ready-for-agent`

---

## Problem Statement

Pada operasional bimbingan belajar konvensional di Kota Palu, pencatatan kehadiran siswa masih sering dilakukan secara manual di atas lembar kertas atau percakapan obrolan grup yang mudah tercecer dan hilang. Situasi ini menimbulkan sejumlah kendala mendasar:

1. **Ketiadaan Rekaman Presensi Terpusat**: Sesi belajar aktual yang dihasilkan dari jadwal bimbingan berulang belum terhubung ke lembar presensi digital yang tersimpan permanen di basis data pusat (`sessions` dan `attendances`).
2. **Kerentanan Integritas Data Lampau**: Tanpa mekanisme kunci audit (*audit lock*) dan batasan toleransi waktu revisi (*grace period*), catatan presensi sesi lampau rawan diubah atau dimanipulasi di kemudian hari, yang berakibat pada ketidakvalidan rekapitulasi kehadiran siswa.
3. **Ketiadaan Transparansi bagi Siswa & Orang Tua**: Siswa dan orang tua tidak dapat memverifikasi status kehadiran secara *real-time* (apakah anak benar-benar telah sampai di kelas bimbingan atau membolos) serta tidak memiliki akses ke akumulasi persentase kehadiran belajar yang akurat.
4. **Risiko Sesi Terlewat (*Overdue*) Hanyut saat Jadwal Diubah**: Ketika Admin memperbarui jadwal bimbingan mingguan, sesi lampau yang belum sempat diabsen oleh Tutor berisiko ikut tergeser tanggalnya, sehingga mengaburkan fakta historis bahwa bimbingan pada tanggal tersebut tidak terlaksana.
5. **Beban Antarmuka Pengajar yang Menumpuk**: Tanpa pemisahan antara sesi aktif hari ini dan arsip sesi yang telah tervalidasi, daftar pilihan sesi di portal pengajar akan menumpuk puluhan rekaman seiring berjalannya semester.

---

## Solution

Membangun modul **Presensi Sesi Digital & Rekap Kehadiran Real-time** terpadu berbasis Supabase PostgreSQL:

1. **Formulir Presensi Interaktif Tutor (ATTEND-01)**:
   - Formulir presensi otomatis memuat seluruh siswa rombel kelas yang terdaftar dari database.
   - Pilihan status semantik per siswa: `Hadir`, `Sakit`, `Izin`, `Alpa`, disertai tombol aksi cepat *"Hadirkan Semua Siswa"*.
   - Kolom pencatatan topik materi bimbingan dan catatan evaluasi kehadiran individual (misal: izin sakit dengan surat, dispensasi sekolah).
2. **Penyimpanan Atomik & Riwayat Sesi Permanen**:
   - Menyimpan seluruh status kehadiran ke tabel `attendances` dan memperbarui status sesi menjadi `is_completed = true` beserta topik materi ke tabel `sessions`.
   - Mengunci keutuhan riwayat sesi yang telah selesai sehingga tidak akan terpengaruh oleh mutasi jadwal mingguan di masa mendatang.
3. **Mekanisme Audit Lock & Grace Period 24 Jam**:
   - Tutor diberikan hak merevisi atau mengoreksi salah klik presensi dalam batas toleransi 24 jam sejak sesi dinyatakan selesai.
   - Melewati batas 24 jam, sesi secara otomatis terkunci permanen (*read-only*) bagi Tutor guna menjamin keaslian arsip laporan.
4. **Isolasi Sesi Lampau (*Overdue Protection*)**:
   - Jika terjadi pembaruan jadwal mingguan oleh Admin, sesi lampau yang belum tervalidasi (`is_completed = false` dan `session_date < today`) tidak ikut bergeser tanggalnya, melainkan dipertahankan sebagai arsip sesi terlewat untuk ditinjau oleh staf Tata Usaha.
5. **Pemisahan Antarmuka Portal Pengajar**:
   - Menyediakan Tab **"Perlu Presensi"** untuk menampilkan sesi bimbingan hari ini dan sesi mendatang yang menunggu verifikasi.
   - Menyediakan Tab **"Riwayat Presensi"** untuk menyajikan arsip tabel sesi yang telah selesai beserta rincian kehadiran dan topik pembahasan.
6. **Pemantauan Real-time Siswa & Orang Tua (ATTEND-02)**:
   - Dashboard Siswa dan Orang Tua menampilkan rekapitulasi kehadiran seketika setelah tutor menekan tombol simpan presensi.
   - Menghitung kalkulasi persentase kehadiran secara deterministik:
     $$\text{Persentase Kehadiran} = \frac{\text{Jumlah Sesi Hadir}}{\text{Total Sesi Selesai}} \times 100\%$$
   - Visual alert peringatan otomatis bagi Orang Tua jika anak tercatat `Alpa`.

---

## User Stories

### Tutor (Tenaga Pengajar)
1. As a Tutor, I want the attendance page to automatically populate the enrolled students of the selected class session from the database, so that I do not have to manually look up class rosters.
2. As a Tutor, I want all students to be initialized with "Hadir" status by default, so that I can take attendance with minimal clicks when full attendance occurs.
3. As a Tutor, I want a "Hadirkan Semua Siswa" shortcut button, so that I can quickly reset all attendance toggles back to present with a single action.
4. As a Tutor, I want to change individual student attendance status to Hadir, Sakit, Izin, or Alpa, so that accurate student attendance conditions are reflected.
5. As a Tutor, I want to provide optional notes for individual students (e.g. "Izin sakit demam", "Terlambat 15 menit"), so that qualitative context is captured.
6. As a Tutor, I want to enter the specific learning topic covered during the session, so that curriculum pacing is documented.
7. As a Tutor, I want the system to show a visual warning badge when one or more students are marked as "Alpa", so that I can double-check before submitting unexcused absences.
8. As a Tutor, I want saving attendance to mark the session as `is_completed: true` in the database, so that the session is officially archived.
9. As a Tutor, I want to view past completed sessions in a dedicated "Riwayat Presensi" tab, so that my active workspace remains uncluttered.
10. As a Tutor, I want to inspect historical attendance entries and covered topics of any completed session, so that I can review past class progress.
11. As a Tutor, I want a 24-hour grace period to edit and correct attendance records for completed sessions, so that accidental misclicks can be fixed promptly.
12. As a Tutor, I want completed sessions older than 24 hours to become strictly read-only with a clear locked indicator, so that data audit integrity is preserved.
13. As a Tutor, I want to clearly identify uncompleted past sessions ("Terlewat"), so that I am notified of forgotten attendances.

### Siswa (Peserta Bimbingan)
14. As a Student, I want to view my real-time attendance rate percentage on my dashboard, so that I can track my overall commitment.
15. As a Student, I want to see the total counts of my Hadir, Sakit, Izin, and Alpa sessions, so that I understand my attendance breakdown.
16. As a Student, I want to view the list of all learning sessions with my personal attendance status and date, so that I have complete transparency over my attendance record.
17. As a Student, I want to see the topic discussed in each past session, so that I know what material was covered if I was absent.
18. As a Student, I want to view tutor notes attached to my attendance record, so that I am aware of feedback or excuses recorded by the tutor.
19. As a Student, I want uncompleted upcoming sessions to be displayed as "Terjadwal", so that I do not confuse scheduled sessions with past absences.

### Orang Tua / Wali
20. As a Parent, I want to see the real-time attendance status of my child immediately after the tutor submits attendance, so that I know if my child arrived safely at the tutoring center.
21. As a Parent, I want an immediate visual notification or alert indicator if my child is recorded as "Alpa", so that I can investigate unexcused absences without delay.
22. As a Parent, I want to view the cumulative attendance percentage of my child on the portal dashboard, so that I can monitor their overall discipline.
23. As a Parent, I want to filter attendance history by status (Semua, Hadir, Sakit, Izin, Alpa), so that I can easily review specific absence records.
24. As a Parent, I want the multi-child switcher to isolate attendance records per child, so that siblings' data never intermingle.
25. As a Parent, I want to see the specific tutor name, room name, and time range for every attendance entry, so that I have full operational visibility.

### Administrator (Tata Usaha)
26. As an Administrator, I want attendance mutations to execute in atomic transactions across the `attendances` and `sessions` tables, so that partial saves are impossible.
27. As an Administrator, I want modifications to weekly schedules to never alter completed sessions or their attendance history, so that past records remain immutable.
28. As an Administrator, I want overdue uncompleted sessions (`session_date < today`) to remain anchored to their original calendar date when weekly schedules change, so that historical schedule anomalies are preserved for administrative review.
29. As an Administrator, I want unique constraints on `(session_id, student_id)` to guarantee no duplicate attendance rows are ever created.

---

## Implementation Decisions

### 1. Modul & Arsitektur Lapisan Data
- **Attendance Service (`src/server/services/attendance.service.ts`)**:
  Modul *server-only* yang menangani seluruh operasi database untuk presensi:
  - `saveSessionAttendance(sessionId, topic, entries)`: Membuka transaksi database, melakukan upsert entri ke tabel `attendances`, dan memperbarui status sesi di `sessions` (`is_completed = true`, `topic`).
  - `getSessionAttendance(sessionId)`: Mengambil daftar siswa dan status presensi untuk sesi tertentu.
  - `getStudentAttendanceSummary(studentId)`: Menghitung rekapitulasi kehadiran siswa (`hadir`, `sakit`, `izin`, `alpa`, `attendanceRate`).
- **Aturan Validasi Grace Period (24 Jam)**:
  Fungsi utilitas `isSessionLockedForTutor(sessionDate: string, isCompleted: boolean, completedAt?: string): boolean`:
  - Jika `!isCompleted`, sesi selalu dapat diedit (`false`).
  - Jika `isCompleted`, hitung selisih waktu antara waktu saat ini dan batas waktu sesi (maksimal 24 jam dari waktu penyelesaian atau `sessionDate 23:59:59`). Jika lebih dari 24 jam, kembalikan `true` (terkunci).

### 2. Aturan Perhitungan Persentase Kehadiran
Kalkulasi kehadiran siswa dihitung secara konsisten:
```ts
export function calculateAttendancePercentage(hadirCount: number, totalCompleted: number): number {
  if (totalCompleted <= 0) return 100
  return Math.round((hadirCount / totalCompleted) * 100)
}
```

### 3. Proteksi Mutasi Jadwal terhadap Sesi Lampau
Pada `scheduleService.updateSchedule`, klausa pembaruan sesi disaring agar tidak menggeser sesi bertanggal lampau:
```ts
const todayStr = new Date().toISOString().split('T')[0]
// Hanya sinkronkan sesi yang belum selesai DAN bertanggal hari ini ke atas
if (updates.dayOfWeek !== undefined && updates.dayOfWeek !== existing.dayOfWeek) {
  sessionQuery = sessionQuery.gte('session_date', todayStr)
}
```

### 4. Standar UI Status & Komponen
- **Penyelarasan Desain (Zero Border/Background)**:
  Status kehadiran wajib berupa *inline text semantik* (`font-medium text-xs`) disertai ikon resmi Lucide:
  - `Hadir`: Ikon `CheckCircle2` (Warna Hijau `#16a34a`)
  - `Sakit`: Ikon `Clock` (Warna Biru `#2563eb`)
  - `Izin`: Ikon `AlertCircle` (Warna Oranye `#d97706`)
  - `Alpa`: Ikon `XCircle` (Warna Merah `#dc2626`)
  - `Terjadwal`: Ikon `Clock` (Warna Abu-abu `#555555`)
- Dilarang membungkus status dengan border tebal atau badge tombol palsu.

---

## Testing Decisions

### Seam Architecture
- **Primary Testing Seam**: **Attendance Service Interface (`attendanceService`) & Hook Data Transformers**.
  Menguji lapisan layanan server dan *custom hooks* TanStack Query secara terpadu. Pengujian pada seam ini mencakup:
  1. Pengisian otomatis siswa kelas saat sesi dibuka.
  2. Penyimpanan atomik mutasi presensi ke tabel `attendances` dan `sessions`.
  3. Penegakan aturan idempoten (tidak ada duplikasi record siswa pada sesi yang sama).
  4. Penegakan aturan *audit lock* dan *grace period* 24 jam.
  5. Isolasi pembaruan jadwal agar tidak merusak sesi lampau.
  6. Kalkulasi persentase dan rekapitulasi kehadiran untuk Siswa dan Orang Tua.

### Quality Characteristics of Tests
- Pengujian hanya menguji perilaku observable eksternal, bukan detail implementasi privat.
- Seluruh *test assertions* memvalidasi kontrak data database dan hasil kalkulasi statistik.

### Prior Art
- `src/lib/__tests__/attendance-session-persistence.test.ts` (Persistensi presensi & ringkasan kehadiran).
- `src/server/services/__tests__/schedule.service.test.ts` (Siklus sesi dan isolasi jadwal).

---

## Out of Scope

- Mengunggah berkas modul pelajaran, lembar tugas, atau materi presentasi PDF/PPTX (dikerjakan pada Tiket 05 / Issue #8).
- Menginput nilai kuis, tugas, dan try out berkala serta evaluasi belajar kualitatif (dikerjakan pada Tiket 05 / Issue #8).
- Manajemen tagihan SPP, formulir unggah bukti transfer, dan verifikasi kuitansi lunas (dikerjakan pada Tiket 06 / Issue #9).
- Autentikasi Supabase Auth login dan manajemen profil kredensial (dikerjakan pada Tiket 07 / Issue #10).

---

## Further Notes

- Skema tabel `attendances` dan `sessions` telah tersedia dan tervalidasi di Supabase PostgreSQL dengan *foreign keys* dan indeks yang optimal.
- Seluruh pengujian wajib lolos verifikasi `npm run typecheck` dan `npx vitest run`.
