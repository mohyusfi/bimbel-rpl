CREATE TABLE IF NOT EXISTS "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"subject_name" text DEFAULT 'Sesi Bimbingan',
	"tutor_id" uuid,
	"room_id" uuid,
	"day_of_week" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid,
	"class_id" uuid NOT NULL,
	"tutor_id" uuid,
	"room_id" uuid,
	"session_date" date NOT NULL,
	"topic" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" text DEFAULT 'hadir' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_class_id_classes_id_fk') THEN
    ALTER TABLE "schedules" ADD CONSTRAINT "schedules_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_tutor_id_tutors_id_fk') THEN
    ALTER TABLE "schedules" ADD CONSTRAINT "schedules_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_room_id_rooms_id_fk') THEN
    ALTER TABLE "schedules" ADD CONSTRAINT "schedules_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_schedule_id_schedules_id_fk') THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_class_id_classes_id_fk') THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_tutor_id_tutors_id_fk') THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_room_id_rooms_id_fk') THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendances_session_id_sessions_id_fk') THEN
    ALTER TABLE "attendances" ADD CONSTRAINT "attendances_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendances_student_id_students_id_fk') THEN
    ALTER TABLE "attendances" ADD CONSTRAINT "attendances_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_class_id_idx" ON "schedules" USING btree ("class_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_tutor_id_idx" ON "schedules" USING btree ("tutor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_room_id_idx" ON "schedules" USING btree ("room_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_day_of_week_idx" ON "schedules" USING btree ("day_of_week");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_schedule_id_idx" ON "sessions" USING btree ("schedule_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_class_id_idx" ON "sessions" USING btree ("class_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_tutor_id_idx" ON "sessions" USING btree ("tutor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_room_id_idx" ON "sessions" USING btree ("room_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_session_date_idx" ON "sessions" USING btree ("session_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendances_session_id_idx" ON "attendances" USING btree ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendances_student_id_idx" ON "attendances" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendances_status_idx" ON "attendances" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attendances_session_student_unique" ON "attendances" USING btree ("session_id","student_id");
--> statement-breakpoint
ALTER TABLE "schedules" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "attendances" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "Schedules are readable by authenticated users" ON "schedules";
CREATE POLICY "Schedules are readable by authenticated users" ON "schedules" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage schedules" ON "schedules";
CREATE POLICY "Admins can manage schedules" ON "schedules" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Sessions are readable by authenticated users" ON "sessions";
CREATE POLICY "Sessions are readable by authenticated users" ON "sessions" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage sessions" ON "sessions";
CREATE POLICY "Admins can manage sessions" ON "sessions" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Tutors can update their assigned sessions" ON "sessions";
CREATE POLICY "Tutors can update their assigned sessions" ON "sessions" FOR UPDATE TO authenticated USING (tutor_id IN (SELECT id FROM public.tutors WHERE profile_id = (SELECT auth.uid()))) WITH CHECK (tutor_id IN (SELECT id FROM public.tutors WHERE profile_id = (SELECT auth.uid())));
--> statement-breakpoint
DROP POLICY IF EXISTS "Attendances are readable by authenticated users" ON "attendances";
CREATE POLICY "Attendances are readable by authenticated users" ON "attendances" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage attendances" ON "attendances";
CREATE POLICY "Admins can manage attendances" ON "attendances" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Tutors can manage attendances for their sessions" ON "attendances";
CREATE POLICY "Tutors can manage attendances for their sessions" ON "attendances" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.sessions s JOIN public.tutors t ON s.tutor_id = t.id WHERE s.id = attendances.session_id AND t.profile_id = (SELECT auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.sessions s JOIN public.tutors t ON s.tutor_id = t.id WHERE s.id = attendances.session_id AND t.profile_id = (SELECT auth.uid())));
