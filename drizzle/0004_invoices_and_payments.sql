CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"amount" numeric NOT NULL,
	"description" text NOT NULL,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'belum_dibayar' NOT NULL,
	"rejected_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount_paid" numeric NOT NULL,
	"proof_file_url" text NOT NULL,
	"storage_path" text,
	"bank_name" text,
	"payment_method" text,
	"payment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"receipt_number" text,
	"submitted_by_role" text,
	"submitted_by_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_student_id_students_id_fk') THEN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_invoice_id_invoices_id_fk') THEN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_verified_by_profiles_id_fk') THEN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_student_id_idx" ON "invoices" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_due_date_idx" ON "invoices" USING btree ("due_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_created_at_idx" ON "invoices" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_invoice_id_idx" ON "payments" USING btree ("invoice_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_verified_by_idx" ON "payments" USING btree ("verified_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_receipt_number_idx" ON "payments" USING btree ("receipt_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_payment_date_idx" ON "payments" USING btree ("payment_date");
--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage invoices" ON "invoices";
CREATE POLICY "Admins can manage invoices" ON "invoices" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Students can view own invoices" ON "invoices";
CREATE POLICY "Students can view own invoices" ON "invoices" FOR SELECT TO authenticated USING (
  student_id IN (SELECT id FROM public.students WHERE profile_id = (SELECT auth.uid()))
);
--> statement-breakpoint
DROP POLICY IF EXISTS "Parents can view their children invoices" ON "invoices";
CREATE POLICY "Parents can view their children invoices" ON "invoices" FOR SELECT TO authenticated USING (
  student_id IN (
    SELECT id FROM public.students WHERE parent_id IN (
      SELECT id FROM public.parents WHERE profile_id = (SELECT auth.uid())
    )
  )
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins can manage payments" ON "payments";
CREATE POLICY "Admins can manage payments" ON "payments" FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Users can view payments for their accessible invoices" ON "payments";
CREATE POLICY "Users can view payments for their accessible invoices" ON "payments" FOR SELECT TO authenticated USING (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE student_id IN (
      SELECT id FROM public.students WHERE profile_id = (SELECT auth.uid())
      OR parent_id IN (SELECT id FROM public.parents WHERE profile_id = (SELECT auth.uid()))
    )
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS "Users can create payments for their accessible invoices" ON "payments";
CREATE POLICY "Users can create payments for their accessible invoices" ON "payments" FOR INSERT TO authenticated WITH CHECK (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE student_id IN (
      SELECT id FROM public.students WHERE profile_id = (SELECT auth.uid())
      OR parent_id IN (SELECT id FROM public.parents WHERE profile_id = (SELECT auth.uid()))
    )
  )
);
--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins have full access to receipts" ON storage.objects;
CREATE POLICY "Admins have full access to receipts" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'receipts' AND is_admin()
) WITH CHECK (
  bucket_id = 'receipts' AND is_admin()
);
--> statement-breakpoint
DROP POLICY IF EXISTS "Authenticated users can upload payment receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'receipts'
);
--> statement-breakpoint
DROP POLICY IF EXISTS "Authenticated users can read payment receipts" ON storage.objects;
CREATE POLICY "Authenticated users can read payment receipts" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'receipts'
);
