import { parse, format } from 'date-fns'

/**
 * Formats a 24-hour time string (HH:mm) to 12-hour format (h:mm a)
 * Example: "14:30" -> "2:30 PM"
 */
export function formatTime12Hour(time: string): string {
  const date = parse(time, 'HH:mm', new Date())
  return format(date, 'h:mm a')
}

/**
 * Converts time string to minutes since midnight for sorting
 * Example: "14:30" -> 870
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Checks if a time string is valid HH:mm format
 */
export function isValidTime(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)
}
