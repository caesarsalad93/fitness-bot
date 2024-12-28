import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, User } from "discord.js";
import { db } from "../drizzle/db.js";
import { users, weeklyUserGoals } from "../drizzle/schema.js";
import { eq, and, gte, lt } from "drizzle-orm";
import nlp from "compromise";
import { groupSimilarActivities } from "../helpers/activity-grouping.js";

const command = {
  data: new SlashCommandBuilder()
    .setName("fitnesswrapped")
    .setDescription("View your or someone else's fitness journey for the past year")
    .addStringOption(option =>
      option.setName('username')
        .setDescription('The Discord username to get wrapped data for (defaults to you)')
        .setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const targetUsername = interaction.options.getString('username');
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    
    await interaction.deferReply();

    try {
      let targetUserId;
      if (targetUsername) {
        // Query the database to find the user by username
        const [targetUser] = await db
          .select()
          .from(users)
          .where(eq(users.discordUsername, targetUsername));

        if (!targetUser) {
          await interaction.editReply(`Could not find user with username "${targetUsername}"`);
          return;
        }
        targetUserId = targetUser.discordId;
      } else {
        targetUserId = interaction.user.id;
      }

      const stats = await calculateUserStats(targetUserId!, yearAgo);
      const displayName = targetUsername ?? interaction.user.username;
      await sendWrappedResponse(interaction, displayName, stats);
    } catch (error) {
      console.error('Error generating fitness wrapped:', error);
      await interaction.editReply('Sorry, there was an error generating the fitness wrapped.');
    }
  }
};

interface WrappedStats {
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
  longestStreak: number;
  currentStreak: number;
  perfectWeeks: number;
  topActivities: Array<{
    activity: string;
    count: number;
    completionRate: number;
  }>;
}

async function calculateUserStats(discordId: string, startDate: Date): Promise<WrappedStats> {
  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId));

  if (!user) {
    throw new Error('User not found');
  }

  // Get all goals from the past year
  const goals = await db
    .select()
    .from(weeklyUserGoals)
    .where(
      and(
        eq(weeklyUserGoals.userId, user.userId),
        gte(weeklyUserGoals.weekStart, startDate.toISOString().split('T')[0])
      )
    );

  // Group similar activities
  const groupedActivities = groupSimilarActivities(goals);
  
  // Add logging for category mapping
  console.log('\n=== Activity Categorization ===');
  groupedActivities.forEach((activities, category) => {
    console.log(`\nCategory: ${category}`);
    console.log('Activities:', activities.map(g => g.activityName).join(', '));
  });
  console.log('===========================\n');

  // Calculate top activities
  const topActivities = Array.from(groupedActivities.entries())
    .map(([name, activities]) => ({
      activity: name,
      count: activities.length,
      completionRate: activities.filter(g => g.isCompleted).length / activities.length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let currentStreakCount = 0;

  // Group goals by week
  const goalsByWeek = goals.reduce((acc, goal) => {
    const week = goal.weekStart;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(goal);
    return acc;
  }, {} as Record<string, typeof goals>);

  // Calculate streaks by checking if all goals in each week were completed
  const weeks = Object.entries(goalsByWeek)
    .sort(([weekA], [weekB]) => weekA.localeCompare(weekB));

  let perfectWeeks = 0;

  console.log('\n=== Weekly Completion Status ===');
  // Calculate perfect weeks while processing streaks
  for (const [weekStart, weekGoals] of weeks) {
    const allCompleted = weekGoals.every(goal => goal.isCompleted);
    console.log(`Week ${weekStart}: ${allCompleted ? '✅ All Complete' : '❌ Some Incomplete'} (${weekGoals.length} goals)`);
    
    if (allCompleted) {
      currentStreakCount++;
      longestStreak = Math.max(longestStreak, currentStreakCount);
      perfectWeeks++;
    } else {
      currentStreakCount = 0;
    }
  }
  console.log('===========================\n');
  
  currentStreak = currentStreakCount;

  return {
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.isCompleted).length,
    completionRate: goals.length > 0 ? goals.filter(g => g.isCompleted).length / goals.length : 0,
    longestStreak,
    currentStreak,
    perfectWeeks,
    topActivities
  };
}

async function sendWrappedResponse(
  interaction: ChatInputCommandInteraction, 
  targetUsername: string | null, 
  stats: WrappedStats
) {
  const embed = new EmbedBuilder()
    .setTitle(`🎉 ${targetUsername ?? interaction.user.username}'s Fitness Wrapped 2024`)
    .setColor("#00ff00")
    .addFields([
      {
        name: "📊 Overall Stats",
        value: [
          `Total Goals Set: ${stats.totalGoals}`,
          `Goals Completed: ${stats.completedGoals}`,
          `Completion Rate: ${(stats.completionRate * 100).toFixed(1)}%`,
          `Perfect Weeks: ${stats.perfectWeeks}`
        ].join('\n'),
        inline: false
      },
      {
        name: "🔥 Streaks",
        value: [
          `Longest Streak: ${stats.longestStreak} weeks`,
          `Current Streak: ${stats.currentStreak} weeks`
        ].join('\n'),
        inline: false
      },
      {
        name: "🎯 Top Activities",
        value: stats.topActivities
          .map(activity => 
            `${activity.activity}: ${activity.count} times (${(activity.completionRate * 100).toFixed(1)}% completion)`)
          .join('\n'),
        inline: false
      }
    ]);

  await interaction.editReply({ embeds: [embed] });
}

export default command; 