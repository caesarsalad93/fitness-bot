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
    balance: integer("balance").default(0).notNull(),
    timezone: varchar("timezone").default("America/Los_Angeles"),
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
    isCompleted: boolean("is_completed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUpdated: timestamp("last_updated").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type WeeklyUserGoal = typeof weeklyUserGoals.$inferSelect;
export type NewWeeklyUserGoal = typeof weeklyUserGoals.$inferInsert;

export const weeklyImplementationIntentions = pgTable("fb_weekly_implementation_intentions", {
    intentionId: serial("intention_id").primaryKey(),
    userId: integer("user_id").references(() => users.userId),
    weekStart: date("week_start").notNull(),
    behavior: varchar("behavior").notNull(),
    time: varchar("time").notNull(),
    location: varchar("location").notNull(),
    isCompleted: boolean("is_completed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUpdated: timestamp("last_updated").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type WeeklyImplementationIntention = typeof weeklyImplementationIntentions.$inferSelect;
export type NewWeeklyImplementationIntention = typeof weeklyImplementationIntentions.$inferInsert;

export const bubbleTransactions = pgTable("fb_bubble_transactions", {
    transactionId: serial("transaction_id").primaryKey(),
    userId: integer("user_id").references(() => users.userId),
    amount: integer("amount").notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'WEEKLY_DEPOSIT' or 'WEEKLY_PAYOUT'
    weekStart: date("week_start").notNull(), // Add this to track which week this transaction is for
    description: varchar("description", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BubbleTransaction = typeof bubbleTransactions.$inferSelect;
export type NewBubbleTransaction = typeof bubbleTransactions.$inferInsert;