import { RRule, Weekday } from 'rrule'
import type { RecurrenceConfig, RecurrenceFrequency } from '@/types'

const FREQUENCY_MAP: Record<RecurrenceFrequency, number> = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
}

const WEEKDAY_MAP: Weekday[] = [
  RRule.SU,
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
]

export function createRRule(config: RecurrenceConfig, startDate: Date): string {
  const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
    freq: FREQUENCY_MAP[config.frequency],
    interval: config.interval,
    dtstart: startDate,
  }

  if (config.byWeekday && config.byWeekday.length > 0) {
    if (config.bySetPos !== undefined) {
      // Ordinal pattern like "2nd Tuesday"
      options.byweekday = config.byWeekday.map(day =>
        WEEKDAY_MAP[day].nth(config.bySetPos!)
      )
    } else {
      options.byweekday = config.byWeekday.map(day => WEEKDAY_MAP[day])
    }
  }

  if (config.byMonthDay !== undefined) {
    options.bymonthday = config.byMonthDay
  }

  if (config.endDate) {
    options.until = new Date(config.endDate)
  } else if (config.count) {
    options.count = config.count
  }

  const rule = new RRule(options)
  return rule.toString()
}

export function getRecurrenceInstances(
  rruleString: string,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  try {
    const rule = RRule.fromString(rruleString)
    return rule.between(rangeStart, rangeEnd, true)
  } catch (error) {
    console.warn('Error parsing rrule:', error)
    return []
  }
}

export function describeRecurrence(config: RecurrenceConfig): string {
  const { frequency, interval, byWeekday, bySetPos } = config

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const ordinalNames = ['', '1st', '2nd', '3rd', '4th', 'last']
  const pluralUnits: Record<RecurrenceFrequency, string> = {
    daily: 'days',
    weekly: 'weeks',
    monthly: 'months',
    yearly: 'years',
  }

  let description = ''

  if (interval === 1) {
    description = frequency === 'daily' ? 'Daily' :
                  frequency === 'weekly' ? 'Weekly' :
                  frequency === 'monthly' ? 'Monthly' : 'Yearly'
  } else {
    description = `Every ${interval} ${pluralUnits[frequency]}`
  }

  if (byWeekday && byWeekday.length > 0) {
    const days = byWeekday.map(d => weekdayNames[d]).join(', ')
    if (bySetPos !== undefined) {
      const ordinal = bySetPos === -1 ? 'last' : ordinalNames[bySetPos]
      description += ` on the ${ordinal} ${days}`
    } else {
      description += ` on ${days}`
    }
  }

  if (config.endDate) {
    description += ` until ${new Date(config.endDate).toLocaleDateString()}`
  } else if (config.count) {
    description += ` (${config.count} times)`
  }

  return description
}

export function parseRRuleToConfig(rruleString: string): RecurrenceConfig | null {
  try {
    const rule = RRule.fromString(rruleString)
    const options = rule.origOptions

    const freqMap: Record<number, RecurrenceFrequency> = {
      [RRule.DAILY]: 'daily',
      [RRule.WEEKLY]: 'weekly',
      [RRule.MONTHLY]: 'monthly',
      [RRule.YEARLY]: 'yearly',
    }

    const config: RecurrenceConfig = {
      frequency: freqMap[options.freq!] || 'weekly',
      interval: options.interval || 1,
    }

    if (options.byweekday) {
      const weekdays = Array.isArray(options.byweekday)
        ? options.byweekday
        : [options.byweekday]

      // Convert from rrule's Monday=0 indexing to Sunday=0 indexing
      const rruleToSundayIndex = (rruleDay: number): number => (rruleDay + 1) % 7

      config.byWeekday = weekdays.map(wd => {
        if (typeof wd === 'number') return rruleToSundayIndex(wd)
        if (typeof wd === 'string') {
          const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
          return dayMap[wd] ?? 0
        }
        // rrule Weekday objects use Monday=0, convert to Sunday=0
        return rruleToSundayIndex((wd as Weekday).weekday)
      })

      // Check for ordinal position
      const firstWd = weekdays[0]
      if (typeof firstWd !== 'number' && typeof firstWd !== 'string' && (firstWd as Weekday).n) {
        config.bySetPos = (firstWd as Weekday).n
      }
    }

    if (options.bymonthday) {
      config.byMonthDay = Array.isArray(options.bymonthday)
        ? options.bymonthday[0]
        : options.bymonthday
    }

    if (options.until) {
      config.endDate = options.until.toISOString()
    }

    if (options.count) {
      config.count = options.count
    }

    return config
  } catch (error) {
    console.warn('Error parsing rrule to config:', error)
    return null
  }
}
