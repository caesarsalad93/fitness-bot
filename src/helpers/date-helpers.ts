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
