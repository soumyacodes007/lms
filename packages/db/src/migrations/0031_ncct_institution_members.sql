CREATE TYPE "public"."NCCT_INSTITUTION_MEMBER_ROLE" AS ENUM('COORDINATOR', 'INSTRUCTOR', 'EVALUATOR');--> statement-breakpoint
CREATE TABLE "ncct_institution_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" "NCCT_INSTITUTION_MEMBER_ROLE" DEFAULT 'COORDINATOR' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ncct_institution_member_unique" UNIQUE("institution_id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "ncct_institution_member" ADD CONSTRAINT "ncct_institution_member_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."ncct_institution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_institution_member" ADD CONSTRAINT "ncct_institution_member_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ncct_institution_member_profile" ON "ncct_institution_member" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_institution_member_institution" ON "ncct_institution_member" USING btree ("institution_id");