import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { HouseholdProvider, useHousehold, MEMBER_COLORS } from './HouseholdContext'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
  <HouseholdProvider>{children}</HouseholdProvider>
)

describe('HouseholdContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('useHousehold hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useHousehold())
      }).toThrow('useHousehold must be used within a HouseholdProvider')

      consoleSpy.mockRestore()
    })

    it('returns context values when used within provider', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      expect(result.current.members).toEqual([])
      expect(typeof result.current.addMember).toBe('function')
      expect(typeof result.current.updateMember).toBe('function')
      expect(typeof result.current.deleteMember).toBe('function')
      expect(typeof result.current.getMemberById).toBe('function')
    })
  })

  describe('addMember', () => {
    it('adds a member with the given name', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
      })

      expect(result.current.members).toHaveLength(1)
      expect(result.current.members[0].name).toBe('John')
    })

    it('trims whitespace from name', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('  Alice  ')
      })

      expect(result.current.members[0].name).toBe('Alice')
    })

    it('auto-assigns first available color', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
      })

      expect(result.current.members[0].color).toBe(MEMBER_COLORS[0])
    })

    it('uses provided color instead of auto-assigning', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })
      const customColor = '#ff0000'

      act(() => {
        result.current.addMember('John', customColor)
      })

      expect(result.current.members[0].color).toBe(customColor)
    })

    it('generates unique IDs', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
        result.current.addMember('Jane')
      })

      expect(result.current.members[0].id).not.toBe(result.current.members[1].id)
    })

    it('assigns different colors to sequential members', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      // Each addMember needs its own act() so state updates between calls
      act(() => {
        result.current.addMember('Member1')
      })
      act(() => {
        result.current.addMember('Member2')
      })
      act(() => {
        result.current.addMember('Member3')
      })

      const colors = result.current.members.map(m => m.color)
      expect(colors[0]).toBe(MEMBER_COLORS[0])
      expect(colors[1]).toBe(MEMBER_COLORS[1])
      expect(colors[2]).toBe(MEMBER_COLORS[2])
    })

    it('cycles colors when all are used', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        // Add 8 members to use all colors
        MEMBER_COLORS.forEach((_, i) => {
          result.current.addMember(`Member${i + 1}`)
        })
        // Add 9th member - should cycle
        result.current.addMember('Member9')
      })

      expect(result.current.members).toHaveLength(9)
      // 9th member should have a color from MEMBER_COLORS
      expect(MEMBER_COLORS).toContain(result.current.members[8].color)
    })
  })

  describe('updateMember', () => {
    it('updates member name', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
      })

      const memberId = result.current.members[0].id

      act(() => {
        result.current.updateMember(memberId, { name: 'Johnny' })
      })

      expect(result.current.members[0].name).toBe('Johnny')
    })

    it('updates member color', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
      })

      const memberId = result.current.members[0].id
      const newColor = '#00ff00'

      act(() => {
        result.current.updateMember(memberId, { color: newColor })
      })

      expect(result.current.members[0].color).toBe(newColor)
    })

    it('does not affect other members', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
        result.current.addMember('Jane')
      })

      const johnId = result.current.members[0].id

      act(() => {
        result.current.updateMember(johnId, { name: 'Johnny' })
      })

      expect(result.current.members[1].name).toBe('Jane')
    })

    it('does nothing for non-existent ID', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
      })

      act(() => {
        result.current.updateMember('non-existent-id', { name: 'Nobody' })
      })

      expect(result.current.members).toHaveLength(1)
      expect(result.current.members[0].name).toBe('John')
    })
  })

  describe('deleteMember', () => {
    it('removes member by ID', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
      })

      const memberId = result.current.members[0].id

      act(() => {
        result.current.deleteMember(memberId)
      })

      expect(result.current.members).toHaveLength(0)
    })

    it('preserves other members', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
        result.current.addMember('Jane')
        result.current.addMember('Bob')
      })

      const janeId = result.current.members[1].id

      act(() => {
        result.current.deleteMember(janeId)
      })

      expect(result.current.members).toHaveLength(2)
      expect(result.current.members.find(m => m.name === 'Jane')).toBeUndefined()
      expect(result.current.members.find(m => m.name === 'John')).toBeDefined()
      expect(result.current.members.find(m => m.name === 'Bob')).toBeDefined()
    })

    it('does nothing for non-existent ID', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
      })

      act(() => {
        result.current.deleteMember('non-existent-id')
      })

      expect(result.current.members).toHaveLength(1)
    })
  })

  describe('getMemberById', () => {
    it('returns member when ID exists', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
      })

      const memberId = result.current.members[0].id
      const member = result.current.getMemberById(memberId)

      expect(member).toBeDefined()
      expect(member!.name).toBe('John')
    })

    it('returns undefined for non-existent ID', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      act(() => {
        result.current.addMember('John')
      })

      const member = result.current.getMemberById('non-existent-id')
      expect(member).toBeUndefined()
    })
  })

  describe('color assignment algorithm', () => {
    it('finds first available color when some are used', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      // Add member with first color
      act(() => {
        result.current.addMember('Member1')
      })

      // Add member with third color (skipping second)
      act(() => {
        result.current.addMember('Member2', MEMBER_COLORS[2])
      })

      // Next auto-assigned should be second color
      act(() => {
        result.current.addMember('Member3')
      })

      expect(result.current.members[2].color).toBe(MEMBER_COLORS[1])
    })

    it('reuses freed color after deletion', () => {
      const { result } = renderHook(() => useHousehold(), { wrapper })

      // Add members in separate acts for proper state updates
      act(() => {
        result.current.addMember('Member1')
      })
      act(() => {
        result.current.addMember('Member2')
      })

      const firstColor = result.current.members[0].color
      const firstId = result.current.members[0].id

      act(() => {
        result.current.deleteMember(firstId)
      })

      act(() => {
        result.current.addMember('Member3')
      })

      // New member should get the freed color (first color in array is now available)
      expect(result.current.members[1].color).toBe(firstColor)
    })
  })
})
