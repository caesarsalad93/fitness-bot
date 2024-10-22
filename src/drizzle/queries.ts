import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { users, weeklyUserGoals } from "./schema.js";
import { getStartOfWeek } from "../helpers/date-helpers.js";
import { formatDateForPostgres } from "../helpers/format-date-for-postgres.js";

export async function setWeekGoal(
  discordId: string,
  discordUsername: string,
  activityName: string,
  targetFrequency: number
) {
  //Try to get the user
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

  const weekStart = getStartOfWeek();

  const newGoal = await db.insert(weeklyUserGoals).values({
    userId: user[0].userId,
    weekStart,
    activityName,
    targetFrequency,
  }).returning();

  return newGoal[0];
}

export async function insertDummyData() {
  // Insert a new user
  const [newUser] = await db.insert(users).values({
    discordUsername: 'JohnDoe',
    discordId: '123456789',
  }).returning({ userId: users.userId });

  // Get the current week's start date
  const currentWeekStartStr = getStartOfWeek();

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