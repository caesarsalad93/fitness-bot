import {
    pgTable,
    serial,
    varchar,
    timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("fb_users", {
    userId: serial("user_id").primaryKey(),
    discordUsername: varchar("discord_username"),
    discordId: varchar("discord_id"),
    createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;