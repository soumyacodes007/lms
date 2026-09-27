CREATE TABLE "ncct_job_application_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "NCCT_APPLICATION_STATUS",
	"to_status" "NCCT_APPLICATION_STATUS" NOT NULL,
	"note" text,
	"changed_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ncct_job_application_event" ADD CONSTRAINT "ncct_job_application_event_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."ncct_job_application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_job_application_event" ADD CONSTRAINT "ncct_job_application_event_changed_by_fkey" FOREIGN KEY ("changed_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ncct_job_application_event_application" ON "ncct_job_application_event" USING btree ("application_id","created_at");