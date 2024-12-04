import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { setImplementationIntention } from '../drizzle/queries.js'; // You'll need to create this query

const setIICommand = {
    data: new SlashCommandBuilder()
        .setName('setii')
        .setDescription('Set an implementation intention (I will [BEHAVIOR] at [TIME] in [LOCATION])')
        .addStringOption(option => 
            option.setName('behavior')
                .setDescription('What specific action you will take')
                .setRequired(true)
                .setMaxLength(100))
        .addStringOption(option => 
            option.setName('time')
                .setDescription('When you will do it (e.g., "7am", "after lunch")')
                .setRequired(true)
                .setMaxLength(50))
        .addStringOption(option => 
            option.setName('location')
                .setDescription('Where you will do it')
                .setRequired(true)
                .setMaxLength(50)),
        
    async execute(interaction: ChatInputCommandInteraction) {
        const behavior = interaction.options.getString('behavior', true);
        const time = interaction.options.getString('time', true);
        const location = interaction.options.getString('location', true);
        const discordId = interaction.user.id;
        const discordUsername = interaction.user.username;
        
        try {
            const newII = await setImplementationIntention(discordId, discordUsername, behavior, time, location);
            await interaction.reply(
                `Implementation intention set! ✨\n` +
                `I will ${behavior} at ${time} in ${location}.`
            );
        } catch (error) {
            console.error('Error setting implementation intention:', error);
            await interaction.reply('Sorry, there was an error setting your implementation intention. Please try again later.');
        }
    },
};

export default setIICommand;