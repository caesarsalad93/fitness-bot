import { describe, test, expect } from 'vitest';
import { getStartOfWeek } from './date-helpers';
import { DateTime } from 'luxon';

describe('getStartOfWeek', () => {
  test('returns Monday 00:00:00 when given a date mid-week in Pacific time', () => {
    // Wednesday, March 13, 2024
    const date = DateTime.fromISO('2024-03-13T15:30:00', { zone: 'America/Los_Angeles' }).toJSDate();
    const result = getStartOfWeek(date, 'America/Los_Angeles');
    
    const resultInPacific = DateTime.fromJSDate(result).setZone('America/Los_Angeles');
    expect(resultInPacific.year).toBe(2024);
    expect(resultInPacific.month).toBe(3); // March
    expect(resultInPacific.day).toBe(11); // Should be Monday March 11
    expect(resultInPacific.hour).toBe(0);
    expect(resultInPacific.minute).toBe(0);
    expect(resultInPacific.second).toBe(0);
    expect(resultInPacific.millisecond).toBe(0);
  });

  test('returns Monday 00:00:00 when given a date mid-week in Eastern time', () => {
    // Wednesday, March 13, 2024
    const date = DateTime.fromISO('2024-03-13T15:30:00', { zone: 'America/New_York' }).toJSDate();
    const result = getStartOfWeek(date, 'America/New_York');
    
    const resultInEastern = DateTime.fromJSDate(result).setZone('America/New_York');
    expect(resultInEastern.year).toBe(2024);
    expect(resultInEastern.month).toBe(3); // March
    expect(resultInEastern.day).toBe(11); // Should be Monday March 11
    expect(resultInEastern.hour).toBe(0);
    expect(resultInEastern.minute).toBe(0);
  });

  test('handles current time in different timezones', () => {
    const resultPacific = getStartOfWeek(undefined, 'America/Los_Angeles');
    const resultEastern = getStartOfWeek(undefined, 'America/New_York');
    
    const pacificDateTime = DateTime.fromJSDate(resultPacific).setZone('America/Los_Angeles');
    const easternDateTime = DateTime.fromJSDate(resultEastern).setZone('America/New_York');
    
    // Both should be at 00:00:00 in their respective timezones
    expect(pacificDateTime.hour).toBe(0);
    expect(easternDateTime.hour).toBe(0);
    
    // Both should be on the same day in their respective timezones
    expect(pacificDateTime.weekday).toBe(1); // Monday
    expect(easternDateTime.weekday).toBe(1); // Monday
  });

  test('returns previous Monday when given a Sunday', () => {
    // Test cases for different timezone scenarios
    const testCases = [
      {
        timezone: 'America/Los_Angeles',
        // Sunday March 17, 2024 3:30 PM Pacific
        input: '2024-03-17T15:30:00',
        expectedMonday: {
          year: 2024,
          month: 3,
          day: 11
        }
      },
      {
        timezone: 'Asia/Tokyo',
        // Sunday March 17, 2024 3:30 PM Tokyo
        // (This is a different instant in time than the Pacific test)
        input: '2024-03-17T15:30:00',
        expectedMonday: {
          year: 2024,
          month: 3,
          day: 11
        }
      }
    ];

    testCases.forEach(({ timezone, input, expectedMonday }) => {
      const date = DateTime.fromISO(input, { zone: timezone }).toJSDate();
      const result = getStartOfWeek(date, timezone);
      const localDateTime = DateTime.fromJSDate(result).setZone(timezone);

      expect(localDateTime.weekday).toBe(1); // Monday
      expect(localDateTime.hour).toBe(0);
      expect(localDateTime.minute).toBe(0);
      expect(localDateTime.second).toBe(0);
      expect(localDateTime.year).toBe(expectedMonday.year);
      expect(localDateTime.month).toBe(expectedMonday.month);
      expect(localDateTime.day).toBe(expectedMonday.day);
    });
  });

  test('handles month boundaries correctly in different timezones', () => {
    // Wednesday, April 3, 2024
    const date = DateTime.fromISO('2024-04-03T15:30:00', { zone: 'Europe/London' }).toJSDate();
    const result = getStartOfWeek(date, 'Europe/London');
    
    const londonDateTime = DateTime.fromJSDate(result).setZone('Europe/London');
    expect(londonDateTime.year).toBe(2024);
    expect(londonDateTime.month).toBe(4); // April
    expect(londonDateTime.day).toBe(1); // Should be Monday April 1
    expect(londonDateTime.hour).toBe(0);
  });
});