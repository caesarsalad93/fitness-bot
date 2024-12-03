ALTER TABLE "fb_users" ADD COLUMN "balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fb_users" ADD COLUMN "timezone" varchar DEFAULT 'America/Los_Angeles';