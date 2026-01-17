import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HouseholdMemberList } from './HouseholdMemberList'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { AuthProvider } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'

// Wrapper with all required providers
const AllProviders = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <HouseholdProvider>{children}</HouseholdProvider>
  </AuthProvider>
)

describe('HouseholdMemberList', () => {
  it('renders without crashing', () => {
    render(
      <AllProviders>
        <HouseholdMemberList />
      </AllProviders>
    )
    // Button should be present
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  // Note: Component tests need to be updated to mock Supabase data
  // For now, detailed tests are skipped pending integration test setup
  describe.skip('Supabase integration tests', () => {
    it('TODO: displays members when data is loaded', () => {})
    it('TODO: opens color picker popover when clicking member color', () => {})
    it('TODO: changes member color when selecting a new color', () => {})
  })
})
