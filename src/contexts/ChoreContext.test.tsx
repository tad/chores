import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { ChoreProvider, useChores } from './ChoreContext'
import { AuthProvider } from './AuthContext'
import { HouseholdProvider } from './HouseholdContext'
import type { ReactNode } from 'react'

// Wrapper with all required providers
const AllProviders = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <HouseholdProvider>
      <ChoreProvider>{children}</ChoreProvider>
    </HouseholdProvider>
  </AuthProvider>
)

describe('ChoreContext', () => {
  describe('useChores hook', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useChores())
      }).toThrow('useChores must be used within a ChoreProvider')

      consoleSpy.mockRestore()
    })

    it('returns context values when used within provider', () => {
      const { result } = renderHook(() => useChores(), { wrapper: AllProviders })

      expect(result.current.chores).toEqual([])
      expect(result.current.loading).toBeDefined()
      expect(typeof result.current.addChore).toBe('function')
      expect(typeof result.current.updateChore).toBe('function')
      expect(typeof result.current.deleteChore).toBe('function')
      expect(typeof result.current.completeChore).toBe('function')
      expect(typeof result.current.getChoresForRange).toBe('function')
      expect(typeof result.current.getChoresForDay).toBe('function')
      expect(typeof result.current.getChoresForWeek).toBe('function')
      expect(typeof result.current.getChoresForMonth).toBe('function')
      expect(typeof result.current.getCompletedChores).toBe('function')
    })
  })

  // Note: The following tests need to be updated to mock Supabase responses
  // For now, they are skipped pending integration test setup
  describe.skip('Supabase integration tests', () => {
    it('TODO: add tests for addChore with mocked Supabase', () => {})
    it('TODO: add tests for updateChore with mocked Supabase', () => {})
    it('TODO: add tests for deleteChore with mocked Supabase', () => {})
    it('TODO: add tests for completeChore with mocked Supabase', () => {})
  })
})
