import { describe, it, expect } from 'vitest'
import { formatTime12Hour, timeToMinutes, isValidTime, parseDateAsLocal } from './time'

describe('time utilities', () => {
  describe('formatTime12Hour', () => {
    it('formats morning time correctly', () => {
      expect(formatTime12Hour('09:30')).toBe('9:30 AM')
    })

    it('formats afternoon time correctly', () => {
      expect(formatTime12Hour('14:30')).toBe('2:30 PM')
    })

    it('formats noon correctly', () => {
      expect(formatTime12Hour('12:00')).toBe('12:00 PM')
    })

    it('formats midnight correctly', () => {
      expect(formatTime12Hour('00:00')).toBe('12:00 AM')
    })

    it('formats single-digit hours correctly', () => {
      expect(formatTime12Hour('01:15')).toBe('1:15 AM')
      expect(formatTime12Hour('13:45')).toBe('1:45 PM')
    })
  })

  describe('timeToMinutes', () => {
    it('converts midnight to 0', () => {
      expect(timeToMinutes('00:00')).toBe(0)
    })

    it('converts noon to 720', () => {
      expect(timeToMinutes('12:00')).toBe(720)
    })

    it('converts 2:30 PM to 870', () => {
      expect(timeToMinutes('14:30')).toBe(870)
    })

    it('converts 9:15 AM to 555', () => {
      expect(timeToMinutes('09:15')).toBe(555)
    })

    it('converts end of day correctly', () => {
      expect(timeToMinutes('23:59')).toBe(1439)
    })
  })

  describe('isValidTime', () => {
    it('accepts valid times', () => {
      expect(isValidTime('00:00')).toBe(true)
      expect(isValidTime('23:59')).toBe(true)
      expect(isValidTime('12:30')).toBe(true)
      expect(isValidTime('09:15')).toBe(true)
    })

    it('rejects invalid hours', () => {
      expect(isValidTime('24:00')).toBe(false)
      expect(isValidTime('25:30')).toBe(false)
    })

    it('rejects invalid minutes', () => {
      expect(isValidTime('12:60')).toBe(false)
      expect(isValidTime('12:99')).toBe(false)
    })

    it('rejects invalid formats', () => {
      expect(isValidTime('invalid')).toBe(false)
      expect(isValidTime('12:3')).toBe(false)
      expect(isValidTime('1:30')).toBe(true) // single digit hour is ok
      expect(isValidTime('12')).toBe(false)
      expect(isValidTime('')).toBe(false)
    })
  })

  describe('parseDateAsLocal', () => {
    it('parses YYYY-MM-DD format as local midnight', () => {
      const date = parseDateAsLocal('2024-01-17')
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0) // January is 0
      expect(date.getDate()).toBe(17)
      expect(date.getHours()).toBe(0)
      expect(date.getMinutes()).toBe(0)
    })

    it('parses ISO format and extracts date as local', () => {
      // This ISO string represents midnight UTC on Jan 17
      // parseDateAsLocal should extract Jan 17 as a local date
      const date = parseDateAsLocal('2024-01-17T00:00:00.000Z')
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(17)
      expect(date.getHours()).toBe(0)
    })

    it('handles ISO format with different time components', () => {
      // Even with time in the ISO string, extract just the date part
      const date = parseDateAsLocal('2024-01-17T15:30:00.000Z')
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(17)
      expect(date.getHours()).toBe(0)
    })

    it('handles edge case dates', () => {
      // End of year
      const endOfYear = parseDateAsLocal('2024-12-31')
      expect(endOfYear.getFullYear()).toBe(2024)
      expect(endOfYear.getMonth()).toBe(11) // December
      expect(endOfYear.getDate()).toBe(31)

      // Leap year
      const leapDay = parseDateAsLocal('2024-02-29')
      expect(leapDay.getFullYear()).toBe(2024)
      expect(leapDay.getMonth()).toBe(1) // February
      expect(leapDay.getDate()).toBe(29)
    })

    it('returns invalid date for invalid input', () => {
      const invalid = parseDateAsLocal('not-a-date')
      expect(isNaN(invalid.getTime())).toBe(true)
    })
  })
})
