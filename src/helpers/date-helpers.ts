/**
 * Calculates the start date of the current week (Monday at 00:00:00.000) in Pacific Time.
 *
 * @param {Date} [inputDate=new Date()] - The input date to calculate from
 * @returns {Date} The Date object representing the start of the week (Monday 00:00:00.000) in Pacific Time
 */
import { DateTime } from 'luxon';
import { db } from '../drizzle/db.js';
import { users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

// Add this new function first
async function getUserTimezone(discordId: string): Promise<string> {
  const user = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);
    
  return user[0]?.timezone || 'America/Los_Angeles';
}

export function getStartOfWeek(date?: Date, timezone = 'America/Los_Angeles') {
  // If no date provided, use current moment
  if (!date) {
    return DateTime.now()
      .setZone(timezone)
      .startOf('week')
      .set({ weekday: 1 })
      .startOf('day')
      .toJSDate();
  }
  
  // For provided dates, convert that moment to target timezone
  return DateTime.fromJSDate(date)
    .setZone(timezone)
    .startOf('week')
    .set({ weekday: 1 })
    .startOf('day')
    .toJSDate();
}

/**
 * Calculates the start date of the week in user's timezone
 * @param discordId The user's Discord ID
 * @param date Optional date to calculate from
 * @returns Date object representing start of week in user's timezone
 */
// Add new versions with 'V2' suffix to avoid conflicts
export async function getStartOfWeekV2(discordId?: string, date?: Date): Promise<Date> {
  const timezone = discordId 
    ? await getUserTimezone(discordId)
    : 'America/Los_Angeles';

  if (!date) {
    return DateTime.now()
      .setZone(timezone)
      .startOf('week')
      .set({ weekday: 1 })
      .startOf('day')
      .toJSDate();
  }
  
  return DateTime.fromJSDate(date)
    .setZone(timezone)
    .startOf('week')
    .set({ weekday: 1 })
    .startOf('day')
    .toJSDate();
}
/**
 * Calculates the end date of the current week (Sunday at 23:59:59.999) in Pacific Time.
 *
 * @param {Date} [inputDate=new Date()] - The input date to calculate from
 * @returns {Date} The Date object representing the end of the week (Sunday 23:59:59.999) in Pacific Time
 */
export function getEndOfWeek(date = new Date()) {
  // Convert Date object to DateTime in Pacific Time
  const pacificDate = DateTime.fromJSDate(date)
    .setZone('America/Los_Angeles', { keepLocalTime: true });
  
  // Calculate days until Sunday (if today is Monday, we need 6 days)
  const daysToAdd = 7 - pacificDate.weekday;
  
  return pacificDate
    .plus({ days: daysToAdd })
    .endOf('day')
    .toJSDate();
}
/**
 * Calculates the end date of the week in user's timezone
 * @param discordId The user's Discord ID
 * @param date Optional date to calculate from
 * @returns Date object representing end of week in user's timezone
 */
export async function getEndOfWeekV2(discordId: string, date?: Date) {
  const timezone = await getUserTimezone(discordId);
  
  const dateTime = date 
    ? DateTime.fromJSDate(date)
    : DateTime.now();
    
  return dateTime
    .setZone(timezone)
    .endOf('week')
    .set({ weekday: 7 })
    .endOf('day')
    .toJSDate();
}

/**
 * Helper function to format a date in YYYY-MM-DD format in Pacific Time
 *
 * @param {Date} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatDatePacific(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

export function getNextMonday() {
  // Get current date in Pacific time
  const pacificTime = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  const currentDate = new Date(pacificTime);

  // Calculate days until next Monday
  const daysUntilMonday = (8 - currentDate.getDay()) % 7;

  // Create date for next Monday at midnight Pacific time
  const nextMonday = new Date(currentDate);
  nextMonday.setDate(currentDate.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  return nextMonday;
}

export function getTimeLeftInWeek() {
  // Get current time in Pacific
  const pacificTime = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  const currentDate = new Date(pacificTime);

  // Get next Monday midnight
  const nextMonday = getNextMonday();

  // Calculate time difference in milliseconds
  const timeLeftInMs = nextMonday.getTime() - currentDate.getTime();

  // Convert to hours and minutes
  const hoursLeft = Math.floor(timeLeftInMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor(
    (timeLeftInMs % (1000 * 60 * 60)) / (1000 * 60)
  );

  // Format message
  const timeLeftMessage = `Time left in the week: ${hoursLeft} hours and ${minutesLeft} minutes.`;

  return {
    hoursLeft,
    minutesLeft,
    timeLeftMessage,
  };
}

/**
 * Gets time left in the week for a specific user's timezone
 * @param discordId The user's Discord ID
 */
export async function getTimeLeftInWeekV2(discordId: string) {
  const timezone = await getUserTimezone(discordId);
  const now = DateTime.now().setZone(timezone);
  const endOfWeek = now.endOf('week').set({ weekday: 7 });
  
  const diff = endOfWeek.diff(now, ['hours', 'minutes']).toObject();
  const hoursLeft = Math.floor(diff.hours || 0);
  const minutesLeft = Math.floor(diff.minutes || 0);

  return {
    hoursLeft,
    minutesLeft,
    timeLeftMessage: `Time left in the week: ${hoursLeft} hours and ${minutesLeft} minutes.`
  };
}
