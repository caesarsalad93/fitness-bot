import { Events, Interaction } from "discord.js";

const slash = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const testServerId = process.env.TEST_SERVER_ID;
    const isLocal = process.env.LOCAL === "true";
    const isTestServer = interaction.guild?.id === testServerId;
    // Logic to ensure only one bot responds
    if (isTestServer && !isLocal) {
      console.log("Deployed bot ignoring test server");
      return; // Deployed bot ignores test server
    }

    if (!isTestServer && isLocal) {
      console.log("Local bot ignoring production servers");
      return; // Local bot ignores production servers
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
