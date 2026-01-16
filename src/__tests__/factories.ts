import type { Chore, HouseholdMember, RecurrenceConfig } from '@/types'

let idCounter = 0

function generateTestId(): string {
  return `test-${Date.now()}-${idCounter++}`
}

export function createMockChore(overrides?: Partial<Chore>): Chore {
  return {
    id: generateTestId(),
    title: 'Test Chore',
    priority: 'medium',
    assigneeId: null,
    dueDate: new Date().toISOString(),
    completed: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockMember(overrides?: Partial<HouseholdMember>): HouseholdMember {
  return {
    id: generateTestId(),
    name: 'Test Member',
    color: '#3b82f6',
    ...overrides,
  }
}

export function createMockRecurrenceConfig(overrides?: Partial<RecurrenceConfig>): RecurrenceConfig {
  return {
    frequency: 'weekly',
    interval: 1,
    ...overrides,
  }
}

// Reset counter for test isolation
export function resetIdCounter(): void {
  idCounter = 0
}
