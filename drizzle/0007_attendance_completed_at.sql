-- 0007: Pengerasan presensi — kolom completed_at (basis Grace Period 2 jam)
--       dan kebijakan hapus notifikasi untuk admin (dedup notifikasi presensi).

ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "sessions" SET "completed_at" = "created_at" WHERE "is_completed" = true AND "completed_at" IS NULL;
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can delete notifications" ON "notifications";
CREATE POLICY "Admins can delete notifications" ON "notifications" FOR DELETE TO authenticated USING (is_admin());
