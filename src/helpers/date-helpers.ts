/**
 * Calculates the start date of the current week (Monday at 00:00:00.000) in Pacific Time.
 *
 * @param {Date} [inputDate=new Date()] - The input date to calculate from
 * @returns {Date} The Date object representing the start of the week (Monday 00:00:00.000) in Pacific Time
 */
import { DateTime } from 'luxon';

export function getStartOfWeek(date = new Date()) {
  // Explicitly handle the input date as UTC and convert to Pacific time
  const pacificDate = DateTime.fromJSDate(date)
    .setZone('America/Los_Angeles', { keepLocalTime: true });
  
  const daysToSubtract = pacificDate.weekday === 7 ? 6 : pacificDate.weekday - 1;
  
  return pacificDate
    .minus({ days: daysToSubtract })
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
  const pacificDate = DateTime.fromJSDate(date, { zone: 'America/Los_Angeles' });
  
  // Get to Monday by subtracting days
  const daysToSubtract = pacificDate.weekday === 7 ? 6 : pacificDate.weekday - 1;
  
  // Get to Monday then add 6 days to get to Sunday and set to end of day
  return pacificDate
    .minus({ days: daysToSubtract }) // Get to Monday
    .plus({ days: 6 }) // Add 6 days to get to Sunday
    .endOf('day') // Set to last second of the day
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
