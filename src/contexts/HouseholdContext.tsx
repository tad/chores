import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { HouseholdMember } from '@/types'

interface HouseholdContextType {
  members: HouseholdMember[]
  addMember: (name: string) => void
  updateMember: (id: string, updates: Partial<Omit<HouseholdMember, 'id'>>) => void
  deleteMember: (id: string) => void
  getMemberById: (id: string) => HouseholdMember | undefined
}

const HouseholdContext = createContext<HouseholdContextType | null>(null)

// Preset colors for household members
const MEMBER_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useLocalStorage<HouseholdMember[]>('household-members', [])

  const getNextColor = useCallback(() => {
    const usedColors = new Set(members.map(m => m.color))
    const availableColor = MEMBER_COLORS.find(c => !usedColors.has(c))
    return availableColor || MEMBER_COLORS[members.length % MEMBER_COLORS.length]
  }, [members])

  const addMember = useCallback(
    (name: string) => {
      const newMember: HouseholdMember = {
        id: generateId(),
        name: name.trim(),
        color: getNextColor(),
      }
      setMembers(prev => [...prev, newMember])
    },
    [setMembers, getNextColor]
  )

  const updateMember = useCallback(
    (id: string, updates: Partial<Omit<HouseholdMember, 'id'>>) => {
      setMembers(prev =>
        prev.map(member =>
          member.id === id ? { ...member, ...updates } : member
        )
      )
    },
    [setMembers]
  )

  const deleteMember = useCallback(
    (id: string) => {
      setMembers(prev => prev.filter(member => member.id !== id))
    },
    [setMembers]
  )

  const getMemberById = useCallback(
    (id: string): HouseholdMember | undefined => {
      return members.find(member => member.id === id)
    },
    [members]
  )

  const value = useMemo(
    () => ({
      members,
      addMember,
      updateMember,
      deleteMember,
      getMemberById,
    }),
    [members, addMember, updateMember, deleteMember, getMemberById]
  )

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const context = useContext(HouseholdContext)
  if (!context) {
    throw new Error('useHousehold must be used within a HouseholdProvider')
  }
  return context
}
