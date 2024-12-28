import { Events, Interaction } from "discord.js";

const slash = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const testServerId = process.env.TEST_SERVER_ID;
    const isLocal = process.env.LOCAL === "true";
    const isProd = process.env.ENVIRONMENT === "production";
    const isTestServer = interaction.guild?.id === testServerId;

    // Local bot only responds to test server
    if (isLocal) {
      if (!isTestServer) {
        console.log("Local bot ignoring production servers");
        return;
      }
      // Local bot continues to process test server commands
    }

    // Production bot only responds to production servers
    if (isProd && isTestServer) {
      console.log("Production bot ignoring test server");
      return;
    }

    // Preview/other deployments don't respond at all
    if (!isLocal && !isProd) {
      console.log("Preview deployment - not responding");
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};

export default slash;
