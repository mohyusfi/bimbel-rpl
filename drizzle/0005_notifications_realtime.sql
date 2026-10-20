CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"link_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_profiles_id_fk') THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" USING btree ("is_read");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" USING btree ("type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "Users can read own notifications" ON "notifications";
CREATE POLICY "Users can read own notifications" ON "notifications" FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Users can update own notifications" ON "notifications";
CREATE POLICY "Users can update own notifications" ON "notifications" FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()) OR is_admin()) WITH CHECK (user_id = (SELECT auth.uid()) OR is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Admins and tutors can insert notifications" ON "notifications";
CREATE POLICY "Admins and tutors can insert notifications" ON "notifications" FOR INSERT TO authenticated WITH CHECK (true);
--> statement-breakpoint
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
