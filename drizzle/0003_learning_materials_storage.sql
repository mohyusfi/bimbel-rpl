CREATE TABLE IF NOT EXISTS "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"tutor_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'Modul Teori' NOT NULL,
	"file_type" text NOT NULL,
	"file_size" text,
	"file_url" text NOT NULL,
	"storage_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'materials_class_id_classes_id_fk') THEN
    ALTER TABLE "materials" ADD CONSTRAINT "materials_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'materials_tutor_id_tutors_id_fk') THEN
    ALTER TABLE "materials" ADD CONSTRAINT "materials_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "materials_class_id_idx" ON "materials" USING btree ("class_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "materials_tutor_id_idx" ON "materials" USING btree ("tutor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "materials_category_idx" ON "materials" USING btree ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "materials_created_at_idx" ON "materials" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "Materials are readable by authenticated users" ON "materials";
CREATE POLICY "Materials are readable by authenticated users" ON "materials" FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage materials" ON "materials";
CREATE POLICY "Admins can manage materials" ON "materials" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Tutors can manage materials for their classes" ON "materials";
CREATE POLICY "Tutors can manage materials for their classes" ON "materials" FOR ALL TO authenticated USING (tutor_id IN (SELECT id FROM public.tutors WHERE profile_id = (SELECT auth.uid()))) WITH CHECK (tutor_id IN (SELECT id FROM public.tutors WHERE profile_id = (SELECT auth.uid())));
--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'learning-materials',
  'learning-materials',
  true,
  20971520,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
--> statement-breakpoint
DROP POLICY IF EXISTS "Allow public read of buckets" ON storage.buckets;
CREATE POLICY "Allow public read of buckets" ON storage.buckets FOR SELECT USING (true);
--> statement-breakpoint
DROP POLICY IF EXISTS "Public access to learning materials" ON storage.objects;
CREATE POLICY "Public access to learning materials" ON storage.objects FOR SELECT USING (bucket_id = 'learning-materials');
--> statement-breakpoint
DROP POLICY IF EXISTS "Tutors and admins can upload learning materials" ON storage.objects;
CREATE POLICY "Tutors and admins can upload learning materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'learning-materials' AND (
    is_admin() OR EXISTS (SELECT 1 FROM public.tutors WHERE profile_id = (SELECT auth.uid()))
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS "Tutors and admins can update learning materials" ON storage.objects;
CREATE POLICY "Tutors and admins can update learning materials" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'learning-materials' AND (
    is_admin() OR EXISTS (SELECT 1 FROM public.tutors WHERE profile_id = (SELECT auth.uid()))
  )
) WITH CHECK (
  bucket_id = 'learning-materials' AND (
    is_admin() OR EXISTS (SELECT 1 FROM public.tutors WHERE profile_id = (SELECT auth.uid()))
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS "Tutors and admins can delete learning materials" ON storage.objects;
CREATE POLICY "Tutors and admins can delete learning materials" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'learning-materials' AND (
    is_admin() OR EXISTS (SELECT 1 FROM public.tutors WHERE profile_id = (SELECT auth.uid()))
  )
);
