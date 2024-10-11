/**
 * Calculates the start date of the current week (Monday at 00:00:00.000).
 * 
 * @returns {Date} The Date object representing the start of the current week
 */
export function getStartOfWeek(): Date {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  return startOfWeek;
}

/**
 * Calculates the end date of the current week (Sunday at 23:59:59.999).
 * 
 * @returns {Date} The Date object representing the end of the current week
 */
export function getEndOfWeek(): Date {
  const startOfWeek = getStartOfWeek();
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}
