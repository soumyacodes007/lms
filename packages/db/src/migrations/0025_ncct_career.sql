CREATE TYPE "public"."NCCT_CAREER_MESSAGE_ROLE" AS ENUM('USER', 'ASSISTANT');--> statement-breakpoint
CREATE TABLE "ncct_career_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainee_id" uuid NOT NULL,
	"role" "NCCT_CAREER_MESSAGE_ROLE" NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ncct_career_message" ADD CONSTRAINT "ncct_career_message_trainee_id_fkey" FOREIGN KEY ("trainee_id") REFERENCES "public"."ncct_trainee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ncct_career_message_trainee" ON "ncct_career_message" USING btree ("trainee_id","created_at");