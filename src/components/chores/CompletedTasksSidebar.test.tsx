import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompletedTasksSidebar } from './CompletedTasksSidebar'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { ChoreProvider } from '@/contexts/ChoreContext'
import { AuthProvider } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'

// Wrapper with all required providers
const AllProviders = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <HouseholdProvider>
      <ChoreProvider>{children}</ChoreProvider>
    </HouseholdProvider>
  </AuthProvider>
)

describe('CompletedTasksSidebar', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <AllProviders>
        <CompletedTasksSidebar isOpen={false} onClose={vi.fn()} />
      </AllProviders>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders sidebar when open', () => {
    render(
      <AllProviders>
        <CompletedTasksSidebar isOpen={true} onClose={vi.fn()} />
      </AllProviders>
    )
    expect(screen.getByText('Completed Tasks')).toBeInTheDocument()
  })

  // Note: Component tests need to be updated to mock Supabase data
  // For now, detailed tests are skipped pending integration test setup
  describe.skip('Supabase integration tests', () => {
    it('TODO: shows completed tasks grouped by assignee', () => {})
    it('TODO: filters by member when selected', () => {})
  })
})
