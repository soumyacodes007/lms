CREATE TYPE "public"."NCCT_RESOURCE_TYPE" AS ENUM('ROOM', 'HOSTEL', 'MEAL', 'TRANSPORT', 'EQUIPMENT');--> statement-breakpoint
CREATE TYPE "public"."NCCT_SYNC_EVENT_STATUS" AS ENUM('RECEIVED', 'ACKNOWLEDGED', 'CONFLICT', 'REJECTED');--> statement-breakpoint
CREATE TABLE "ncct_resource" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"type" "NCCT_RESOURCE_TYPE" NOT NULL,
	"name" varchar NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncct_resource_booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncct_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"title" varchar NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"room" varchar,
	"instructor_profile_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncct_sync_device" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"institution_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"last_seen_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ncct_sync_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"event_id" varchar NOT NULL,
	"event_type" varchar NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "NCCT_SYNC_EVENT_STATUS" DEFAULT 'RECEIVED' NOT NULL,
	"error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "ncct_sync_event_event_id_key" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "ncct_trainee_logistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"trainee_id" uuid NOT NULL,
	"hostel_resource_id" uuid,
	"meal_required" boolean DEFAULT false NOT NULL,
	"transport_required" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ncct_trainee_logistics_batch_trainee_key" UNIQUE("batch_id","trainee_id")
);
--> statement-breakpoint
ALTER TABLE "ncct_resource" ADD CONSTRAINT "ncct_resource_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."ncct_institution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_resource_booking" ADD CONSTRAINT "ncct_resource_booking_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."ncct_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_resource_booking" ADD CONSTRAINT "ncct_resource_booking_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."ncct_resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_session" ADD CONSTRAINT "ncct_session_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."ncct_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_session" ADD CONSTRAINT "ncct_session_instructor_profile_id_fkey" FOREIGN KEY ("instructor_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_sync_device" ADD CONSTRAINT "ncct_sync_device_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_sync_device" ADD CONSTRAINT "ncct_sync_device_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."ncct_institution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_sync_event" ADD CONSTRAINT "ncct_sync_event_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."ncct_sync_device"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_trainee_logistics" ADD CONSTRAINT "ncct_trainee_logistics_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."ncct_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_trainee_logistics" ADD CONSTRAINT "ncct_trainee_logistics_trainee_id_fkey" FOREIGN KEY ("trainee_id") REFERENCES "public"."ncct_trainee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ncct_trainee_logistics" ADD CONSTRAINT "ncct_trainee_logistics_hostel_resource_id_fkey" FOREIGN KEY ("hostel_resource_id") REFERENCES "public"."ncct_resource"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ncct_resource_institution_type" ON "ncct_resource" USING btree ("institution_id","type");--> statement-breakpoint
CREATE INDEX "idx_ncct_resource_booking_resource_time" ON "ncct_resource_booking" USING btree ("resource_id","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "idx_ncct_session_batch_start" ON "ncct_session" USING btree ("batch_id","starts_at");--> statement-breakpoint
CREATE INDEX "idx_ncct_session_instructor_start" ON "ncct_session" USING btree ("instructor_profile_id","starts_at");--> statement-breakpoint
CREATE INDEX "idx_ncct_sync_device_org" ON "ncct_sync_device" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ncct_sync_event_device_status" ON "ncct_sync_event" USING btree ("device_id","status");