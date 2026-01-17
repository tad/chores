import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChoreCard } from './ChoreCard'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { ChoreProvider } from '@/contexts/ChoreContext'
import { AuthProvider } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'
import type { ChoreInstance } from '@/types'

// Wrapper with all required providers
const AllProviders = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <HouseholdProvider>
      <ChoreProvider>{children}</ChoreProvider>
    </HouseholdProvider>
  </AuthProvider>
)

const mockChoreInstance: ChoreInstance = {
  chore: {
    id: 'test-chore-1',
    title: 'Test Chore',
    description: 'Test description',
    priority: 'medium',
    assigneeId: null,
    dueDate: '2025-01-15T10:00:00Z',
    completed: false,
    createdAt: '2025-01-01T00:00:00Z',
  },
  date: new Date('2025-01-15T10:00:00Z'),
  isRecurrenceInstance: false,
}

describe('ChoreCard', () => {
  it('renders chore title', () => {
    render(
      <AllProviders>
        <ChoreCard instance={mockChoreInstance} onEdit={() => {}} />
      </AllProviders>
    )
    expect(screen.getByText('Test Chore')).toBeInTheDocument()
  })

  it('renders in compact mode', () => {
    render(
      <AllProviders>
        <ChoreCard instance={mockChoreInstance} compact onEdit={() => {}} />
      </AllProviders>
    )
    expect(screen.getByText('Test Chore')).toBeInTheDocument()
  })

  // Note: Component tests need to be updated to mock Supabase data
  // For now, detailed tests are skipped pending integration test setup
  describe.skip('Supabase integration tests', () => {
    it('TODO: shows edit dialog when clicking edit button', () => {})
    it('TODO: completes chore when clicking complete button', () => {})
  })
})
