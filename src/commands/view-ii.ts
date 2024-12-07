import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ChatInputCommandInteraction,
    TextChannel,
  } from "discord.js";
  import { db } from "../drizzle/db.js";
  import { eq, and, gte, lt } from "drizzle-orm";
  import { users, weeklyImplementationIntentions } from "../drizzle/schema.js";
  import { getStartOfWeek, getEndOfWeek } from "../helpers/date-helpers.js";
  
  // Store the last message ID for each user
  const lastMessageIds = new Map<string, string>();
  
  const viewIICommand = {
    data: new SlashCommandBuilder()
      .setName("viewii")
      .setDescription("View your current implementation intentions"),
  
    async execute(interaction: ChatInputCommandInteraction) {
      const discordId = interaction.user.id;
      const weekStartStr = getStartOfWeek().toLocaleDateString("en-CA");
      const endOfWeekStr = getEndOfWeek().toLocaleDateString("en-CA");
  
      // Delete the previous message if it exists
      const lastMessageId = lastMessageIds.get(discordId);
      if (lastMessageId) {
        try {
          const channel = interaction.channel as TextChannel;
          const message = await channel.messages.fetch(lastMessageId);
          await message.delete();
        } catch (error) {
          console.error("Error deleting previous message:", error);
        }
      }
  
      // Fetch user and their implementation intentions for the current week
      const user = await db
        .select()
        .from(users)
        .where(eq(users.discordId, discordId))
        .limit(1);
  
      if (user.length === 0) {
        await interaction.reply("You have not set any implementation intentions yet.");
        return;
      }
  
      const intentions = await db
        .select()
        .from(weeklyImplementationIntentions)
        .where(
          and(
            eq(weeklyImplementationIntentions.userId, user[0].userId),
            gte(weeklyImplementationIntentions.weekStart, weekStartStr),
            lt(weeklyImplementationIntentions.weekStart, endOfWeekStr)
          )
        );
  
      if (intentions.length === 0) {
        await interaction.reply("You have not set any implementation intentions for this week.");
        return;
      }
  
      // Create an embed to display implementation intentions
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("Your Implementation Intentions")
        .setDescription(
          `Hello ${user[0].discordUsername}! Here are your implementation intentions for the week of ${weekStartStr}:`
        );
  
      // Create buttons for each implementation intention
      const rows = intentions.map((intention) => {
        const completeButton = new ButtonBuilder()
          .setCustomId(`complete_ii_${intention.intentionId}`)
          .setLabel(`Mark Complete (${intention.behavior} at ${intention.time} in ${intention.location})`)
          .setStyle(intention.isCompleted ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(intention.isCompleted);
  
        embed.addFields({
          name: intention.isCompleted ? `✅ ${intention.behavior}` : intention.behavior,
          value: `"I will ${intention.behavior} at ${intention.time} in ${intention.location}"`,
          inline: false,
        });
  
        return new ActionRowBuilder<ButtonBuilder>().addComponents(completeButton);
      });
  
      const reply = await interaction.reply({
        embeds: [embed],
        components: rows,
        fetchReply: true,
      });
  
      lastMessageIds.set(discordId, reply.id);
    },
  };
  
  export default viewIICommand;