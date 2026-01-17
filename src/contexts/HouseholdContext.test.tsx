import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { HouseholdProvider, useHousehold, MEMBER_COLORS } from './HouseholdContext'
import { AuthProvider } from './AuthContext'
import type { ReactNode } from 'react'

// Wrapper with auth provider
const AllProviders = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <HouseholdProvider>{children}</HouseholdProvider>
  </AuthProvider>
)

describe('HouseholdContext', () => {
  describe('useHousehold hook', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useHousehold())
      }).toThrow('useHousehold must be used within a HouseholdProvider')

      consoleSpy.mockRestore()
    })

    it('returns context values when used within provider', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper: AllProviders })

      expect(result.current.members).toEqual([])
      expect(result.current.households).toEqual([])
      expect(result.current.currentHousehold).toBeNull()
      expect(result.current.loading).toBeDefined()
      expect(typeof result.current.addMember).toBe('function')
      expect(typeof result.current.updateMember).toBe('function')
      expect(typeof result.current.deleteMember).toBe('function')
      expect(typeof result.current.getMemberById).toBe('function')
      expect(typeof result.current.createHousehold).toBe('function')
      expect(typeof result.current.joinHousehold).toBe('function')
      expect(typeof result.current.leaveHousehold).toBe('function')
    })
  })

  describe('MEMBER_COLORS', () => {
    it('exports 8 preset colors', () => {
      expect(MEMBER_COLORS).toHaveLength(8)
    })

    it('all colors are valid hex codes', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/
      MEMBER_COLORS.forEach((color) => {
        expect(color).toMatch(hexColorRegex)
      })
    })
  })

  // Note: The following tests need to be updated to mock Supabase responses
  // For now, they are skipped pending integration test setup
  describe.skip('Supabase integration tests', () => {
    it('TODO: add tests for createHousehold with mocked Supabase', () => {})
    it('TODO: add tests for joinHousehold with mocked Supabase', () => {})
    it('TODO: add tests for addMember with mocked Supabase', () => {})
    it('TODO: add tests for updateMember with mocked Supabase', () => {})
    it('TODO: add tests for deleteMember with mocked Supabase', () => {})
  })
})
