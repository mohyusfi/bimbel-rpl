-- 0008: Composite Performance Indexes untuk Query Berat & Kritis
-- Menambahkan index komposit tanpa mengubah struktur kolom atau tabel yang ada.

-- 1. Anti-bentrok jadwal (SCHED-02): Filter WHERE room_id = ? AND day_of_week = ?
CREATE INDEX IF NOT EXISTS "schedules_room_day_idx" ON "schedules" USING btree ("room_id", "day_of_week");
--> statement-breakpoint

-- 2. Anti-bentrok jadwal (SCHED-02): Filter WHERE tutor_id = ? AND day_of_week = ?
CREATE INDEX IF NOT EXISTS "schedules_tutor_day_idx" ON "schedules" USING btree ("tutor_id", "day_of_week");
--> statement-breakpoint

-- 3. Sesi & Presensi Harian: Filter WHERE class_id = ? AND is_completed = ? ORDER BY session_date
CREATE INDEX IF NOT EXISTS "sessions_class_completed_date_idx" ON "sessions" USING btree ("class_id", "is_completed", "session_date");
--> statement-breakpoint

-- 4. Sesi Tutor Harian: Filter WHERE tutor_id = ? ORDER BY session_date
CREATE INDEX IF NOT EXISTS "sessions_tutor_date_idx" ON "sessions" USING btree ("tutor_id", "session_date");
--> statement-breakpoint

-- 5. Realtime Notification Badge: Filter WHERE user_id = ? AND is_read = false ORDER BY created_at
CREATE INDEX IF NOT EXISTS "notifications_user_unread_created_idx" ON "notifications" USING btree ("user_id", "is_read", "created_at");
--> statement-breakpoint

-- 6. Verifikasi Asesmen Kelas: Filter WHERE class_id = ? AND assessment_title = ?
CREATE INDEX IF NOT EXISTS "grades_class_assessment_title_idx" ON "grades" USING btree ("class_id", "assessment_title");
--> statement-breakpoint

-- 7. Filter Tagihan Siswa & Wali: Filter WHERE student_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS "invoices_student_status_idx" ON "invoices" USING btree ("student_id", "status");
