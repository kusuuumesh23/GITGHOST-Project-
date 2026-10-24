import { formatInTimeZone } from 'date-fns-tz';

/**
 * Returns today's date in YYYY-MM-DD format for a given timezone.
 * Defaults to UTC if invalid timezone is provided.
 */
export function getBusinessDateString(timezone: string = 'UTC', date: Date = new Date()): string {
  try {
    return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  } catch {
    return formatInTimeZone(date, 'UTC', 'yyyy-MM-dd');
  }
}

/**
 * Validates whether a given timezone string is recognized by the Intl API.
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
