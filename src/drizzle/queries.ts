import { eq, and, sql } from "drizzle-orm";
import { db } from "./db.js";
import { users, weeklyUserGoals, weeklyImplementationIntentions, bubbleTransactions } from "./schema.js";
import { getStartOfWeek, getStartOfWeekV2 } from "../helpers/date-helpers.js";
import { formatDateForPostgres } from "../helpers/format-date-for-postgres.js";

export async function setWeekGoal(
  discordId: string,
  discordUsername: string,
  activityName: string,
  targetFrequency: number
) {
  return await db.transaction(async (tx) => {
    // Get or create user (your existing logic)
    let user = await tx
      .select()
      .from(users)
      .where(eq(users.discordId, discordId))
      .limit(1);

    if (user.length === 0) {
      const newUser = await tx
        .insert(users)
        .values({
          discordId,
          discordUsername,
        })
        .returning();
      user = newUser;
    } else {
      await tx
        .update(users)
        .set({ discordUsername })
        .where(eq(users.discordId, discordId));
    }

    const weekStartStr = (await getStartOfWeekV2(discordId)).toISOString().split('T')[0];

    // Check for existing deposit this week
    const existingDeposit = await tx.query.bubbleTransactions.findFirst({
      where: and(
        eq(bubbleTransactions.userId, user[0].userId),
        eq(bubbleTransactions.weekStart, weekStartStr),
        eq(bubbleTransactions.type, 'WEEKLY_DEPOSIT')
      )
    });

    // If no deposit exists yet, check balance before proceeding
    if (!existingDeposit) {
      const DEPOSIT_AMOUNT = 5;
      
      // Check if user has sufficient balance
      if (user[0].balance < DEPOSIT_AMOUNT) {
        throw new Error(`Insufficient balance. You need ${DEPOSIT_AMOUNT} bubbles to set a goal.`);
      }
    }

    // Create the new goal
    const [newGoal] = await tx.insert(weeklyUserGoals).values({
      userId: user[0].userId,
      weekStart: weekStartStr,
      activityName,
      targetFrequency,
    }).returning();

    // If no deposit exists yet, create one and update balance
    if (!existingDeposit) {
      const DEPOSIT_AMOUNT = 5;
      
      await tx.insert(bubbleTransactions).values({
        userId: user[0].userId,
        amount: -DEPOSIT_AMOUNT,
        type: 'WEEKLY_DEPOSIT',
        weekStart: weekStartStr,
        description: 'Weekly goals deposit'
      });

      await tx.update(users)
        .set({ balance: sql`balance - ${DEPOSIT_AMOUNT}` })
        .where(eq(users.userId, user[0].userId));
    }

    return newGoal;
  });
}

export async function setImplementationIntention(
  discordId: string,
  discordUsername: string,
  behavior: string,
  time: string,
  location: string
) {
  // Try to get the user
  let user = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (user.length === 0) {
    const newUser = await db
      .insert(users)
      .values({
        discordId,
        discordUsername,
      })
      .returning();
    user = newUser;
  } else {
    await db
      .update(users)
      .set({ discordUsername })
      .where(eq(users.discordId, discordId));
  }

  const weekStartStr = (await getStartOfWeekV2(discordId)).toISOString().split('T')[0];

  // Insert the new implementation intention
  const newII = await db
    .insert(weeklyImplementationIntentions)
    .values({
      userId: user[0].userId,
      behavior,
      time,
      location,
      weekStart: weekStartStr,
    })
    .returning();

  return newII[0];
}

export async function insertDummyData() {
  // Insert a new user
  const [newUser] = await db.insert(users).values({
    discordUsername: 'JohnDoe',
    discordId: '123456789',
  }).returning({ userId: users.userId });

  // Get the current week's start date
  const currentWeekStartStr = (await getStartOfWeekV2('123456789')).toISOString().split('T')[0];

  // Insert two goals for the new user
  await db.insert(weeklyUserGoals).values([
    {
      userId: newUser.userId,
      weekStart: currentWeekStartStr,
      activityName: 'Running',
      targetFrequency: 3,
    },
    {
      userId: newUser.userId,
      weekStart: currentWeekStartStr,
      activityName: 'Meditation',
      targetFrequency: 5,
    },
  ]);

  console.log('Dummy data inserted successfully');
}

export async function processWeeklyPayouts(weekStart: Date) {
  return await db.transaction(async (tx) => {
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    // Get all deposits for the week
    const deposits = await tx.query.bubbleTransactions.findMany({
      where: and(
        eq(bubbleTransactions.weekStart, weekStartStr),
        eq(bubbleTransactions.type, 'WEEKLY_DEPOSIT')
      )
    });
    
    const totalPool = Math.abs(deposits.reduce((sum, d) => sum + d.amount, 0));
    
    // Get all users who had goals this week and their completion status
    const usersWithGoals = await tx
      .select({
        userId: users.userId,
        totalGoals: sql<number>`count(${weeklyUserGoals.goalId})`,
        completedGoals: sql<number>`sum(case when ${weeklyUserGoals.isCompleted} then 1 else 0 end)`,
      })
      .from(users)
      .innerJoin(weeklyUserGoals, eq(users.userId, weeklyUserGoals.userId))
      .where(eq(weeklyUserGoals.weekStart, weekStartStr))
      .groupBy(users.userId);

    // Filter for users who completed all goals
    const successfulUsers = usersWithGoals.filter(
      user => user.totalGoals > 0 && user.totalGoals === user.completedGoals
    );

    if (successfulUsers.length === 0) {
      // No winners - return deposits to all users who participated
      for (const deposit of deposits) {
        await tx.insert(bubbleTransactions).values({
          userId: deposit.userId,
          amount: Math.abs(deposit.amount), // Make positive for refund
          type: 'DEPOSIT_REFUND',
          weekStart: weekStartStr,
          description: 'Deposit refunded - no users completed all goals'
        });

        await tx.update(users)
          .set({ balance: sql`balance + ${Math.abs(deposit.amount)}` })
          .where(eq(users.userId, Number(deposit.userId)));
      }

      return {
        totalPool,
        successfulUsers: [],
        PayoutPerSuccessfulUser: 0,
        refunded: true,
        totalUsers: deposits.length,  // Add this line
        error: null
      };
    }

    const PayoutPerSuccessfulUser = Math.floor(totalPool / successfulUsers.length);

    // Process payouts for each successful user
    for (const user of successfulUsers) {
      await tx.insert(bubbleTransactions).values({
        userId: user.userId,
        amount: PayoutPerSuccessfulUser,
        type: 'WEEKLY_PAYOUT',
        weekStart: weekStartStr,
        description: `Weekly payout for completing ${user.totalGoals} goals`
      });

      await tx.update(users)
        .set({ balance: sql`balance + ${PayoutPerSuccessfulUser}` })
        .where(eq(users.userId, user.userId));
    }

    return {
      totalPool,
      successfulUsers,
      PayoutPerSuccessfulUser,
      totalUsers: deposits.length,  // Add this line
      error: null
    };
  });
}

export async function testWeeklyPayout() {
  try {
    // Run tests independently
    try {
      console.log('\n--- Running Initial Test ---');
      await runInitialTest();
    } catch (error) {
      console.error('Initial test failed:', error);
    }

    try {
      console.log('\n--- Running Multiple Goals Test ---');
      await runMultipleGoalsTest();
    } catch (error) {
      console.error('Multiple goals test failed:', error);
    }

    try {
      console.log('\n--- Running Different Weeks Test ---');
      await runDifferentWeeksTest();
    } catch (error) {
      console.error('Different weeks test failed:', error);
    }

  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
}

async function runInitialTest() {
  // Create test users
  const [user1] = await db.insert(users).values({
    discordUsername: 'TestUser1',
    discordId: 'test1',
    balance: 100,
  }).returning();

  const [user2] = await db.insert(users).values({
    discordUsername: 'TestUser2',
    discordId: 'test2',
    balance: 100,
  }).returning();

  try {
    // Get current week start using existing function
    const weekStart = await getStartOfWeekV2(user1.discordId!);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Create goals for both users
    await db.insert(weeklyUserGoals).values([
      {
        userId: user1.userId,
        weekStart: weekStartStr,
        activityName: 'Test Goal 1',
        targetFrequency: 1,
        isCompleted: true,
        currentProgress: 1
      },
      {
        userId: user2.userId,
        weekStart: weekStartStr,
        activityName: 'Test Goal 2',
        targetFrequency: 1,
        isCompleted: false,
        currentProgress: 0
      }
    ]);

    // Simulate deposits
    await db.insert(bubbleTransactions).values([
      {
        userId: user1.userId,
        amount: -5,
        type: 'WEEKLY_DEPOSIT',
        weekStart: weekStartStr,
        description: 'Test deposit'
      },
      {
        userId: user2.userId,
        amount: -5,
        type: 'WEEKLY_DEPOSIT',
        weekStart: weekStartStr,
        description: 'Test deposit'
      }
    ]);

    // Process payouts
    const result = await processWeeklyPayouts(weekStart);
    console.log('Initial Test Result:', result);
  } finally {
    // Cleanup
    await cleanup([user1.userId, user2.userId]);
  }
}

async function runMultipleGoalsTest() {
  // Create test users
  const [user1] = await db.insert(users).values({
    discordUsername: 'TestUser1',
    discordId: 'test1',
    balance: 100,
  }).returning();

  const [user2] = await db.insert(users).values({
    discordUsername: 'TestUser2',
    discordId: 'test2',
    balance: 100,
  }).returning();

  try {
    const weekStart = await getStartOfWeekV2(user1.discordId!);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Create multiple goals for each user
    await db.insert(weeklyUserGoals).values([
      {
        userId: user1.userId,
        weekStart: weekStartStr,
        activityName: 'Test Goal 1b',
        targetFrequency: 1,
        isCompleted: true,
        currentProgress: 1
      },
      {
        userId: user1.userId,
        weekStart: weekStartStr,
        activityName: 'Test Goal 1c',
        targetFrequency: 1,
        isCompleted: false, // User1 completes 1/2 goals
        currentProgress: 0
      },
      {
        userId: user2.userId,
        weekStart: weekStartStr,
        activityName: 'Test Goal 2b',
        targetFrequency: 1,
        isCompleted: true,
        currentProgress: 1
      },
      {
        userId: user2.userId,
        weekStart: weekStartStr,
        activityName: 'Test Goal 2c',
        targetFrequency: 1,
        isCompleted: true, // User2 completes 2/2 goals
        currentProgress: 1
      }
    ]);

    // Simulate deposits
    await db.insert(bubbleTransactions).values([
      {
        userId: user1.userId,
        amount: -5,
        type: 'WEEKLY_DEPOSIT',
        weekStart: weekStartStr,
        description: 'Test deposit'
      },
      {
        userId: user2.userId,
        amount: -5,
        type: 'WEEKLY_DEPOSIT',
        weekStart: weekStartStr,
        description: 'Test deposit'
      }
    ]);

    // Process payouts
    const result = await processWeeklyPayouts(weekStart);
    console.log('Multiple Goals Test Result:', result);
  } finally {
    // Cleanup
    await cleanup([user1.userId, user2.userId]);
  }
}


async function runDifferentWeeksTest() {
  // Create test user
  const [user1] = await db.insert(users).values({
    discordUsername: 'TestUser1',
    discordId: 'test1',
    balance: 100,
  }).returning();

  try {
    const weekStart = await getStartOfWeekV2(user1.discordId!);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Create goals for different weeks
    await db.insert(weeklyUserGoals).values([
      {
        userId: user1.userId,
        weekStart: lastWeekStartStr,
        activityName: 'Old Goal',
        targetFrequency: 1,
        isCompleted: true,
        currentProgress: 1
      },
      {
        userId: user1.userId,
        weekStart: weekStartStr,
        activityName: 'Current Goal',
        targetFrequency: 1,
        isCompleted: true,
        currentProgress: 1
      }
    ]);

    // Simulate deposits for both weeks
    await db.insert(bubbleTransactions).values([
      {
        userId: user1.userId,
        amount: -5,
        type: 'WEEKLY_DEPOSIT',
        weekStart: lastWeekStartStr,
        description: 'Last week deposit'
      },
      {
        userId: user1.userId,
        amount: -5,
        type: 'WEEKLY_DEPOSIT',
        weekStart: weekStartStr,
        description: 'Current week deposit'
      }
    ]);

    // Process payouts for last week
    const lastWeekResult = await processWeeklyPayouts(lastWeekStart);
    console.log('Last Week Test Result:', lastWeekResult);

    // Process payouts for current week
    const currentWeekResult = await processWeeklyPayouts(weekStart);
    console.log('Current Week Test Result:', currentWeekResult);
  } finally {
    // Cleanup
    await cleanup([user1.userId]);
  }
}

async function cleanup(userIds: number[]) {
  await db.delete(bubbleTransactions)
    .where(sql`${bubbleTransactions.userId} in ${userIds}`);
  await db.delete(weeklyUserGoals)
    .where(sql`${weeklyUserGoals.userId} in ${userIds}`);
  await db.delete(users)
    .where(sql`${users.userId} in ${userIds}`);
}