/**
 * Calculates the start date of the current week (Monday at 00:00:00.000) in Pacific Time.
 *
 * @param {Date} [inputDate=new Date()] - The input date to calculate from
 * @returns {Date} The Date object representing the start of the week (Monday 00:00:00.000) in Pacific Time
 */
export function getStartOfWeek(inputDate = new Date()) {
  // Convert input date to Pacific Time
  const pacificDate = new Date(inputDate.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles"
  }));
  
  // Get day of week in Pacific Time
  const currentDay = pacificDate.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

  // Set to start of day and adjust to Monday
  pacificDate.setHours(0, 0, 0, 0);
  pacificDate.setDate(pacificDate.getDate() - daysToMonday);

  // Convert back to UTC while preserving Pacific Time values
  const utcDate = new Date(pacificDate.toLocaleString("en-US", {
    timeZone: "UTC"
  }));

  return utcDate;
}

/**
 * Calculates the end date of the current week (Sunday at 23:59:59.999) in Pacific Time.
 *
 * @param {Date} [inputDate=new Date()] - The input date to calculate from
 * @returns {Date} The Date object representing the end of the week (Sunday 23:59:59.999) in Pacific Time
 */
export function getEndOfWeek(inputDate = new Date()) {
  // Convert input date to Pacific Time
  const pacificDate = new Date(inputDate.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles"
  }));
  
  // Get day of week in Pacific Time
  const currentDay = pacificDate.getDay();
  const daysToSunday = currentDay === 0 ? 0 : 7 - currentDay;

  // Set to end of day and adjust to Sunday
  pacificDate.setHours(23, 59, 59, 999);
  pacificDate.setDate(pacificDate.getDate() + daysToSunday);

  // Convert back to UTC while preserving Pacific Time values
  const utcDate = new Date(pacificDate.toLocaleString("en-US", {
    timeZone: "UTC"
  }));

  return utcDate;
}

/**
 * Helper function to format a date in YYYY-MM-DD format in Pacific Time
 * 
 * @param {Date} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatDatePacific(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles"
  });
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
