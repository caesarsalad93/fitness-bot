import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getStartOfWeekV2, getEndOfWeekV2, getStartOfWeek, getEndOfWeek } from '../helpers/date-helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test-dates')
    .setDescription('Test new date handling'),
    
  async execute(interaction:ChatInputCommandInteraction) {
    await interaction.deferReply();
    
    const startOld = getStartOfWeek().toISOString();
    const startNew = (await getStartOfWeekV2(interaction.user.id)).toISOString();
    
    await interaction.editReply(
      `Old start: ${startOld}\nNew start: ${startNew}`
    );
  }
}; 