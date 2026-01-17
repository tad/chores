import { describe, it, expect } from 'vitest'
import { formatTime12Hour, timeToMinutes, isValidTime } from './time'

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
})
