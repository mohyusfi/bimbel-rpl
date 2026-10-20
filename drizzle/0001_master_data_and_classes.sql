CREATE TABLE IF NOT EXISTS "tutors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"specialty_subject" text,
	"education_background" text,
	"weekly_sessions_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tutors_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_name" text NOT NULL,
	"capacity" integer DEFAULT 12 NOT NULL,
	"facilities" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_code" text NOT NULL,
	"course_name" text NOT NULL,
	"price" numeric NOT NULL,
	"description" text,
	"max_students" integer DEFAULT 12 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid,
	"tutor_id" uuid,
	"class_name" text NOT NULL,
	"academic_year" text,
	"capacity" integer DEFAULT 12 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "class_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "is_super_admin" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'aktif' NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tutors_profile_id_profiles_id_fk') THEN
    ALTER TABLE "tutors" ADD CONSTRAINT "tutors_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_course_id_courses_id_fk') THEN
    ALTER TABLE "classes" ADD CONSTRAINT "classes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_tutor_id_tutors_id_fk') THEN
    ALTER TABLE "classes" ADD CONSTRAINT "classes_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_members_class_id_classes_id_fk') THEN
    ALTER TABLE "class_members" ADD CONSTRAINT "class_members_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_members_student_id_students_id_fk') THEN
    ALTER TABLE "class_members" ADD CONSTRAINT "class_members_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutors_profile_id_idx" ON "tutors" USING btree ("profile_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tutors_status_idx" ON "tutors" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rooms_room_name_idx" ON "rooms" USING btree ("room_name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rooms_is_active_idx" ON "rooms" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courses_course_code_idx" ON "courses" USING btree ("course_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_course_id_idx" ON "classes" USING btree ("course_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classes_tutor_id_idx" ON "classes" USING btree ("tutor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_members_class_id_idx" ON "class_members" USING btree ("class_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_members_student_id_idx" ON "class_members" USING btree ("student_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "class_members_class_student_unique" ON "class_members" USING btree ("class_id","student_id");
--> statement-breakpoint
ALTER TABLE "tutors" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "class_members" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "Tutors are readable by authenticated users" ON "tutors";
CREATE POLICY "Tutors are readable by authenticated users" ON "tutors" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage tutors" ON "tutors";
CREATE POLICY "Admins can manage tutors" ON "tutors" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Tutors can update their own row" ON "tutors";
CREATE POLICY "Tutors can update their own row" ON "tutors" FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = profile_id) WITH CHECK ((SELECT auth.uid()) = profile_id);
--> statement-breakpoint
DROP POLICY IF EXISTS "Rooms are readable by authenticated users" ON "rooms";
CREATE POLICY "Rooms are readable by authenticated users" ON "rooms" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage rooms" ON "rooms";
CREATE POLICY "Admins can manage rooms" ON "rooms" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Courses are readable by all" ON "courses";
CREATE POLICY "Courses are readable by all" ON "courses" FOR SELECT TO public USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage courses" ON "courses";
CREATE POLICY "Admins can manage courses" ON "courses" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Classes are readable by authenticated users" ON "classes";
CREATE POLICY "Classes are readable by authenticated users" ON "classes" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage classes" ON "classes";
CREATE POLICY "Admins can manage classes" ON "classes" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Class members are readable by authenticated users" ON "class_members";
CREATE POLICY "Class members are readable by authenticated users" ON "class_members" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage class members" ON "class_members";
CREATE POLICY "Admins can manage class members" ON "class_members" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
