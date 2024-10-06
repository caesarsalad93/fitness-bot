import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getUsers } from '../drizzle/db.js';

const echo = {
    data: new SlashCommandBuilder()
        .setName('getusers')
        .setDescription('Gets all users'),
    
    async execute(interaction: ChatInputCommandInteraction) {
        const usersObject = await getUsers();
        const users = usersObject.map(user => user.discordUsername).join(' ');

        await interaction.reply(`Here are all the users: ${users}`);
    },
};

export default echo;