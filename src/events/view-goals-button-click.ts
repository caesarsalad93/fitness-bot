import {
  ButtonInteraction,
  Events,
  Interaction,
  EmbedBuilder,
} from "discord.js";
import { db } from "../drizzle/db.js";
import { eq, and, gte, lt } from "drizzle-orm";
import { weeklyUserGoals, users } from "../drizzle/schema.js";
import { getStartOfWeek, getEndOfWeek } from "../helpers/date-helpers.js";

function getCurrentWeekStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - now.getDay() + 1);
  return now;
}

function formatDateForPostgres(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function getUserByDiscordId(discordId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId));
  return user;
}

async function markGoalAsCompleted(goalId: number) {
  await db
    .update(weeklyUserGoals)
    .set({ isCompleted: true })
    .where(eq(weeklyUserGoals.goalId, goalId));
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
  const weekStart = getStartOfWeek();
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

  const user = await getUserByDiscordId(interaction.user.id);

  if (!user || user.userId !== goal.userId) {
    await interaction.reply({
      content: "You can only delete your own goals.",
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
  const weekStartStr = getStartOfWeek().toISOString().split('T')[0];
  const endOfWeekStr = getEndOfWeek().toISOString().split('T')[0];

  // Fetch the goal, ensuring it's for the current week
  const [goal] = await db
    .select()
    .from(weeklyUserGoals)
    .where(
      and(
        eq(weeklyUserGoals.goalId, goalId),
        gte(weeklyUserGoals.weekStart, weekStartStr),
        lt(weeklyUserGoals.weekStart, endOfWeekStr)
      )
    );

  if (!goal) {
    await interaction.reply({
      content: "Goal not found or not from the current week.",
      ephemeral: true,
    });
    return;
  }

  const user = await getUserByDiscordId(interaction.user.id);

  if (!user || user.userId !== goal.userId) {
    await interaction.reply({
      content: "You can only update your own goals.",
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

  if (updatedGoal[0].currentProgress === goal.targetFrequency) {
    await markGoalAsCompleted(goalId);

    // Announce goal completion to the channel
    const channel = interaction.channel;
    if (channel && channel.isTextBased() && "send" in channel) {
      await channel.send(`🎉 Congratulations ${interaction.user.username}! You've completed your goal "${goal.activityName}"!`);
    }
  }
  const previousEmbed = interaction.message.embeds[0];

  // Update only the specific field for the incremented goal
  const updatedFields = previousEmbed.data.fields!.map((field) => {
    if (field.name === goal.activityName) {
      return {
        ...field,
        value: `Progress: ${updatedGoal[0].currentProgress}/${goal.targetFrequency}`,
      };
    }
    return field;
  });

  const updatedEmbed =
    EmbedBuilder.from(previousEmbed).setFields(updatedFields);
  await interaction.update({
    embeds: [updatedEmbed],
    components: interaction.message.components,
  });

  await interaction.followUp({
    content: `Goal "${goal.activityName}" progress updated to ${updatedGoal[0].currentProgress}/${goal.targetFrequency}`,
    ephemeral: true,
  });
}

export default viewGoalsButtonInteraction;
