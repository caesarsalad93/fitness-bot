/**
 * Calculates the start date of the current week (Monday at 00:00:00.000).
 *
 * @param {Date} [inputDate=new Date()] - The input date to calculate from
 * @returns {Date} The Date object representing the start of the week (Monday 00:00:00.000)
 */
export function getStartOfWeek(inputDate = new Date()) {
  const date = new Date(inputDate);
  const currentDay = date.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysToMonday);

  return date;
}

/**
 * Calculates the end date of the current week (Sunday at 23:59:59.999).
 *
 * @param {Date} [inputDate=new Date()] - The input date to calculate from
 * @returns {Date} The Date object representing the end of the week (Sunday 23:59:59.999)
 */
export function getEndOfWeek(inputDate = new Date()) {
  const date = new Date(inputDate);
  const currentDay = date.getDay();
  const daysToSunday = currentDay === 0 ? 0 : 7 - currentDay;

  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + daysToSunday);

  return date;
}

export function getNextMonday() {
  // Get current date in Pacific time
  const pacificTime = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles"
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
    timeZone: "America/Los_Angeles"
  });
  const currentDate = new Date(pacificTime);
  
  // Get next Monday midnight
  const nextMonday = getNextMonday();
  
  // Calculate time difference in milliseconds
  const timeLeftInMs = nextMonday.getTime() - currentDate.getTime();
  
  // Convert to hours and minutes
  const hoursLeft = Math.floor(timeLeftInMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeftInMs % (1000 * 60 * 60)) / (1000 * 60));
  
  // Format message
  const timeLeftMessage = `Time left in the week: ${hoursLeft} hours and ${minutesLeft} minutes.`;
  
  return {
    hoursLeft,
    minutesLeft,
    timeLeftMessage
  };
}
