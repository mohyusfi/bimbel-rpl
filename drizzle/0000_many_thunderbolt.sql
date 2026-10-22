CREATE TYPE "public"."user_role" AS ENUM('admin', 'tutor', 'student', 'parent');--> statement-breakpoint
CREATE TYPE "public"."grade_level" AS ENUM('SD', 'SMP', 'SMA', 'ALUMNI');--> statement-breakpoint
CREATE TYPE "public"."package_code" AS ENUM('UTBK', 'SMA', 'SMP', 'SD');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('aktif', 'nonaktif');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('menunggu', 'terverifikasi', 'ditolak');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"phone_number" varchar(50),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "parents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"occupation" varchar(255),
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parents_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"parent_id" uuid,
	"nis" varchar(50) NOT NULL,
	"origin_school" varchar(255) NOT NULL,
	"grade_level" "grade_level" NOT NULL,
	"package_code" "package_code" NOT NULL,
	"status" "student_status" DEFAULT 'aktif' NOT NULL,
	"class_id" uuid,
	"join_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_profile_id_unique" UNIQUE("profile_id"),
	CONSTRAINT "students_nis_unique" UNIQUE("nis")
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_name" varchar(255) NOT NULL,
	"student_email" varchar(255) NOT NULL,
	"student_phone" varchar(50) NOT NULL,
	"student_school" varchar(255) NOT NULL,
	"package_code" "package_code" NOT NULL,
	"package_name" varchar(255) NOT NULL,
	"parent_name" varchar(255) NOT NULL,
	"parent_email" varchar(255),
	"parent_phone" varchar(50) NOT NULL,
	"parent_job" varchar(255),
	"parent_address" text,
	"status" "registration_status" DEFAULT 'menunggu' NOT NULL,
	"rejected_reason" text,
	"assigned_class_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parents" ADD CONSTRAINT "parents_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "parents_profile_id_idx" ON "parents" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "students_profile_id_idx" ON "students" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "students_parent_id_idx" ON "students" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "students_nis_idx" ON "students" USING btree ("nis");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("status");--> statement-breakpoint
CREATE INDEX "registrations_student_email_idx" ON "registrations" USING btree ("student_email");--> statement-breakpoint
CREATE INDEX "registrations_status_idx" ON "registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "registrations_created_at_idx" ON "registrations" USING btree ("created_at");