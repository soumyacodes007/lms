CREATE TYPE "public"."NCCT_PROGRESS_STATUS" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "ncct_enrollment_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"programme_step_id" uuid NOT NULL,
	"status" "NCCT_PROGRESS_STATUS" DEFAULT 'NOT_STARTED' NOT NULL,
	"score" integer,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ncct_enrollment_progress_enrollment_step_key" UNIQUE("enrollment_id","programme_step_id")
);
--> statement-breakpoint
ALTER TABLE "ncct_enrollment_progress" ADD CONSTRAINT "ncct_enrollment_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."ncct_enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_enrollment_progress" ADD CONSTRAINT "ncct_enrollment_progress_programme_step_id_fkey" FOREIGN KEY ("programme_step_id") REFERENCES "public"."ncct_programme_step"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ncct_enrollment_progress_enrollment" ON "ncct_enrollment_progress" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_enrollment_progress_step" ON "ncct_enrollment_progress" USING btree ("programme_step_id");