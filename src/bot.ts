import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

client.once('ready', () => {
  console.log('Bot is ready!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    await message.reply('Pong!');
  }
});

client.login(process.env.DISCORD_TOKEN);