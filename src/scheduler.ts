import cron from 'node-cron';
import { Client } from 'discord.js';
import announceWeeklyProgress from './commands/announce-weekly-progress.js';

export function scheduleWeeklyAnnouncement(client: Client, channelId: string) {
  // Schedule the task to run every Sunday at 11:59 PM
  cron.schedule('59 23 * * 0', async () => {
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel && channel.isTextBased() && "send" in channel) {
        // Create a mock interaction object
        const mockInteraction = {
          deferReply: async () => {},
          editReply: async (content: any) => {
            await channel.send(content);
          },
        };

        // Execute the command
        await announceWeeklyProgress.execute(mockInteraction as any);
      }
    } catch (error) {
      console.error('Error running scheduled announcement:', error);
    }
  });
}