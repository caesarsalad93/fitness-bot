import cron from "node-cron";
import { Client } from "discord.js";
import announceWeeklyProgress from "./commands/announce-weekly-progress.js";
import getUsers from "./commands/get-users.js";
import { getStartOfWeek } from "./helpers/date-helpers.js";

export function scheduleWeeklyAnnouncement(client: Client, channelId: string) {
  // // Schedule the task to run every Sunday at 11:59 PM
  // cron.schedule(
  //   "59 23 * * 0",
  //   async () => {
  //     try {
  //       const channel = await client.channels.fetch(channelId);
  //       if (channel && channel.isTextBased() && "send" in channel) {
  //         // Get the start of the current week
  //         const startOfWeek = getStartOfWeek();
  //         // Create a mock interaction object
  //         const mockInteraction = {
  //           deferReply: async () => {},
  //           editReply: async (content: any) => {
  //             await channel.send(content);
  //           },
  //           options: {
  //             getString: () => startOfWeek,
  //           },
  //         };

  //         // Execute the command
  //         await announceWeeklyProgress.execute(mockInteraction as any);
  //         await getUsers.execute(mockInteraction as any);
  //       }
  //     } catch (error) {
  //       console.error("Error running scheduled announcement:", error);
  //     }
  //   },
  //   {
  //     timezone: "America/Los_Angeles",
  //   }
  // );
}
