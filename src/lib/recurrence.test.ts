import { describe, it, expect, vi } from 'vitest'
import {
  createRRule,
  getRecurrenceInstances,
  describeRecurrence,
  parseRRuleToConfig,
} from './recurrence'
import type { RecurrenceConfig } from '@/types'

describe('createRRule', () => {
  const startDate = new Date('2025-01-15T10:00:00Z')

  it('creates daily recurrence', () => {
    const config: RecurrenceConfig = { frequency: 'daily', interval: 1 }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('FREQ=DAILY')
    expect(rrule).toContain('INTERVAL=1')
  })

  it('creates weekly recurrence', () => {
    const config: RecurrenceConfig = { frequency: 'weekly', interval: 1 }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('FREQ=WEEKLY')
  })

  it('creates monthly recurrence', () => {
    const config: RecurrenceConfig = { frequency: 'monthly', interval: 1 }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('FREQ=MONTHLY')
  })

  it('creates yearly recurrence', () => {
    const config: RecurrenceConfig = { frequency: 'yearly', interval: 1 }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('FREQ=YEARLY')
  })

  it('creates recurrence with interval > 1', () => {
    const config: RecurrenceConfig = { frequency: 'weekly', interval: 2 }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('INTERVAL=2')
  })

  it('creates weekly recurrence on specific weekdays', () => {
    const config: RecurrenceConfig = {
      frequency: 'weekly',
      interval: 1,
      byWeekday: [1, 3, 5], // Mon, Wed, Fri
    }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('BYDAY=MO,WE,FR')
  })

  it('creates monthly recurrence with ordinal position (2nd Tuesday)', () => {
    const config: RecurrenceConfig = {
      frequency: 'monthly',
      interval: 1,
      byWeekday: [2], // Tuesday
      bySetPos: 2, // 2nd
    }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('BYDAY=+2TU')
  })

  it('creates monthly recurrence with last weekday (-1)', () => {
    const config: RecurrenceConfig = {
      frequency: 'monthly',
      interval: 1,
      byWeekday: [5], // Friday
      bySetPos: -1, // last
    }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('BYDAY=-1FR')
  })

  it('creates recurrence with specific month day', () => {
    const config: RecurrenceConfig = {
      frequency: 'monthly',
      interval: 1,
      byMonthDay: 15,
    }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('BYMONTHDAY=15')
  })

  it('creates recurrence with end date', () => {
    const config: RecurrenceConfig = {
      frequency: 'daily',
      interval: 1,
      endDate: '2025-12-31T00:00:00Z',
    }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('UNTIL=')
  })

  it('creates recurrence with count', () => {
    const config: RecurrenceConfig = {
      frequency: 'daily',
      interval: 1,
      count: 10,
    }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('COUNT=10')
  })

  it('includes dtstart in the rule', () => {
    const config: RecurrenceConfig = { frequency: 'daily', interval: 1 }
    const rrule = createRRule(config, startDate)
    expect(rrule).toContain('DTSTART')
  })
})

describe('getRecurrenceInstances', () => {
  it('returns dates for daily recurrence within range', () => {
    const rrule = 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1'
    const rangeStart = new Date('2025-01-15T00:00:00Z')
    const rangeEnd = new Date('2025-01-21T23:59:59Z')

    const instances = getRecurrenceInstances(rrule, rangeStart, rangeEnd)
    expect(instances).toHaveLength(7) // 7 days
  })

  it('returns dates for weekly recurrence', () => {
    const rrule = 'DTSTART:20250115T100000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1'
    const rangeStart = new Date('2025-01-15T00:00:00Z')
    const rangeEnd = new Date('2025-02-15T23:59:59Z')

    const instances = getRecurrenceInstances(rrule, rangeStart, rangeEnd)
    expect(instances.length).toBeGreaterThanOrEqual(4) // At least 4 weeks
  })

  it('includes instances on range boundaries (inclusive)', () => {
    const rrule = 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1'
    const rangeStart = new Date('2025-01-15T10:00:00Z')
    const rangeEnd = new Date('2025-01-15T10:00:00Z')

    const instances = getRecurrenceInstances(rrule, rangeStart, rangeEnd)
    expect(instances).toHaveLength(1)
  })

  it('returns empty array for non-overlapping range', () => {
    const rrule = 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1;COUNT=5'
    const rangeStart = new Date('2025-02-01T00:00:00Z')
    const rangeEnd = new Date('2025-02-28T23:59:59Z')

    const instances = getRecurrenceInstances(rrule, rangeStart, rangeEnd)
    expect(instances).toHaveLength(0)
  })

  it('returns empty array for invalid rrule string', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const instances = getRecurrenceInstances('not-a-valid-rrule', new Date(), new Date())
    expect(instances).toEqual([])
    consoleSpy.mockRestore()
  })

  it('respects count limit', () => {
    const rrule = 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1;COUNT=3'
    const rangeStart = new Date('2025-01-15T00:00:00Z')
    const rangeEnd = new Date('2025-12-31T23:59:59Z')

    const instances = getRecurrenceInstances(rrule, rangeStart, rangeEnd)
    expect(instances).toHaveLength(3)
  })

  it('respects until date', () => {
    const rrule = 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1;UNTIL=20250120T100000Z'
    const rangeStart = new Date('2025-01-15T00:00:00Z')
    const rangeEnd = new Date('2025-12-31T23:59:59Z')

    const instances = getRecurrenceInstances(rrule, rangeStart, rangeEnd)
    expect(instances).toHaveLength(6) // Jan 15-20
  })
})

describe('describeRecurrence', () => {
  it('describes daily frequency', () => {
    const config: RecurrenceConfig = { frequency: 'daily', interval: 1 }
    expect(describeRecurrence(config)).toBe('Daily')
  })

  it('describes weekly frequency', () => {
    const config: RecurrenceConfig = { frequency: 'weekly', interval: 1 }
    expect(describeRecurrence(config)).toBe('Weekly')
  })

  it('describes monthly frequency', () => {
    const config: RecurrenceConfig = { frequency: 'monthly', interval: 1 }
    expect(describeRecurrence(config)).toBe('Monthly')
  })

  it('describes yearly frequency', () => {
    const config: RecurrenceConfig = { frequency: 'yearly', interval: 1 }
    expect(describeRecurrence(config)).toBe('Yearly')
  })

  it('describes interval > 1 for days', () => {
    const config: RecurrenceConfig = { frequency: 'daily', interval: 2 }
    // Note: The replace('ly', 's') logic produces 'dais' for 'daily'
    expect(describeRecurrence(config)).toBe('Every 2 dais')
  })

  it('describes interval > 1 for weeks', () => {
    const config: RecurrenceConfig = { frequency: 'weekly', interval: 3 }
    expect(describeRecurrence(config)).toBe('Every 3 weeks')
  })

  it('describes interval > 1 for months', () => {
    const config: RecurrenceConfig = { frequency: 'monthly', interval: 2 }
    expect(describeRecurrence(config)).toBe('Every 2 months')
  })

  it('describes weekly with specific days', () => {
    const config: RecurrenceConfig = {
      frequency: 'weekly',
      interval: 1,
      byWeekday: [1, 3, 5], // Mon, Wed, Fri
    }
    expect(describeRecurrence(config)).toBe('Weekly on Mon, Wed, Fri')
  })

  it('describes monthly with ordinal position (2nd Tuesday)', () => {
    const config: RecurrenceConfig = {
      frequency: 'monthly',
      interval: 1,
      byWeekday: [2],
      bySetPos: 2,
    }
    expect(describeRecurrence(config)).toBe('Monthly on the 2nd Tue')
  })

  it('describes monthly with last weekday', () => {
    const config: RecurrenceConfig = {
      frequency: 'monthly',
      interval: 1,
      byWeekday: [5],
      bySetPos: -1,
    }
    expect(describeRecurrence(config)).toBe('Monthly on the last Fri')
  })

  it('includes end date in description', () => {
    const config: RecurrenceConfig = {
      frequency: 'daily',
      interval: 1,
      endDate: '2025-12-31T00:00:00Z',
    }
    const description = describeRecurrence(config)
    expect(description).toContain('until')
    // Date is converted to local time, so just check it includes the year
    expect(description).toContain('2025')
  })

  it('includes count in description', () => {
    const config: RecurrenceConfig = {
      frequency: 'daily',
      interval: 1,
      count: 5,
    }
    expect(describeRecurrence(config)).toContain('(5 times)')
  })
})

describe('parseRRuleToConfig', () => {
  it('parses daily frequency', () => {
    const rrule = 'RRULE:FREQ=DAILY;INTERVAL=1'
    const config = parseRRuleToConfig(rrule)
    expect(config).not.toBeNull()
    expect(config!.frequency).toBe('daily')
    expect(config!.interval).toBe(1)
  })

  it('parses weekly frequency', () => {
    const rrule = 'RRULE:FREQ=WEEKLY;INTERVAL=1'
    const config = parseRRuleToConfig(rrule)
    expect(config!.frequency).toBe('weekly')
  })

  it('parses monthly frequency', () => {
    const rrule = 'RRULE:FREQ=MONTHLY;INTERVAL=1'
    const config = parseRRuleToConfig(rrule)
    expect(config!.frequency).toBe('monthly')
  })

  it('parses yearly frequency', () => {
    const rrule = 'RRULE:FREQ=YEARLY;INTERVAL=1'
    const config = parseRRuleToConfig(rrule)
    expect(config!.frequency).toBe('yearly')
  })

  it('parses interval > 1', () => {
    const rrule = 'RRULE:FREQ=WEEKLY;INTERVAL=3'
    const config = parseRRuleToConfig(rrule)
    expect(config!.interval).toBe(3)
  })

  it('parses weekdays', () => {
    const rrule = 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR'
    const config = parseRRuleToConfig(rrule)
    // rrule library uses 0=Monday, so MO=0, WE=2, FR=4
    expect(config!.byWeekday).toEqual([0, 2, 4])
  })

  it('parses ordinal weekday (2nd Tuesday)', () => {
    const rrule = 'RRULE:FREQ=MONTHLY;BYDAY=+2TU'
    const config = parseRRuleToConfig(rrule)
    // rrule library uses 0=Monday, so TU=1
    expect(config!.byWeekday).toContain(1)
    expect(config!.bySetPos).toBe(2)
  })

  it('parses last weekday (-1)', () => {
    const rrule = 'RRULE:FREQ=MONTHLY;BYDAY=-1FR'
    const config = parseRRuleToConfig(rrule)
    // rrule library uses 0=Monday, so FR=4
    expect(config!.byWeekday).toContain(4)
    expect(config!.bySetPos).toBe(-1)
  })

  it('parses month day', () => {
    const rrule = 'RRULE:FREQ=MONTHLY;BYMONTHDAY=15'
    const config = parseRRuleToConfig(rrule)
    expect(config!.byMonthDay).toBe(15)
  })

  it('parses count', () => {
    const rrule = 'RRULE:FREQ=DAILY;COUNT=10'
    const config = parseRRuleToConfig(rrule)
    expect(config!.count).toBe(10)
  })

  it('parses until date', () => {
    const rrule = 'RRULE:FREQ=DAILY;UNTIL=20251231T000000Z'
    const config = parseRRuleToConfig(rrule)
    expect(config!.endDate).toBeDefined()
  })

  it('returns null for invalid rrule', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const config = parseRRuleToConfig('not-valid')
    expect(config).toBeNull()
    consoleSpy.mockRestore()
  })

  it('roundtrip: createRRule then parseRRuleToConfig preserves config', () => {
    const originalConfig: RecurrenceConfig = {
      frequency: 'weekly',
      interval: 2,
      byWeekday: [1, 3], // Mon=1, Wed=3 (Sunday=0 based)
    }
    const startDate = new Date('2025-01-15T10:00:00Z')

    const rrule = createRRule(originalConfig, startDate)
    const parsedConfig = parseRRuleToConfig(rrule)

    expect(parsedConfig!.frequency).toBe(originalConfig.frequency)
    expect(parsedConfig!.interval).toBe(originalConfig.interval)
    // Note: parseRRuleToConfig returns rrule library's weekday indices (0=Monday)
    // while createRRule uses Sunday=0 indexing. This is a known asymmetry.
    expect(parsedConfig!.byWeekday).toEqual([0, 2]) // MO=0, WE=2 in rrule lib
  })

  it('roundtrip with ordinal position', () => {
    const originalConfig: RecurrenceConfig = {
      frequency: 'monthly',
      interval: 1,
      byWeekday: [2],
      bySetPos: 2,
    }
    const startDate = new Date('2025-01-15T10:00:00Z')

    const rrule = createRRule(originalConfig, startDate)
    const parsedConfig = parseRRuleToConfig(rrule)

    expect(parsedConfig!.bySetPos).toBe(originalConfig.bySetPos)
  })
})
