import { parse, format } from 'date-fns'

/**
 * Parses a date string (YYYY-MM-DD or ISO format) as a local Date at midnight.
 * This avoids timezone issues where new Date("2024-01-17") would parse as UTC midnight,
 * causing the date to display as the previous day in western timezones.
 */
export function parseDateAsLocal(dateStr: string): Date {
  // Handle YYYY-MM-DD format (stored date without time)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Handle ISO format with time component - extract just the date part
  // and create a local date to avoid timezone shifts
  if (dateStr.includes('T')) {
    const datePart = dateStr.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Fallback: try to parse and extract date components
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  }

  // Last resort: return invalid date (caller should handle)
  return new Date(NaN)
}

/**
 * Formats a 24-hour time string (HH:mm) to 12-hour format (h:mm a)
 * Example: "14:30" -> "2:30 PM"
 * Returns the original string if it can't be parsed.
 */
export function formatTime12Hour(time: string): string {
  if (!time || typeof time !== 'string') {
    return ''
  }

  // Normalize: strip seconds if present (HH:mm:ss -> HH:mm)
  const normalized = time.includes(':') && time.split(':').length > 2
    ? time.split(':').slice(0, 2).join(':')
    : time

  // Validate format before parsing
  if (!isValidTime(normalized)) {
    return time // Return original if invalid
  }

  try {
    const date = parse(normalized, 'HH:mm', new Date())
    if (isNaN(date.getTime())) {
      return time
    }
    return format(date, 'h:mm a')
  } catch {
    return time // Return original on error
  }
}

/**
 * Converts time string to minutes since midnight for sorting
 * Example: "14:30" -> 870
 * Returns 0 for invalid input.
 */
export function timeToMinutes(time: string): number {
  if (!time || typeof time !== 'string' || !time.includes(':')) {
    return 0
  }
  const parts = time.split(':').map(Number)
  const hours = parts[0] || 0
  const minutes = parts[1] || 0
  if (isNaN(hours) || isNaN(minutes)) {
    return 0
  }
  return hours * 60 + minutes
}

/**
 * Checks if a time string is valid HH:mm format
 */
export function isValidTime(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)
}
