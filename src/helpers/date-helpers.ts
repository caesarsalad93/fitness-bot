/**
 * Calculates the start date of the current week (Monday at 00:00:00.000).
 * 
 * @returns {Date} The Date object representing the start of the current week
 */
export function getStartOfWeek(inputDate = new Date()) {
  const date = new Date(inputDate);
  
  const currentDay = date.getDay();
  const daysToMonday = currentDay === 0 
      ? 6
      : currentDay - 1;
  
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysToMonday);
  
  // Format to YYYY-MM-DD
  return date.toISOString().split('T')[0];
}

/**
 * Calculates the end date of the current week (Sunday at 23:59:59.999).
 * 
 * @returns {Date} The Date object representing the end of the current week
 */
export function getEndOfWeek(inputDate = new Date()) {
  const date = new Date(inputDate);
  
  const currentDay = date.getDay();
  const daysToSunday = currentDay === 0 
      ? 0
      : 7 - currentDay;
  
  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + daysToSunday);
  
  // Format to YYYY-MM-DD
  return date.toISOString().split('T')[0];
}
