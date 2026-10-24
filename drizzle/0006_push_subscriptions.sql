CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL UNIQUE,
	"keys" jsonb NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_id_profiles_id_fk') THEN
    ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "Users can read own push subscriptions" ON "push_subscriptions";
CREATE POLICY "Users can read own push subscriptions" ON "push_subscriptions" FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON "push_subscriptions";
CREATE POLICY "Users can insert own push subscriptions" ON "push_subscriptions" FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) OR is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON "push_subscriptions";
CREATE POLICY "Users can update own push subscriptions" ON "push_subscriptions" FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()) OR is_admin()) WITH CHECK (user_id = (SELECT auth.uid()) OR is_admin());
--> statement-breakpoint
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON "push_subscriptions";
CREATE POLICY "Users can delete own push subscriptions" ON "push_subscriptions" FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()) OR is_admin());
