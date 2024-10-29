import {
  SlashCommandBuilder,
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import { db } from "../drizzle/db.js";
import { eq, and, gte, lt } from "drizzle-orm";
import { users, weeklyUserGoals } from "../drizzle/schema.js";
import { getStartOfWeek, getEndOfWeek } from "../helpers/date-helpers.js";


function formatDateForPostgres(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Store the last message ID for each user
const lastMessageIds = new Map<string, string>();

const viewGoals = {
  data: new SlashCommandBuilder()
    .setName("viewgoals")
    .setDescription("View your current weekly goals"),

  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    const weekStartStr = getStartOfWeek().toISOString().split('T')[0];
    const endOfWeekStr = getEndOfWeek().toISOString().split('T')[0];

    // Delete the previous message if it exists
    const lastMessageId = lastMessageIds.get(discordId);
    if (lastMessageId) {
      try {
        const channel = interaction.channel as TextChannel;
        const message = await channel.messages.fetch(lastMessageId);
        await message.delete();
      } catch (error) {
        console.error("Error deleting previous message:", error);
        // Continue with the command even if deletion fails
      }
    }

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
          lt(weeklyUserGoals.weekStart, endOfWeekStr)
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
        `Hello ${
          user[0].discordUsername
        }! Here are your goals for the week of ${weekStartStr}:`
      );

    // Create buttons for each goal
    const rows = goals.map((goal, index) => {
      const button = new ButtonBuilder()
        .setCustomId(`increment_${goal.goalId}`)
        .setLabel(`Increment ${goal.activityName}`)
        .setStyle(ButtonStyle.Primary);

      const deleteButton = new ButtonBuilder()
        .setCustomId(`delete_${goal.goalId}`)
        .setLabel(`Delete ${goal.activityName}`)
        .setStyle(ButtonStyle.Danger);

      embed.addFields({
        name: goal.activityName,
        value: `Progress: ${goal.currentProgress}/${goal.targetFrequency}`,
        inline: true,
      });

      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        button,
        deleteButton
      );
    });

    const reply = await interaction.reply({
      embeds: [embed],
      components: rows,
      fetchReply: true,
    });

    lastMessageIds.set(discordId, reply.id);
  },
};

export default viewGoals;
