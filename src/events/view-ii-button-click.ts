import { ButtonInteraction, Events, Interaction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { db } from "../drizzle/db.js";
import { eq, and, gte, lt } from "drizzle-orm";
import { weeklyImplementationIntentions, users } from "../drizzle/schema.js";
import { getStartOfWeek, getEndOfWeek } from "../helpers/date-helpers.js";

async function getUserByDiscordId(discordId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId));
  return user;
}

const viewIIButtonInteraction = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith("complete_ii_")) {
      await handleComplete(interaction);
    }
  },
};

async function handleComplete(interaction: ButtonInteraction) {
  const intentionId = parseInt(interaction.customId.split("_")[2]);
  const weekStartStr = getStartOfWeek().toLocaleDateString("en-CA");
  const endOfWeekStr = getEndOfWeek().toLocaleDateString("en-CA");

  const [intention] = await db
    .select()
    .from(weeklyImplementationIntentions)
    .where(
      and(
        eq(weeklyImplementationIntentions.intentionId, intentionId),
        gte(weeklyImplementationIntentions.weekStart, weekStartStr),
        lt(weeklyImplementationIntentions.weekStart, endOfWeekStr)
      )
    );

  if (!intention) {
    await interaction.reply({
      content: "Implementation intention not found or not from the current week.",
      ephemeral: true,
    });
    return;
  }

  const user = await getUserByDiscordId(interaction.user.id);

  if (!user || user.userId !== intention.userId) {
    await interaction.reply({
      content: "You can only complete your own implementation intentions.",
      ephemeral: true,
    });
    return;
  }

  // Mark the implementation intention as completed
  await db
    .update(weeklyImplementationIntentions)
    .set({ isCompleted: true })
    .where(eq(weeklyImplementationIntentions.intentionId, intentionId));

  // Update the embed to reflect the completion
  const previousEmbed = interaction.message.embeds[0];
  const updatedFields = previousEmbed.data.fields!.map((field) => {
    if (field.name === intention.behavior) {
      return {
        ...field,
        name: `✅ ${intention.behavior}`,
      };
    }
    return field;
  });

  const updatedEmbed = EmbedBuilder.from(previousEmbed).setFields(updatedFields);

  // Disable the button and change its style
  const components = interaction.message.components.map((row) => {
    const newRow = new ActionRowBuilder<ButtonBuilder>();
    const buttons = row.components.map((component: any) => {
      const button = ButtonBuilder.from(component);
      if (component.customId === `complete_ii_${intentionId}`) {
        button.setDisabled(true).setStyle(ButtonStyle.Success);
      }
      return button;
    });
    return newRow.addComponents(buttons);
  });

  await interaction.update({
    embeds: [updatedEmbed],
    components: components.map(row => row.toJSON()),
  });

  await interaction.followUp({
    content: `Implementation intention "${intention.behavior}" marked as completed! 🎉`,
    ephemeral: true,
  });
}

export default viewIIButtonInteraction; 