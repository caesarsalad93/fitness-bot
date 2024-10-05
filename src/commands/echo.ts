import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

const echo = {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Echoes your input')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to echo')
                .setRequired(true)),
    
    async execute(interaction: ChatInputCommandInteraction) {
        const message = interaction.options.getString('message');
        await interaction.reply(`You said: ${message}`);
    },
};

export default echo;