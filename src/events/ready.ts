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
    // Test channel: 1281049533073195070
    // Live channel: 1011399499668803676
    scheduleWeeklyAnnouncement(client, "1011399499668803676");
    
  },
};

export default ready;