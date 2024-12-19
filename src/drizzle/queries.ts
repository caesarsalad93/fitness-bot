import { eq, and, sql } from "drizzle-orm";
import { db } from "./db.js";
import { users, weeklyUserGoals, weeklyImplementationIntentions, bubbleTransactions } from "./schema.js";
import { getStartOfWeek, getStartOfWeekV2 } from "../helpers/date-helpers.js";
import { formatDateForPostgres } from "../helpers/format-date-for-postgres.js";

export async function setWeekGoal(
  discordId: string,
  discordUsername: string,
  activityName: string,
  targetFrequency: number
) {
  return await db.transaction(async (tx) => {
    // Get or create user (your existing logic)
    let user = await tx
      .select()
      .from(users)
      .where(eq(users.discordId, discordId))
      .limit(1);

    if (user.length === 0) {
      const newUser = await tx
        .insert(users)
        .values({
          discordId,
          discordUsername,
        })
        .returning();
      user = newUser;
    } else {
      await tx
        .update(users)
        .set({ discordUsername })
        .where(eq(users.discordId, discordId));
    }

    const weekStartStr = (await getStartOfWeekV2(discordId)).toISOString().split('T')[0];

    // Check for existing deposit this week
    const existingDeposit = await tx.query.bubbleTransactions.findFirst({
      where: and(
        eq(bubbleTransactions.userId, user[0].userId),
        eq(bubbleTransactions.weekStart, weekStartStr),
        eq(bubbleTransactions.type, 'WEEKLY_DEPOSIT')
      )
    });

    // Create the new goal
    const [newGoal] = await tx.insert(weeklyUserGoals).values({
      userId: user[0].userId,
      weekStart: weekStartStr,
      activityName,
      targetFrequency,
    }).returning();

    // If no deposit exists yet, create one and update balance
    if (!existingDeposit) {
      const DEPOSIT_AMOUNT = 5;
      
      await tx.insert(bubbleTransactions).values({
        userId: user[0].userId,
        amount: -DEPOSIT_AMOUNT,
        type: 'WEEKLY_DEPOSIT',
        weekStart: weekStartStr,
        description: 'Weekly goals deposit'
      });

      await tx.update(users)
        .set({ balance: sql`balance - ${DEPOSIT_AMOUNT}` })
        .where(eq(users.userId, user[0].userId));
    }

    return newGoal;
  });
}

export async function setImplementationIntention(
  discordId: string,
  discordUsername: string,
  behavior: string,
  time: string,
  location: string
) {
  // Try to get the user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (user.length === 0) {
    const newUser = await db
      .insert(users)
      .values({
        discordId,
        discordUsername,
      })
      .returning();
    user = newUser;
  } else {
    await db
      .update(users)
      .set({ discordUsername })
      .where(eq(users.discordId, discordId));
  }

  const weekStartStr = (await getStartOfWeekV2(discordId)).toISOString().split('T')[0];

  // Insert the new implementation intention
  const newII = await db
    .insert(weeklyImplementationIntentions)
    .values({
      userId: user[0].userId,
      behavior,
      time,
      location,
      weekStart: weekStartStr,
    })
    .returning();

  return newII[0];
}

export async function insertDummyData() {
  // Insert a new user
  const [newUser] = await db.insert(users).values({
    discordUsername: 'JohnDoe',
    discordId: '123456789',
  }).returning({ userId: users.userId });

  // Get the current week's start date
  const currentWeekStartStr = (await getStartOfWeekV2('123456789')).toISOString().split('T')[0];

  // Insert two goals for the new user
  await db.insert(weeklyUserGoals).values([
    {
      userId: newUser.userId,
      weekStart: currentWeekStartStr,
      activityName: 'Running',
      targetFrequency: 3,
    },
    {
      userId: newUser.userId,
      weekStart: currentWeekStartStr,
      activityName: 'Meditation',
      targetFrequency: 5,
    },
  ]);

  console.log('Dummy data inserted successfully');
}