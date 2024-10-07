CREATE TABLE IF NOT EXISTS "fb_weekly_user_goals" (
	"goal_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"week_start" date NOT NULL,
	"activity_name" varchar NOT NULL,
	"target_frequency" integer NOT NULL,
	"current_progress" integer DEFAULT 0 NOT NULL,
	"deposit_amount" numeric(10, 2) DEFAULT '0',
	"is_completed" boolean DEFAULT false NOT NULL,
	"payout_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fb_weekly_user_goals" ADD CONSTRAINT "fb_weekly_user_goals_user_id_fb_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fb_users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
