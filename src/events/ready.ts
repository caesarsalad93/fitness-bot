import { Events } from "discord.js";
import { Client } from "discord.js";
import { scheduleWeeklyAnnouncement } from "../scheduler.js";

const ready = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    console.log(`Ready! Logged in as ${client.user!.tag}`);
    // Schedule the weekly announcement
    // Replace 'YOUR_CHANNEL_ID' with the actual channel ID where you want to post the announcement
    scheduleWeeklyAnnouncement(client, "1281049533073195070");
  },
};

export default ready;
