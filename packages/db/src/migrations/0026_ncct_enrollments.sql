CREATE TYPE "public"."NCCT_ENROLLMENT_STATUS" AS ENUM('ENROLLED', 'COMPLETED', 'WITHDRAWN');--> statement-breakpoint
CREATE TABLE "ncct_enrollment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"trainee_id" uuid NOT NULL,
	"status" "NCCT_ENROLLMENT_STATUS" DEFAULT 'ENROLLED' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ncct_enrollment_batch_trainee_key" UNIQUE("batch_id","trainee_id")
);
--> statement-breakpoint
ALTER TABLE "ncct_enrollment" ADD CONSTRAINT "ncct_enrollment_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."ncct_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_enrollment" ADD CONSTRAINT "ncct_enrollment_trainee_id_fkey" FOREIGN KEY ("trainee_id") REFERENCES "public"."ncct_trainee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ncct_enrollment_batch_status" ON "ncct_enrollment" USING btree ("batch_id","status");--> statement-breakpoint
CREATE INDEX "idx_ncct_enrollment_trainee" ON "ncct_enrollment" USING btree ("trainee_id");