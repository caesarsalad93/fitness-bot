import { describe, test, expect } from 'vitest';
import { getStartOfWeek } from './date-helpers';

describe('getStartOfWeek', () => {
  // Helper function to create dates
  const mockDate = (dateString: string) => new Date(dateString);

  test('returns Monday 00:00:00 when given a date mid-week', () => {
    // Wednesday, March 13, 2024
    const date = mockDate('2024-03-13T15:30:00');
    const result = getStartOfWeek(date);
    
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2); // March (0-based)
    expect(result.getDate()).toBe(11); // Should be Monday March 11
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  test('returns previous Monday when given a Sunday', () => {
    // Sunday, March 17, 2024
    const date = mockDate('2024-03-17T15:30:00');
    const result = getStartOfWeek(date);
    
    expect(result.getDate()).toBe(11); // Should be Monday March 11
    expect(result.getHours()).toBe(0);
  });

  test('returns same day when given a Monday', () => {
    // Monday, March 11, 2024
    const date = mockDate('2024-03-11T15:30:00');
    const result = getStartOfWeek(date);
    
    expect(result.getDate()).toBe(11); // Should be Monday March 11
    expect(result.getHours()).toBe(0);
  });

  test('handles month boundaries correctly', () => {
    // Wednesday, April 3, 2024
    const date = mockDate('2024-04-03T15:30:00');
    const result = getStartOfWeek(date);
    
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(1); // Should be Monday April 1
    expect(result.getHours()).toBe(0);
  });
});