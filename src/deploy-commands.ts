import { REST, Routes } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadCommands = async () => {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = await fs.readdir(commandsPath);
    const filteredFiles = commandFiles.filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of filteredFiles) {
        const filePath = path.join(commandsPath, file);
        const commandModule = await import(filePath);
        const command = commandModule.default;

        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    return commands;
};

const deployCommands = async () => {
    try {
        const commands = await loadCommands();
        const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: commands }
        );

        console.log(`Successfully reloaded ${Array.isArray(data) ? data.length : 0} application (/) commands.`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
};

deployCommands();