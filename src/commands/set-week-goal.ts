import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { setWeekGoal } from '../drizzle/queries';

const setWeekGoalCommand = {
    data: new SlashCommandBuilder()
        .setName('setweekgoal')
        .setDescription('Sets a goal for the week')
        .addStringOption(option => 
            option.setName('activity')
                .setDescription('The activity you want to do')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('frequency')
                .setDescription('How many times you want to do this activity this week')
                .setRequired(true)),
        
    async execute(interaction: ChatInputCommandInteraction) {
        const activity = interaction.options.getString('activity', true);
        const frequency = interaction.options.getInteger('frequency', true);
        const discordId = interaction.user.id;
        const discordUsername = interaction.user.username;
        
        try {
            const newGoal = await setWeekGoal(discordId, discordUsername, activity, frequency);
            await interaction.reply(`Goal set! You aim to ${activity} ${frequency} times this week.`);
        } catch (error) {
            console.error('Error setting goal:', error);
            await interaction.reply('Sorry, there was an error setting your goal. Please try again later.');
          }
    },
};
