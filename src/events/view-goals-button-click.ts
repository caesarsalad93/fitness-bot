import { ButtonInteraction, Events, Interaction } from "discord.js";
import { db } from "../drizzle/db.js";
import { eq, and, gte, lt } from "drizzle-orm";
import { weeklyUserGoals } from "../drizzle/schema.js";
import { view } from "drizzle-orm/sqlite-core/view.js";

function getCurrentWeekStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - now.getDay() + 1);
  return now;
}

function formatDateForPostgres(date: Date): string {
  return date.toISOString().split("T")[0];
}

const viewGoalsButtonInteraction = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith("increment_")) {
      await handleGoalIncrement(interaction);
    } else if (interaction.customId.startsWith("delete_")) {
      await handleDelete(interaction);
    }
  },
};

async function handleDelete(interaction: ButtonInteraction) {
  const goalId = parseInt(interaction.customId.split("_")[1]);
  const weekStart = getCurrentWeekStart();
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const weekStartStr = formatDateForPostgres(weekStart);
  const nextWeekStartStr = formatDateForPostgres(nextWeekStart);

  const [goal] = await db
    .select()
    .from(weeklyUserGoals)
    .where(
      and(
        eq(weeklyUserGoals.goalId, goalId),
        gte(weeklyUserGoals.weekStart, weekStartStr),
        lt(weeklyUserGoals.weekStart, nextWeekStartStr)
      )
    );

  if (!goal) {
    await interaction.reply({
      content: "Goal not found or not from the current week.",
      ephemeral: true,
    });
    return;
  }
  // Delete the goal
  await db.delete(weeklyUserGoals).where(eq(weeklyUserGoals.goalId, goalId));

  await interaction.reply({
    content: `Goal "${goal.activityName}" has been deleted.`,
    ephemeral: true,
  });
}

async function handleGoalIncrement(interaction: ButtonInteraction) {
  const goalId = parseInt(interaction.customId.split("_")[1]);
  const weekStart = getCurrentWeekStart();
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const weekStartStr = formatDateForPostgres(weekStart);
  const nextWeekStartStr = formatDateForPostgres(nextWeekStart);

  // Fetch the goal, ensuring it's for the current week
  const [goal] = await db
    .select()
    .from(weeklyUserGoals)
    .where(
      and(
        eq(weeklyUserGoals.goalId, goalId),
        gte(weeklyUserGoals.weekStart, weekStartStr),
        lt(weeklyUserGoals.weekStart, nextWeekStartStr)
      )
    );

  if (!goal) {
    await interaction.reply({
      content: "Goal not found or not from the current week.",
      ephemeral: true,
    });
    return;
  }

  // Increment the progress
  const updatedGoal = await db
    .update(weeklyUserGoals)
    .set({ currentProgress: goal.currentProgress + 1 })
    .where(eq(weeklyUserGoals.goalId, goalId))
    .returning();

  await interaction.reply({
    content: `Progress updated for ${goal.activityName}! New progress: ${updatedGoal[0].currentProgress}/${goal.targetFrequency}`,
    ephemeral: true,
  });
}

export default viewGoalsButtonInteraction;
