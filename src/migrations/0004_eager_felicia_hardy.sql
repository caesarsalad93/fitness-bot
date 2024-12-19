CREATE TABLE IF NOT EXISTS "fb_bubble_transactions" (
	"transaction_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"amount" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"week_start" date NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fb_bubble_transactions" ADD CONSTRAINT "fb_bubble_transactions_user_id_fb_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fb_users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
