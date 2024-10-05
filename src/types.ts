import { ChatInputCommandInteraction, Client, Collection, CommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, Command>;
    }
}