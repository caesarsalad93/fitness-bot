import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db } from "../drizzle/db.js";
import { getStartOfWeek, getEndOfWeek } from "../helpers/date-helpers.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { weeklyUserGoals, users } from "../drizzle/schema.js";

const command = {
  data: new SlashCommandBuilder()
    .setName("announceweeklyprogress")
    .setDescription(
      "Announces users who completed their goals and those who didn't"
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    function formatDateForPostgres(date: Date): string {
      return date.toISOString().split("T")[0];
    }

    await interaction.deferReply();
    const startOfWeek = getStartOfWeek();
    const endOfWeek = getEndOfWeek();

    const startOfWeekStr = formatDateForPostgres(startOfWeek);
    const endOfWeekStr = formatDateForPostgres(endOfWeek);

    try {
      const usersWithGoals = await db
      .select({
        userId: users.userId,
        discordUsername: users.discordUsername,
        totalGoals: sql`count(${weeklyUserGoals.goalId})`,
        completedGoals: sql`sum(case when ${weeklyUserGoals.isCompleted} then 1 else 0 end)`,
      })
      .from(users)
      .innerJoin(weeklyUserGoals, eq(users.userId, weeklyUserGoals.userId))
      .where(
        and(
          gte(weeklyUserGoals.weekStart, startOfWeekStr),
          lte(weeklyUserGoals.weekStart, endOfWeekStr)
        )
      )
      .groupBy(users.userId, users.discordUsername);

    const DEPOSIT_AMOUNT = 10;
    const totalUsers = usersWithGoals.length;
    const totalDeposit = totalUsers * DEPOSIT_AMOUNT;
    const usersWithAllGoalsCompleted = usersWithGoals.filter(user => user.totalGoals === user.completedGoals);
    const completedUsers = usersWithAllGoalsCompleted.length;
    const payoutPerUser = completedUsers > 0 ? totalDeposit / completedUsers : 0;

    const completedEmbed = new EmbedBuilder()
      .setTitle("Users Who Completed All Their Goals This Week")
      .setColor("#00FF00")
      .setDescription(`Payout per user: $${payoutPerUser.toFixed(2)}`)
      .setTimestamp();

    const incompleteEmbed = new EmbedBuilder()
      .setTitle("Users Who Have Not Completed All Their Goals This Week")
      .setColor("#FF0000")
      .setTimestamp();

    usersWithGoals.forEach((user) => {
      const embed = user.totalGoals === user.completedGoals ? completedEmbed : incompleteEmbed;
      const payout = user.totalGoals === user.completedGoals ? payoutPerUser : 0;
      embed.addFields({
        name: user.discordUsername || `User ${user.userId}`,
        value: `Completed ${user.completedGoals}/${user.totalGoals} goals | Payout: $${payout.toFixed(2)}`,
        inline: false,
      });
    });

    await interaction.editReply({
      content: `Total payout to be distributed: $${totalDeposit.toFixed(2)}`,
      embeds: [completedEmbed, incompleteEmbed],
    });
    } catch (error) {
      console.error("Error announcing weekly progress:", error);
      await interaction.editReply(
        "An error occurred while announcing weekly progress."
      );
    }
  },
};

export default command;
