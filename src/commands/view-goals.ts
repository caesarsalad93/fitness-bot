import {
  SlashCommandBuilder,
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { db } from "../drizzle/db.js";
import { eq, and, gte, lt } from "drizzle-orm";
import { users, weeklyUserGoals } from "../drizzle/schema.js";

// Helper function to get the start of the current week
function getCurrentWeekStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - now.getDay() + 1);
  return now;
}

function formatDateForPostgres(date: Date): string {
  return date.toISOString().split("T")[0];
}

const viewGoals = {
  data: new SlashCommandBuilder()
    .setName("viewgoals")
    .setDescription("View your current weekly goals"),

  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    const weekStart = getCurrentWeekStart();
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const weekStartStr = formatDateForPostgres(weekStart);
    const nextWeekStartStr = formatDateForPostgres(nextWeekStart);

    // Fetch user and their goals for the current week
    const user = await db
      .select()
      .from(users)
      .where(eq(users.discordId, discordId))
      .limit(1);
    if (user.length === 0) {
      await interaction.reply("You have not set any goals yet.");
      return;
    }

    const goals = await db
      .select()
      .from(weeklyUserGoals)
      .where(
        and(
          eq(weeklyUserGoals.userId, user[0].userId),
          gte(weeklyUserGoals.weekStart, weekStartStr),
          lt(weeklyUserGoals.weekStart, nextWeekStartStr)
        )
      );

    if (goals.length === 0) {
      await interaction.reply("You have not set any goals for this week.");
      return;
    }

    // Create an embed to display goals
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Your Weekly Goals")
      .setDescription(
        `Hello ${user[0].discordUsername}! Here are your goals for the week of ${weekStart.toDateString()}:`
      );

    // Create buttons for each goal
    const rows = goals.map((goal, index) => {
      const button = new ButtonBuilder()
        .setCustomId(`increment_${goal.goalId}`)
        .setLabel(`Increment ${goal.activityName}`)
        .setStyle(ButtonStyle.Primary);

    const deleteButton = new ButtonBuilder ()
        .setCustomId(`delete_${goal.goalId}`)
        .setLabel(`Delete Goal${index + 1}`)
        .setStyle(ButtonStyle.Danger);

      embed.addFields({
        name: goal.activityName,
        value: `Progress: ${goal.currentProgress}/${goal.targetFrequency}`,
        inline: true,
      });

      return new ActionRowBuilder<ButtonBuilder>().addComponents(button, deleteButton);
    });

    await interaction.reply({ embeds: [embed], components: rows });
  },
};

export default viewGoals;