import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db } from "../drizzle/db.js";
import { getStartOfWeek, getEndOfWeek, getNextMonday, getTimeLeftInWeek } from "../helpers/date-helpers.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { weeklyUserGoals, users } from "../drizzle/schema.js";

const command = {
  data: new SlashCommandBuilder()
    .setName("getusers")
    .setDescription("Gets all users"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const startOfWeekStr = getStartOfWeek().toLocaleDateString("en-CA");
    const endOfWeekStr = getEndOfWeek().toLocaleDateString("en-CA");
    console.log(`start of week str: ${startOfWeekStr}, end of week str: ${endOfWeekStr}`)

    try {
      // Step 1: Query for users with goals in the current week
      const usersWithGoals = await db
        .select({
          userId: users.userId,
          discordUsername: users.discordUsername,
        })
        .from(users)
        .innerJoin(weeklyUserGoals, eq(users.userId, weeklyUserGoals.userId))
        .where(
          and(
            gte(weeklyUserGoals.weekStart, startOfWeekStr),
            lt(weeklyUserGoals.weekStart, endOfWeekStr)
          )
        )
        .groupBy(users.userId, users.discordUsername);

      if (usersWithGoals.length === 0) {
        await interaction.editReply(
          "No users have goals for the current week."
        );
        return;
      }
      const { hoursLeft, minutesLeft, timeLeftMessage } = getTimeLeftInWeek();

      const embed = new EmbedBuilder()
        .setTitle("Users with Goals This Week")
        .setDescription(timeLeftMessage)
        .setColor("#0099ff")
        .setTimestamp();

      // Step 2: For each user, query their goals for the current week
      for (const user of usersWithGoals) {
        const userGoals = await db
          .select({
            activityName: weeklyUserGoals.activityName,
            currentProgress: weeklyUserGoals.currentProgress,
            targetFrequency: weeklyUserGoals.targetFrequency,
          })
          .from(weeklyUserGoals)
          .where(
            and(
              eq(weeklyUserGoals.userId, user.userId),
              gte(weeklyUserGoals.weekStart, startOfWeekStr),
              lt(weeklyUserGoals.weekStart, endOfWeekStr)
            )
          );

        const goalDescriptions = userGoals.map((goal) => {
          if (goal.currentProgress === goal.targetFrequency) {
            return `${goal.activityName}: ${goal.currentProgress}/${goal.targetFrequency}✅`;
          } else if (goal.currentProgress >= goal.targetFrequency) {
            return `${goal.activityName}: ${goal.currentProgress}/${goal.targetFrequency}✅🔥🔥🔥`;
          } else {
            return `${goal.activityName}: ${goal.currentProgress}/${goal.targetFrequency}`;
          }
        });

        embed.addFields({
          name: user.discordUsername || `User ${user.userId}`,
          value: goalDescriptions.join("\n") || "No goals found",
          inline: true,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching users with goals:", error);
      await interaction.editReply(
        "An error occurred while fetching user goals."
      );
    }
  },
};

export default command;
