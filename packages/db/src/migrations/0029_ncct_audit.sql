CREATE TABLE "ncct_audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"institution_id" uuid,
	"actor_profile_id" uuid,
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ncct_audit_event" ADD CONSTRAINT "ncct_audit_event_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_audit_event" ADD CONSTRAINT "ncct_audit_event_actor_profile_id_fkey" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ncct_audit_event_org_created" ON "ncct_audit_event" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ncct_audit_event_entity" ON "ncct_audit_event" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_audit_event_action" ON "ncct_audit_event" USING btree ("action");