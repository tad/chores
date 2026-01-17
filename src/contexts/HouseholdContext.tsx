import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { HouseholdMember, Household, HouseholdMembership } from '@/types'

interface HouseholdContextType {
  // Current household
  currentHousehold: Household | null
  setCurrentHousehold: (household: Household | null) => void
  households: Household[]

  // Members in current household
  members: HouseholdMember[]
  currentMembership: HouseholdMembership | null

  // CRUD operations
  addMember: (name: string, color?: string) => Promise<void>
  updateMember: (id: string, updates: Partial<Omit<HouseholdMember, 'id'>>) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  getMemberById: (id: string) => HouseholdMember | undefined

  // Household operations
  createHousehold: (name: string, displayName: string) => Promise<{ household: Household | null; error: Error | null }>
  joinHousehold: (inviteCode: string, displayName: string) => Promise<{ error: Error | null }>
  leaveHousehold: (householdId: string) => Promise<void>
  refreshHousehold: () => Promise<void>

  // Loading state
  loading: boolean
}

const HouseholdContext = createContext<HouseholdContextType | null>(null)

// Preset colors for household members
export const MEMBER_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

function getNextColor(usedColors: string[]): string {
  const availableColor = MEMBER_COLORS.find((c) => !usedColors.includes(c))
  return availableColor || MEMBER_COLORS[usedColors.length % MEMBER_COLORS.length]
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [households, setHouseholds] = useState<Household[]>([])
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null)
  const [memberships, setMemberships] = useState<HouseholdMembership[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all households for the current user
  const fetchHouseholds = useCallback(async () => {
    if (!user) {
      setHouseholds([])
      setMemberships([])
      setCurrentHousehold(null)
      setLoading(false)
      return
    }

    setLoading(true)

    // Fetch memberships
    const { data: membershipData, error: membershipError } = await supabase
      .from('household_memberships')
      .select('*')
      .eq('user_id', user.id)

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError)
      setLoading(false)
      return
    }

    setMemberships(membershipData || [])

    // Fetch household details for each membership
    if (membershipData && membershipData.length > 0) {
      const householdIds = membershipData.map((m) => m.household_id)
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .in('id', householdIds)

      if (householdError) {
        console.error('Error fetching households:', householdError)
      } else {
        setHouseholds(householdData || [])

        // Set current household if not set or invalid
        if (!currentHousehold || !householdIds.includes(currentHousehold.id)) {
          setCurrentHousehold(householdData?.[0] || null)
        }
      }
    } else {
      setHouseholds([])
      setCurrentHousehold(null)
    }

    setLoading(false)
  }, [user, currentHousehold])

  // Fetch members for current household
  const [allMembers, setAllMembers] = useState<HouseholdMembership[]>([])

  const fetchMembers = useCallback(async () => {
    if (!currentHousehold) {
      setAllMembers([])
      return
    }

    const { data, error } = await supabase
      .from('household_memberships')
      .select('*')
      .eq('household_id', currentHousehold.id)

    if (error) {
      console.error('Error fetching members:', error)
    } else {
      setAllMembers(data || [])
    }
  }, [currentHousehold])

  // Initialize and refresh on user change
  useEffect(() => {
    fetchHouseholds()
  }, [user?.id])

  // Fetch members when household changes
  useEffect(() => {
    fetchMembers()
  }, [currentHousehold?.id])

  // Subscribe to real-time changes for memberships
  useEffect(() => {
    if (!currentHousehold) return

    const channel = supabase
      .channel(`household_memberships:${currentHousehold.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_memberships',
          filter: `household_id=eq.${currentHousehold.id}`,
        },
        () => {
          fetchMembers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentHousehold?.id, fetchMembers])

  // Convert memberships to HouseholdMember format for backwards compatibility
  const members: HouseholdMember[] = useMemo(() => {
    return allMembers.map((m) => ({
      id: m.id,
      name: m.display_name,
      color: m.color,
      userId: m.user_id,
      role: m.role,
    }))
  }, [allMembers])

  // Current user's membership in the current household
  const currentMembership = useMemo(() => {
    if (!user || !currentHousehold) return null
    return allMembers.find(
      (m) => m.user_id === user.id && m.household_id === currentHousehold.id
    ) || null
  }, [allMembers, user, currentHousehold])

  const createHousehold = useCallback(
    async (name: string, displayName: string) => {
      if (!user) {
        return { household: null, error: new Error('Not authenticated') }
      }

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({ name })
        .select()
        .single()

      if (householdError) {
        return { household: null, error: new Error(householdError.message) }
      }

      // Create owner membership
      const usedColors = members.map((m) => m.color)
      const { error: membershipError } = await supabase
        .from('household_memberships')
        .insert({
          user_id: user.id,
          household_id: household.id,
          role: 'owner',
          color: getNextColor(usedColors),
          display_name: displayName,
        })

      if (membershipError) {
        // Rollback: delete the household if membership creation fails
        await supabase.from('households').delete().eq('id', household.id)
        return { household: null, error: new Error(membershipError.message) }
      }

      // Refresh and select new household
      await fetchHouseholds()
      setCurrentHousehold(household)

      return { household, error: null }
    },
    [user, members, fetchHouseholds]
  )

  const joinHousehold = useCallback(
    async (inviteCode: string, displayName: string) => {
      if (!user) {
        return { error: new Error('Not authenticated') }
      }

      // Find household by invite code
      const { data: household, error: findError } = await supabase
        .from('households')
        .select()
        .eq('invite_code', inviteCode.toLowerCase())
        .single()

      if (findError || !household) {
        return { error: new Error('Invalid invite code') }
      }

      // Check if already a member
      const existingMembership = memberships.find(
        (m) => m.household_id === household.id
      )
      if (existingMembership) {
        return { error: new Error('You are already a member of this household') }
      }

      // Get existing member colors to assign a new one
      const { data: existingMembers } = await supabase
        .from('household_memberships')
        .select('color')
        .eq('household_id', household.id)

      const usedColors = existingMembers?.map((m) => m.color) || []

      // Create membership
      const { error: membershipError } = await supabase
        .from('household_memberships')
        .insert({
          user_id: user.id,
          household_id: household.id,
          role: 'member',
          color: getNextColor(usedColors),
          display_name: displayName,
        })

      if (membershipError) {
        return { error: new Error(membershipError.message) }
      }

      // Refresh and select joined household
      await fetchHouseholds()
      setCurrentHousehold(household)

      return { error: null }
    },
    [user, memberships, fetchHouseholds]
  )

  const leaveHousehold = useCallback(
    async (householdId: string) => {
      if (!user) return

      await supabase
        .from('household_memberships')
        .delete()
        .eq('user_id', user.id)
        .eq('household_id', householdId)

      await fetchHouseholds()
    },
    [user, fetchHouseholds]
  )

  // Legacy methods for backwards compatibility with existing UI
  const addMember = useCallback(
    async (name: string, color?: string) => {
      if (!user || !currentHousehold) return

      const usedColors = members.map((m) => m.color)

      await supabase.from('household_memberships').insert({
        user_id: user.id, // Note: This creates a membership for current user
        household_id: currentHousehold.id,
        role: 'member',
        color: color || getNextColor(usedColors),
        display_name: name,
      })

      await fetchMembers()
    },
    [user, currentHousehold, members, fetchMembers]
  )

  const updateMember = useCallback(
    async (id: string, updates: Partial<Omit<HouseholdMember, 'id'>>) => {
      const dbUpdates: Record<string, unknown> = {}
      if (updates.name) dbUpdates.display_name = updates.name
      if (updates.color) dbUpdates.color = updates.color

      await supabase
        .from('household_memberships')
        .update(dbUpdates)
        .eq('id', id)

      await fetchMembers()
    },
    [fetchMembers]
  )

  const deleteMember = useCallback(
    async (id: string) => {
      await supabase.from('household_memberships').delete().eq('id', id)
      await fetchMembers()
    },
    [fetchMembers]
  )

  const getMemberById = useCallback(
    (id: string): HouseholdMember | undefined => {
      return members.find((member) => member.id === id)
    },
    [members]
  )

  const refreshHousehold = useCallback(async () => {
    await fetchHouseholds()
    await fetchMembers()
  }, [fetchHouseholds, fetchMembers])

  const value = useMemo(
    () => ({
      currentHousehold,
      setCurrentHousehold,
      households,
      members,
      currentMembership,
      addMember,
      updateMember,
      deleteMember,
      getMemberById,
      createHousehold,
      joinHousehold,
      leaveHousehold,
      refreshHousehold,
      loading,
    }),
    [
      currentHousehold,
      households,
      members,
      currentMembership,
      addMember,
      updateMember,
      deleteMember,
      getMemberById,
      createHousehold,
      joinHousehold,
      leaveHousehold,
      refreshHousehold,
      loading,
    ]
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
