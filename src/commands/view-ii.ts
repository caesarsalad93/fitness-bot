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

      console.log('Date range:', { weekStartStr, endOfWeekStr });
  
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

      // Add logging before and after user query
      console.log('Querying database for user with discord ID:', discordId);
  
      // Fetch user and their implementation intentions for the current week
      const user = await db
        .select()
        .from(users)
        .where(eq(users.discordId, discordId))
        .limit(1);

      console.log(`User: ${user[0].discordUsername}`);
  
      if (user.length === 0) {
        await interaction.reply("You have not set any implementation intentions yet.");
        return;
      }

      // Add logging before and after intentions query
      console.log('Querying intentions for user:', user[0].userId);
  
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

      console.log('Intentions query result:', JSON.stringify(intentions, null, 2));
  
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
             const buttons = intentions.map((intention) => {
              const truncatedLabel = `✓ (${intention.behavior} at ${intention.time} in ${intention.location})`.substring(0, 80);
              
              // Add field to embed
              embed.addFields({
                  name: intention.isCompleted ? `✅ ${intention.behavior}` : intention.behavior,
                  value: `"I will ${intention.behavior} at ${intention.time} in ${intention.location}"`,
                  inline: false,
              });
  
              return new ButtonBuilder()
                  .setCustomId(`complete_ii_${intention.intentionId}`)
                  .setLabel(truncatedLabel)
                  .setStyle(intention.isCompleted ? ButtonStyle.Success : ButtonStyle.Primary)
                  .setDisabled(intention.isCompleted);
          });
  
          // Group buttons into rows (max 5 buttons per row)
          const actionRows: ActionRowBuilder<ButtonBuilder>[] = [];
          for (let i = 0; i < buttons.length; i += 5) {
              const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                  buttons.slice(i, Math.min(i + 5, buttons.length))
              );
              actionRows.push(row);
          }
  
          // Limit to maximum 5 rows
          const limitedRows = actionRows.slice(0, 5);
  
          const reply = await interaction.reply({
              embeds: [embed],
              components: limitedRows,
              fetchReply: true,
          });
  
      lastMessageIds.set(discordId, reply.id);
    },
  };
  
  export default viewIICommand;