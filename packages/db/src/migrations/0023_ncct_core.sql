CREATE TYPE "public"."CONTENT_REPORT_REASON" AS ENUM('spam', 'harassment', 'hate_speech', 'sexual_content', 'violence', 'misinformation', 'privacy', 'other');--> statement-breakpoint
CREATE TYPE "public"."CONTENT_REPORT_RESOLUTION_CODE" AS ENUM('removed', 'warned', 'restricted', 'no_action', 'duplicate');--> statement-breakpoint
CREATE TYPE "public"."CONTENT_REPORT_STATUS" AS ENUM('open', 'in_review', 'actioned', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."CONTENT_REPORT_TARGET_TYPE" AS ENUM('course_newsfeed_post', 'course_newsfeed_comment', 'cohort_newsfeed_post', 'cohort_newsfeed_comment', 'community_question', 'community_answer', 'lesson_comment', 'profile');--> statement-breakpoint
CREATE TYPE "public"."NCCT_APPLICATION_STATUS" AS ENUM('APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."NCCT_ASSESSMENT_STATUS" AS ENUM('SCHEDULED', 'SUBMITTED', 'PASSED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."NCCT_BATCH_STATUS" AS ENUM('DRAFT', 'OPEN', 'RUNNING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."NCCT_INSTITUTION_TYPE" AS ENUM('VAMNICOM', 'RICM', 'ICM', 'PACS', 'SHG', 'DAIRY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."NCCT_JOB_STATUS" AS ENUM('DRAFT', 'OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."NCCT_NOMINATION_STATUS" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."ORGANIZATION_MEMBER_EVENT_TYPE" AS ENUM('DEACTIVATED', 'REACTIVATED', 'ARCHIVED', 'UNARCHIVED', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."ORGANIZATION_MEMBER_STATUS" AS ENUM('ACTIVE', 'DEACTIVATED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "content_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"reporter_id" uuid,
	"target_type" "CONTENT_REPORT_TARGET_TYPE" NOT NULL,
	"target_id" text NOT NULL,
	"target_author_id" uuid,
	"reason" "CONTENT_REPORT_REASON" NOT NULL,
	"details" text,
	"status" "CONTENT_REPORT_STATUS" DEFAULT 'open' NOT NULL,
	"priority" integer DEFAULT 2 NOT NULL,
	"content_snapshot" jsonb NOT NULL,
	"assigned_to" uuid,
	"resolution_code" "CONTENT_REPORT_RESOLUTION_CODE",
	"resolution_note" text,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ncct_assessment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"trainee_id" uuid NOT NULL,
	"evaluator_profile_id" uuid,
	"title" varchar NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"score" integer,
	"status" "NCCT_ASSESSMENT_STATUS" DEFAULT 'SCHEDULED' NOT NULL,
	"feedback" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncct_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"institution_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"capacity" integer NOT NULL,
	"status" "NCCT_BATCH_STATUS" DEFAULT 'DRAFT' NOT NULL,
	"instructor_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncct_credential" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainee_id" uuid NOT NULL,
	"programme_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"certificate_number" varchar NOT NULL,
	"verification_token" varchar NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ncct_credential_number_key" UNIQUE("certificate_number"),
	CONSTRAINT "ncct_credential_token_key" UNIQUE("verification_token")
);
--> statement-breakpoint
CREATE TABLE "ncct_institution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"type" "NCCT_INSTITUTION_TYPE" DEFAULT 'OTHER' NOT NULL,
	"district" varchar NOT NULL,
	"state" varchar NOT NULL,
	"contact_email" varchar,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ncct_institution_org_code_key" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "ncct_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employer_name" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"location" varchar NOT NULL,
	"skills" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"status" "NCCT_JOB_STATUS" DEFAULT 'DRAFT' NOT NULL,
	"created_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncct_job_application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"trainee_id" uuid NOT NULL,
	"status" "NCCT_APPLICATION_STATUS" DEFAULT 'APPLIED' NOT NULL,
	"cover_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ncct_job_application_job_trainee_key" UNIQUE("job_id","trainee_id")
);
--> statement-breakpoint
CREATE TABLE "ncct_nomination" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"trainee_id" uuid NOT NULL,
	"nominated_by_profile_id" uuid,
	"status" "NCCT_NOMINATION_STATUS" DEFAULT 'PENDING' NOT NULL,
	"decision_by_profile_id" uuid,
	"decision_at" timestamp with time zone,
	"decision_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ncct_nomination_batch_trainee_key" UNIQUE("batch_id","trainee_id")
);
--> statement-breakpoint
CREATE TABLE "ncct_programme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"status" varchar DEFAULT 'DRAFT' NOT NULL,
	"language" varchar DEFAULT 'en' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncct_programme_step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"prerequisite_step_id" uuid,
	"required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ncct_programme_step_position_key" UNIQUE("programme_id","position")
);
--> statement-breakpoint
CREATE TABLE "ncct_trainee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"institution_id" uuid NOT NULL,
	"profile_id" uuid,
	"trainee_number" varchar NOT NULL,
	"cooperative_name" varchar,
	"district" varchar NOT NULL,
	"state" varchar NOT NULL,
	"phone" varchar,
	"skills" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ncct_trainee_org_number_key" UNIQUE("organization_id","trainee_number")
);
--> statement-breakpoint
CREATE TABLE "organization_member_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" bigint,
	"profile_id" uuid,
	"target_email" varchar,
	"event_type" "ORGANIZATION_MEMBER_EVENT_TYPE" NOT NULL,
	"actor_profile_id" uuid,
	"reason" text,
	"filter_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_section" ALTER COLUMN "order" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "course_section" ALTER COLUMN "order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise" ALTER COLUMN "order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson" ALTER COLUMN "order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "slides" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "organizationmember" ADD COLUMN "status" "ORGANIZATION_MEMBER_STATUS" DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizationmember" ADD COLUMN "status_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizationmember" ADD COLUMN "status_changed_by" uuid;--> statement-breakpoint
ALTER TABLE "organizationmember" ADD COLUMN "last_active_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_target_author_id_fkey" FOREIGN KEY ("target_author_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_assessment" ADD CONSTRAINT "ncct_assessment_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."ncct_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_assessment" ADD CONSTRAINT "ncct_assessment_trainee_id_fkey" FOREIGN KEY ("trainee_id") REFERENCES "public"."ncct_trainee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_assessment" ADD CONSTRAINT "ncct_assessment_evaluator_profile_id_fkey" FOREIGN KEY ("evaluator_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_batch" ADD CONSTRAINT "ncct_batch_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "public"."ncct_programme"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_batch" ADD CONSTRAINT "ncct_batch_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."ncct_institution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_batch" ADD CONSTRAINT "ncct_batch_instructor_profile_id_fkey" FOREIGN KEY ("instructor_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_credential" ADD CONSTRAINT "ncct_credential_trainee_id_fkey" FOREIGN KEY ("trainee_id") REFERENCES "public"."ncct_trainee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_credential" ADD CONSTRAINT "ncct_credential_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "public"."ncct_programme"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_credential" ADD CONSTRAINT "ncct_credential_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."ncct_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_institution" ADD CONSTRAINT "ncct_institution_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_job" ADD CONSTRAINT "ncct_job_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_job" ADD CONSTRAINT "ncct_job_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_job_application" ADD CONSTRAINT "ncct_job_application_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."ncct_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_job_application" ADD CONSTRAINT "ncct_job_application_trainee_id_fkey" FOREIGN KEY ("trainee_id") REFERENCES "public"."ncct_trainee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_nomination" ADD CONSTRAINT "ncct_nomination_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."ncct_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_nomination" ADD CONSTRAINT "ncct_nomination_trainee_id_fkey" FOREIGN KEY ("trainee_id") REFERENCES "public"."ncct_trainee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_nomination" ADD CONSTRAINT "ncct_nomination_nominated_by_fkey" FOREIGN KEY ("nominated_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_nomination" ADD CONSTRAINT "ncct_nomination_decision_by_fkey" FOREIGN KEY ("decision_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_programme" ADD CONSTRAINT "ncct_programme_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_programme_step" ADD CONSTRAINT "ncct_programme_step_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "public"."ncct_programme"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_programme_step" ADD CONSTRAINT "ncct_programme_step_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_programme_step" ADD CONSTRAINT "ncct_programme_step_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_step_id") REFERENCES "public"."ncct_programme_step"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_trainee" ADD CONSTRAINT "ncct_trainee_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_trainee" ADD CONSTRAINT "ncct_trainee_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."ncct_institution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_trainee" ADD CONSTRAINT "ncct_trainee_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member_audit" ADD CONSTRAINT "organization_member_audit_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member_audit" ADD CONSTRAINT "organization_member_audit_actor_profile_id_fkey" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_content_report_status_priority_created" ON "content_report" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "idx_content_report_org_created" ON "content_report" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_content_report_target" ON "content_report" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_report_reporter_target_open_unique" ON "content_report" USING btree ("organization_id","reporter_id","target_type","target_id") WHERE "content_report"."reporter_id" IS NOT NULL AND "content_report"."status" IN ('open', 'in_review');--> statement-breakpoint
CREATE INDEX "idx_ncct_assessment_batch" ON "ncct_assessment" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_assessment_evaluator" ON "ncct_assessment" USING btree ("evaluator_profile_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_batch_programme" ON "ncct_batch" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_batch_institution" ON "ncct_batch" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_batch_dates" ON "ncct_batch" USING btree ("starts_on","ends_on");--> statement-breakpoint
CREATE INDEX "idx_ncct_credential_trainee" ON "ncct_credential" USING btree ("trainee_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_institution_org" ON "ncct_institution" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_institution_region" ON "ncct_institution" USING btree ("state","district");--> statement-breakpoint
CREATE INDEX "idx_ncct_job_org_status" ON "ncct_job" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_ncct_job_application_status" ON "ncct_job_application" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ncct_nomination_status" ON "ncct_nomination" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ncct_programme_org" ON "ncct_programme" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_programme_status" ON "ncct_programme" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ncct_programme_step_programme" ON "ncct_programme_step" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_trainee_institution" ON "ncct_trainee" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_trainee_profile" ON "ncct_trainee" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_organization_member_audit_org_id" ON "organization_member_audit" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_member_audit_member_id" ON "organization_member_audit" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_organization_member_audit_profile_id" ON "organization_member_audit" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_organization_member_audit_event_type" ON "organization_member_audit" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_organization_member_audit_created_at" ON "organization_member_audit" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "organizationmember" ADD CONSTRAINT "organizationmember_status_changed_by_fkey" FOREIGN KEY ("status_changed_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orgmember_org_role_status" ON "organizationmember" USING btree ("organization_id","role_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgmember_org_last_active" ON "organizationmember" USING btree ("organization_id","last_active_at");