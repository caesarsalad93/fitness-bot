CREATE TABLE IF NOT EXISTS "fb_users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"discord_username" varchar,
	"discord_id" varchar,
	"created_at" timestamp DEFAULT now()
);
