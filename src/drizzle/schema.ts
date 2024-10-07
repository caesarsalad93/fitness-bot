import {
    pgTable,
    serial,
    varchar,
    timestamp,
    integer,
    date,
    decimal,
    boolean
} from "drizzle-orm/pg-core";

export const users = pgTable("fb_users", {
    userId: serial("user_id").primaryKey(),
    discordUsername: varchar("discord_username"),
    discordId: varchar("discord_id"),
    createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const weeklyUserGoals = pgTable("fb_weekly_user_goals", {
    goalId: serial("goal_id").primaryKey(),
    userId: integer("user_id").references(() => users.userId),
    weekStart: date("week_start").notNull(),
    activityName: varchar("activity_name").notNull(),
    targetFrequency: integer("target_frequency").notNull(),
    currentProgress: integer("current_progress").notNull().default(0),
    depositAmount: decimal("deposit_amount", { precision: 10, scale: 2}).default("0"),
    isCompleted: boolean("is_completed").notNull().default(false),
    payoutAmount: decimal("payout_amount", { precision: 10, scale: 2}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUpdated: timestamp("last_updated").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type WeeklyUserGoal = typeof weeklyUserGoals.$inferSelect;
export type NewWeeklyUserGoal = typeof weeklyUserGoals.$inferInsert;