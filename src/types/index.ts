// Re-export database types
export type {
  Profile,
  Household,
  HouseholdMembership,
  DbChore,
  ChoreCompletion,
} from './database'

// User type for auth context
export interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
}

// HouseholdMember now maps to HouseholdMembership
export interface HouseholdMember {
  id: string
  name: string
  color: string
  userId?: string // Links to auth user when using Supabase
  role?: 'owner' | 'member'
}

export type Priority = 'low' | 'medium' | 'high'

export interface Chore {
  id: string
  title: string
  description?: string
  priority: Priority
  assigneeId: string | null
  dueDate: string // ISO date string
  dueTime?: string // Optional time in "HH:mm" format (24-hour)
  recurrenceRule?: string // RRULE string for recurring chores
  completed: boolean
  completedDate?: string
  completedDates?: string[] // ISO date strings for completed recurring instances
  createdAt: string
}

export type CalendarView = 'day' | 'week' | 'month'

export interface ChoreInstance {
  chore: Chore
  date: Date
  isRecurrenceInstance: boolean
}

export interface CompletedChoreInstance {
  chore: Chore
  completedDate: string
  instanceDate: string
}

// Recurrence pattern options for the UI
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency
  interval: number // Every N days/weeks/months/years
  byWeekday?: number[] // 0-6 for Sunday-Saturday
  byMonthDay?: number // Day of month (1-31)
  bySetPos?: number // Ordinal position (1st, 2nd, -1 for last)
  endDate?: string // ISO date for end
  count?: number // Number of occurrences
}
