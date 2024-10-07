import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, weeklyUserGoals } from "./schema";

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

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const formattedWeekStart = weekStart.toISOString();

  const newGoal = await db.insert(weeklyUserGoals).values({
    userId: user[0].userId,
    weekStart: formattedWeekStart,
    activityName,
    targetFrequency,
  }).returning();

  return newGoal[0];
}
