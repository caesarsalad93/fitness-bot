CREATE TABLE IF NOT EXISTS "fb_weekly_implementation_intentions" (
	"intention_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"week_start" date NOT NULL,
	"behavior" varchar NOT NULL,
	"time" varchar NOT NULL,
	"location" varchar NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fb_weekly_implementation_intentions" ADD CONSTRAINT "fb_weekly_implementation_intentions_user_id_fb_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fb_users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
