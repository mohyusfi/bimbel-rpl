## Problem Statement

Pada operasional bimbingan belajar konvensional di Kota Palu, koordinasi informasi operasional sering kali terlambat sampai ke siswa, orang tua, maupun tutor karena ketiadaan kanal pemberitahuan langsung di dalam aplikasi:

1. Ketiadaan Notifikasi Terpusat & Real-time: Pengguna (Siswa, Orang Tua, Tutor, dan Admin) tidak mengetahui secara seketika saat terjadi perubahan data penting pada sistem (seperti verifikasi tagihan SPP lunas, penolakan bukti transfer, pencatatan absensi Alpa pada sesi bimbingan, atau penerbitan nilai rapor baru) tanpa melakukan refresh halaman secara manual.
2. Kerentanan Kebocoran Informasi Antar Peran (RBAC): Tanpa sistem isolasi notifikasi berbasis peran dan identitas pengguna, notifikasi internal operasional admin (seperti pendaftaran siswa baru) berisiko bocor ke portal siswa/orang tua, atau notifikasi akademik anak tertukar pada akun orang tua yang memiliki lebih dari satu anak terdaftar (multi-child).
3. Hambatan Siaran Informasi Massal Terarah: Administrator tidak memiliki sarana terpadu untuk menyiarkan pengumuman resmi bimbel (seperti pengumuman libur bimbingan, agenda try out serentak, atau pengingat administrasi) ke kelompok pengguna tertentu (Semua, Siswa saja, Orang Tua saja, atau Tutor saja) yang langsung memunculkan lonceng peringatan di layar pengguna.
4. Risiko Kebocoran Koneksi WebSocket (Connection Leaks): Langganan kanal realtime pada antarmuka SPA yang tidak dibersihkan dengan benar saat navigasi antar-halaman berpotensi melipatgandakan listener WebSocket, membebani kuota koneksi Supabase Cloud, dan menyebabkan degradasi performa memori peramban.
5. Desinkronisasi Data Server & Client Store: Pencatatan ketidakhadiran (Alpa) siswa saat ini masih memicu notifikasi di lapisan store client, sehingga jika tutor menyimpan presensi langsung dari perangkat terpisah, notifikasi peringatan belum tersimpan secara atomik dan permanen di basis data PostgreSQL pusat.

---

## Solution

Membangun modul Notifikasi Waktu-Nyata (Supabase Realtime) & Broadcast Pengumuman Bimbel terpadu yang terintegrasi 100% dengan Supabase PostgreSQL CDC (Change Data Capture) dan Realtime WebSocket:

1. Skema Notifikasi Terstruktur & Relasi Profil Pengguna:
   - Menyimpan setiap peristiwa notifikasi ke tabel notifications dengan referensi kunci asing ke profil pengguna.
   - Mengelompokkan jenis notifikasi secara semantik: presensi (attendance), keuangan (billing), akademik (academic), pengumuman resmi (announcement), pendaftaran (registration), dan informasi umum (general).
   - Menyediakan kolom tautan langsung (link_url) untuk mengarahkan pengguna ke halaman terkait dalam satu klik, serta kolom metadata JSONB untuk menyimpan konteks data tambahan (ID sesi, ID tagihan, ID anak).
2. Arsitektur Kanal Ganda & Penanganan Koneksi Bersih (Zero Connection Leaks):
   - Kanal Pribadi (user-notifications): Setiap pengguna yang masuk berlangganan kanal personal berbasis identitas pengguna unik untuk mendengarkan perubahan data CDC tabel notifications dan siaran terarah.
   - Kanal Siaran Umum (broadcast:announcements): Kanal siaran bersama untuk menyebarkan pengumuman resmi bimbel secara serentak ke seluruh pengguna aktif tanpa membebani penulisan massal baris tabel database secara redundan.
   - Manajemen Daur Hidup Deterministik: Seluruh langganan kanal dilepas dan dibersihkan secara otomatis saat komponen unmount untuk menjamin ketiadaan kebocoran koneksi.
3. Penyelarasan Trigger Atomik di Lapisan Server Service:
   - Verifikasi dan penolakan tagihan SPP di modul billing secara atomik mencatat baris notifikasi ke akun siswa dan orang tua.
   - Penyimpanan presensi sesi di modul attendance yang memuat status Alpa secara atomik mencatat notifikasi peringatan ketidakhadiran ke akun orang tua dan siswa.
   - Penginputan nilai evaluasi di modul pembelajaran secara otomatis menerbitkan notifikasi capaian akademik.
4. Lonceng Antarmuka Pengguna & Panel Drawer Responsif:
   - Ikon lonceng di bilah navigasi atas dashboard dengan indikator badge angka belum dibaca berwarna kirmizi (#CB2957).
   - Panel drawer geser dengan tab penyaring: Semua, Belum Dibaca, Presensi, SPP, Akademik, dan Pengumuman.
   - Aksi cepat "Tandai Semua Dibaca" dan penandaan otomatis dibaca saat kartu notifikasi diklik.
   - Batasan kueri 50 notifikasi terbaru guna menjaga rendering drawer tetap instan dan ringan.
5. Pusat Siaran Pengumuman Administrator:
   - Formulir penerbitan pengumuman resmi dengan opsi audiens terarah (Semua, Siswa, Orang Tua, Tutor) dan opsi pin pengumuman penting.
   - Pengiriman payload siaran langsung yang memicu pembaruan lonceng dan invalidasi kueri data TanStack Query seketika di peramban penerima tanpa perlu reload halaman.

---

## User Stories

### Administrator
1. As an Administrator, I want to receive real-time notifications when a new student registration is submitted, so that I can promptly review and verify the applicant.
2. As an Administrator, I want to receive real-time notifications when a parent uploads a tuition payment proof, so that I can inspect the receipt and verify the transaction quickly.
3. As an Administrator, I want to broadcast official announcements to all active users simultaneously, so that critical operational information is communicated immediately.
4. As an Administrator, I want to target announcements specifically to Students, Parents, or Tutors, so that relevant groups receive tailored announcements without spamming other roles.
5. As an Administrator, I want to mark all unread notifications as read with a single click, so that I can maintain a clean and uncluttered notification panel.
6. As an Administrator, I want to filter my notification stream by category (Registration, Billing, Attendance, Announcement), so that I can focus on operational priorities.

### Tutor
7. As a Tutor, I want to receive instant notifications when an official announcement is broadcast by administration, so that I remain aware of schedule adjustments and institution policies.
8. As a Tutor, I want to receive notifications when a student in my class has their enrollment confirmed or updated, so that I can prepare my teaching sessions accordingly.
9. As a Tutor, I want my session attendance submission to reliably trigger parent notifications for absent students without requiring manual messaging, so that my administrative burden is minimized.
10. As a Tutor, I want clicking a notification to route me directly to the relevant resource (e.g. teaching schedule or class roster), so that I can save time navigating the dashboard.
11. As a Tutor, I want to see an unread badge count on the top navigation bell icon, so that I never miss critical administrative announcements.

### Siswa (Student)
12. As a Student, I want to receive real-time notifications when my monthly tuition payment is verified as paid, so that I have certainty that my enrollment is secure.
13. As a Student, I want to receive immediate notifications when a payment proof is rejected with a clear explanation, so that I or my parents can re-upload a valid proof.
14. As a Student, I want to receive notifications when new learning modules or quiz scores are published for my class, so that I can access study materials and review my performance promptly.
15. As a Student, I want to receive an attendance alert if I am marked absent (Alpa), so that I am aware of my attendance record and can clarify any discrepancies.
16. As a Student, I want to filter my notifications by 'Belum Dibaca' or 'Akademik', so that I can quickly find study materials and evaluation notices.
17. As a Student, I never want to see internal administrative notifications (such as registration approvals of other students), so that my privacy and focus are maintained.

### Orang Tua / Wali (Parent)
18. As a Parent, I want to receive immediate real-time notifications when my child is marked Alpa (unexcused absence) in a tutoring session, so that I can monitor my child's whereabouts and safety.
19. As a Parent, I want to receive immediate notifications when my tuition payment receipt is verified and published, so that I can view and download the official payment receipt.
20. As a Parent, I want to receive instant notifications if my uploaded payment receipt is rejected along with the specific rejection reason, so that I can take corrective action immediately.
21. As a Parent, I want to receive notifications when a new evaluation report or Try Out score is released for my child, so that I can support their academic progress.
22. As a Parent with multiple children enrolled (multi-child), I want each notification to clearly identify which child it pertains to, so that there is zero confusion between siblings.
23. As a Parent, I want to click any notification in the bell drawer and be navigated directly to the corresponding child portal tab (e.g. attendance history, report card, or invoices), so that I can review details effortlessly.
24. As a Parent, I want to receive official institution announcements regarding holiday closures and exam schedules directly in my bell drawer, so that I can plan family schedules accordingly.

### Sistem & Keandalan (System & Reliability)
25. As a System, I want WebSocket channel subscriptions to be automatically cleaned up whenever dashboard layouts unmount, so that connection leaks and resource exhaustion are prevented.
26. As a System, I want incoming notification events to trigger granular TanStack Query cache invalidations, so that data tables update reactively without requiring a full page refresh.
27. As a System, I want notification payloads to be idempotent and ignore duplicate IDs, so that rapid event bursts do not corrupt UI state or display repeated entries.
28. As a System, I want queries for user notifications to be capped at the 50 most recent items, so that database queries and DOM rendering remain performant regardless of user account age.

---

## Implementation Decisions

### Realtime Transport & Database Architecture
- Utilize Supabase Realtime channels running over WebSockets directly to Supabase PostgreSQL, bypassing serverless function execution limits.
- Enable Supabase Realtime publication on the notifications table for INSERT and UPDATE operations.
- Establish dual-channel topology per connected user:
  1. Personal Channel: user-notifications:${userId} receiving PostgreSQL CDC inserts filtered by user_id and directed broadcast events.
  2. Public Announcement Channel: broadcast:announcements receiving general broadcast payloads intended for broad audience distribution without row-by-row table explosion.

### Data Schema & Semantic Categories
- Notification entity attributes include:
  - id: UUID primary key.
  - userId: UUID referencing the user profile.
  - title: Text summary of the event.
  - message: Descriptive body text detailing the context.
  - type: Semantic category string restricted to attendance, billing, academic, announcement, registration, or general.
  - isRead: Boolean flag defaulting to false.
  - linkUrl: Optional string containing the client route path for deep linking.
  - metadata: JSONB field containing contextual references (sessionId, studentId, parentId, invoiceId, receiptNumber, targetAudience).
  - createdAt: Timestamp with timezone defaulting to current timestamp.

### Server-Side Trigger Alignment
- In the billing service, payment verification mutations and payment proof rejections atomically insert notification records for the associated student and parent profiles.
- In the attendance service, session finalization transactions that contain student entries marked as Alpa atomically insert attendance warning notifications targeted to the student and their registered parent.
- In the learning evaluation service, creation of new grade records automatically inserts academic notifications linking to the student report card route.
- In the announcement administration interface, publishing an announcement issues a realtime broadcast message carrying the announcement payload to the broadcast:announcements channel.

### Deterministic Lifecycle Governance
- Custom React notification hook encapsulates channel subscription and exposes unread count, notification list, markAsRead, and markAllAsRead handlers.
- Component unmount deterministically triggers channel unsubscription and removal from the Supabase client instance, preventing memory leaks and orphaned listeners.
- Realtime notification receipt triggers targeted query key invalidations in TanStack Query (e.g. invalidating attendance cache on attendance notifications, invoice cache on billing notifications).

### UI Presentation & Design Compliance
- Navigation bell icon positioned in the top application header with a high-contrast badge in scarlet red (#CB2957) displaying the count of unread notifications.
- Accessible slide-over drawer powered by Base UI Dialog component with backdrop blur and smooth sliding animation.
- Semantic category tabs allowing instant filtering between all, unread, attendance, billing, academic, and announcement notices.
- Individual notification items display clear semantic status icons, bold unread typography, timestamp formatting, and hover state transitions.
- Interactive click handler marks the target notification as read and navigates to the associated deep link when provided.
- Global "Tandai Semua Dibaca" button to acknowledge all visible unread items in a single action.
- Zero fake buttons and strict adherence to the project typography (Archivo for headings, Instrument Sans for body text).
- Strict adherence to the Zero Emojis rule across all notification messages, UI copy, and system logs.

### Performance & Retention Boundaries
- Notification queries enforce an upper limit of the 50 most recent records per user ordered by creation timestamp descending.
- In-memory event deduplication ensures duplicate event IDs arriving within short windows are discarded without UI jitter.

---

## Testing Decisions

### Seam Architecture
- Primary Testing Seam: Realtime Hook & Notification Store Engine Interface (useRealtimeNotifications + setupRealtimeNotifications + adminStore notification subsystem).
- Testing at this interface verifies the end-to-end integration of schema definitions, WebSocket channel subscriptions, deduplication, role-based filtering, and TanStack Query cache invalidations without requiring full browser DOM rendering.
- Secondary Testing Seam: Server Service Integration (attendanceService, billingService, learningService).
- Testing at this seam verifies that database mutations atomically generate corresponding notification records in Supabase PostgreSQL tables.

### Quality Characteristics of Tests
- Tests verify observable behavior, realtime channel subscription lifecycles, and cache invalidation side effects.
- Tests assert zero connection leaks by confirming client.removeChannel is called upon unmount.
- Tests assert strict role filtering to guarantee students and parents never see unauthorized administrative notifications.
- Tests assert idempotency during rapid burst event scenarios.
- All test suites must achieve a 100% pass rate under vitest alongside passing tsc --noEmit.

### Prior Art
- src/lib/__tests__/notifications-realtime-persistence.test.ts (Realtime hook lifecycle, store persistence, and event triggers).
- src/lib/__tests__/realtime-notifications.test.ts (Channel subscription and broadcast handling).
- src/lib/__tests__/notifications-realtime-store.test.ts (Role-based notification filtering and mark-as-read mutations).
- src/server/services/__tests__/billing.service.test.ts (Billing notification persistence during payment verification).

---

## Out of Scope

- Native Web Push API or Mobile Push Notifications via Firebase Cloud Messaging / Apple Push Notification service (system scope is strictly in-app notification bell per PRD section 4.6).
- WhatsApp Gateway or SMS Gateway notification delivery (external third-party messaging is excluded).
- Email digest or transactional email notifications for unread alerts.
- End-user customizable notification preference matrix (toggles for turning individual notification categories on/off).

---

## Further Notes

- Database table notifications and publication supabase_realtime are already defined and verified in Supabase PostgreSQL.
- The DashboardShell component provides CSR-safe rendering (ssr: false) in compliance with TanStack Start dashboard guidelines in AGENTS.md.
- Follows the high-contrast aesthetic guidelines defined in DESIGN.md with neutral borders and scarlet accent accents.