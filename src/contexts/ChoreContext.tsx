import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import type { Chore, ChoreInstance, CompletedChoreInstance, DbChore, ChoreCompletion } from '@/types'
import { getRecurrenceInstances } from '@/lib/recurrence'
import { timeToMinutes } from '@/lib/time'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from 'date-fns'

interface ChoreContextType {
  chores: Chore[]
  loading: boolean
  addChore: (chore: Omit<Chore, 'id' | 'createdAt' | 'completed'>) => Promise<void>
  updateChore: (id: string, updates: Partial<Chore>) => Promise<void>
  deleteChore: (id: string) => Promise<void>
  completeChore: (id: string, date: Date) => Promise<void>
  getChoresForRange: (start: Date, end: Date) => ChoreInstance[]
  getChoresForDay: (date: Date) => ChoreInstance[]
  getChoresForWeek: (date: Date) => ChoreInstance[]
  getChoresForMonth: (date: Date) => ChoreInstance[]
  getCompletedChores: () => CompletedChoreInstance[]
}

const ChoreContext = createContext<ChoreContextType | null>(null)

// Convert database chore to app chore format
function dbChoreToChore(dbChore: DbChore, completions: ChoreCompletion[]): Chore {
  return {
    id: dbChore.id,
    title: dbChore.title,
    description: dbChore.description || undefined,
    priority: dbChore.priority,
    assigneeId: dbChore.assignee_id,
    dueDate: dbChore.due_date,
    dueTime: dbChore.due_time || undefined,
    recurrenceRule: dbChore.recurrence_rule || undefined,
    completed: dbChore.completed,
    completedDate: dbChore.completed_date || undefined,
    completedDates: completions.map((c) => c.completed_at),
    createdAt: dbChore.created_at,
  }
}

export function ChoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { currentHousehold } = useHousehold()
  const [dbChores, setDbChores] = useState<DbChore[]>([])
  const [completions, setCompletions] = useState<ChoreCompletion[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch chores for current household
  const fetchChores = useCallback(async () => {
    if (!currentHousehold) {
      setDbChores([])
      setCompletions([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data: choreData, error: choreError } = await supabase
      .from('chores')
      .select('*')
      .eq('household_id', currentHousehold.id)

    if (choreError) {
      console.error('Error fetching chores:', choreError)
      setLoading(false)
      return
    }

    setDbChores(choreData || [])

    // Fetch completions for all chores
    if (choreData && choreData.length > 0) {
      const choreIds = choreData.map((c) => c.id)
      const { data: completionData, error: completionError } = await supabase
        .from('chore_completions')
        .select('*')
        .in('chore_id', choreIds)

      if (completionError) {
        console.error('Error fetching completions:', completionError)
      } else {
        setCompletions(completionData || [])
      }
    } else {
      setCompletions([])
    }

    setLoading(false)
  }, [currentHousehold])

  // Initialize and refresh on household change
  useEffect(() => {
    fetchChores()
  }, [currentHousehold?.id])

  // Subscribe to real-time changes
  useEffect(() => {
    if (!currentHousehold) return

    const choreChannel = supabase
      .channel(`chores:${currentHousehold.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chores',
          filter: `household_id=eq.${currentHousehold.id}`,
        },
        () => {
          fetchChores()
        }
      )
      .subscribe()

    const completionChannel = supabase
      .channel(`chore_completions:${currentHousehold.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chore_completions',
        },
        () => {
          fetchChores()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(choreChannel)
      supabase.removeChannel(completionChannel)
    }
  }, [currentHousehold?.id, fetchChores])

  // Convert DB chores to app chores with completions
  const chores: Chore[] = useMemo(() => {
    return dbChores.map((dbChore) => {
      const choreCompletions = completions.filter((c) => c.chore_id === dbChore.id)
      return dbChoreToChore(dbChore, choreCompletions)
    })
  }, [dbChores, completions])

  const addChore = useCallback(
    async (choreData: Omit<Chore, 'id' | 'createdAt' | 'completed'>) => {
      if (!user || !currentHousehold) return

      await supabase.from('chores').insert({
        household_id: currentHousehold.id,
        title: choreData.title,
        description: choreData.description || null,
        priority: choreData.priority,
        assignee_id: choreData.assigneeId || null,
        due_date: choreData.dueDate,
        due_time: choreData.dueTime || null,
        recurrence_rule: choreData.recurrenceRule || null,
        completed: false,
        created_by: user.id,
      })

      await fetchChores()
    },
    [user, currentHousehold, fetchChores]
  )

  const updateChore = useCallback(
    async (id: string, updates: Partial<Chore>) => {
      const dbUpdates: Record<string, unknown> = {}

      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.description !== undefined) dbUpdates.description = updates.description || null
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority
      if (updates.assigneeId !== undefined) dbUpdates.assignee_id = updates.assigneeId || null
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
      if (updates.dueTime !== undefined) dbUpdates.due_time = updates.dueTime || null
      if (updates.recurrenceRule !== undefined) dbUpdates.recurrence_rule = updates.recurrenceRule || null
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed
      if (updates.completedDate !== undefined) dbUpdates.completed_date = updates.completedDate || null

      await supabase.from('chores').update(dbUpdates).eq('id', id)

      await fetchChores()
    },
    [fetchChores]
  )

  const deleteChore = useCallback(
    async (id: string) => {
      await supabase.from('chores').delete().eq('id', id)
      await fetchChores()
    },
    [fetchChores]
  )

  const completeChore = useCallback(
    async (id: string, date: Date) => {
      if (!user) return

      const chore = chores.find((c) => c.id === id)
      if (!chore) return

      // For recurring chores, add a completion record
      if (chore.recurrenceRule) {
        const dateStr = date.toISOString().split('T')[0]

        // Check if already completed for this date
        const existingCompletion = completions.find(
          (c) => c.chore_id === id && c.instance_date === dateStr
        )

        if (existingCompletion) return

        await supabase.from('chore_completions').insert({
          chore_id: id,
          instance_date: dateStr,
          completed_by: user.id,
        })
      } else {
        // For non-recurring chores, mark as completed
        await supabase.from('chores').update({
          completed: true,
          completed_date: date.toISOString(),
        }).eq('id', id)
      }

      await fetchChores()
    },
    [user, chores, completions, fetchChores]
  )

  const getChoresForRange = useCallback(
    (start: Date, end: Date): ChoreInstance[] => {
      const instances: ChoreInstance[] = []

      chores.forEach((chore) => {
        if (chore.recurrenceRule) {
          // Get all instances within the range
          const recurrenceInstances = getRecurrenceInstances(
            chore.recurrenceRule,
            start,
            end
          )
          recurrenceInstances.forEach((date) => {
            // Check if this specific date is completed
            const dateStr = date.toISOString().split('T')[0]
            const isCompleted = chore.completedDates?.some(
              (completedDate) => completedDate.startsWith(dateStr)
            ) || completions.some(
              (c) => c.chore_id === chore.id && c.instance_date === dateStr
            )

            if (!isCompleted) {
              instances.push({
                chore,
                date,
                isRecurrenceInstance: true,
              })
            }
          })
        } else {
          // Non-recurring chore - skip if completed
          if (chore.completed) return

          const choreDate = new Date(chore.dueDate)
          if (choreDate >= start && choreDate <= end) {
            instances.push({
              chore,
              date: choreDate,
              isRecurrenceInstance: false,
            })
          }
        }
      })

      return instances.sort((a, b) => {
        // First sort by date
        const dateComparison = a.date.getTime() - b.date.getTime()

        // If different days, sort by date
        if (!isSameDay(a.date, b.date)) {
          return dateComparison
        }

        // Same day: timed chores come before untimed
        const aHasTime = !!a.chore.dueTime
        const bHasTime = !!b.chore.dueTime

        if (aHasTime && !bHasTime) return -1
        if (!aHasTime && bHasTime) return 1

        // Both have times: sort chronologically
        if (aHasTime && bHasTime) {
          return timeToMinutes(a.chore.dueTime!) - timeToMinutes(b.chore.dueTime!)
        }

        // Both untimed: keep original date order
        return dateComparison
      })
    },
    [chores, completions]
  )

  const getChoresForDay = useCallback(
    (date: Date): ChoreInstance[] => {
      return getChoresForRange(startOfDay(date), endOfDay(date))
    },
    [getChoresForRange]
  )

  const getChoresForWeek = useCallback(
    (date: Date): ChoreInstance[] => {
      return getChoresForRange(
        startOfWeek(date, { weekStartsOn: 0 }),
        endOfWeek(date, { weekStartsOn: 0 })
      )
    },
    [getChoresForRange]
  )

  const getChoresForMonth = useCallback(
    (date: Date): ChoreInstance[] => {
      return getChoresForRange(startOfMonth(date), endOfMonth(date))
    },
    [getChoresForRange]
  )

  const getCompletedChores = useCallback((): CompletedChoreInstance[] => {
    const completedInstances: CompletedChoreInstance[] = []

    chores.forEach((chore) => {
      if (chore.recurrenceRule) {
        // Add each completed instance of recurring chores
        const choreCompletions = completions.filter((c) => c.chore_id === chore.id)
        choreCompletions.forEach((completion) => {
          completedInstances.push({
            chore,
            completedDate: completion.completed_at,
            instanceDate: completion.instance_date,
          })
        })
      } else if (chore.completed && chore.completedDate) {
        // Non-recurring completed chores
        completedInstances.push({
          chore,
          completedDate: chore.completedDate,
          instanceDate: chore.dueDate,
        })
      }
    })

    // Sort by completion date, most recent first
    return completedInstances.sort((a, b) => {
      const dateA = new Date(a.completedDate).getTime()
      const dateB = new Date(b.completedDate).getTime()
      return dateB - dateA
    })
  }, [chores, completions])

  const value = useMemo(
    () => ({
      chores,
      loading,
      addChore,
      updateChore,
      deleteChore,
      completeChore,
      getChoresForRange,
      getChoresForDay,
      getChoresForWeek,
      getChoresForMonth,
      getCompletedChores,
    }),
    [
      chores,
      loading,
      addChore,
      updateChore,
      deleteChore,
      completeChore,
      getChoresForRange,
      getChoresForDay,
      getChoresForWeek,
      getChoresForMonth,
      getCompletedChores,
    ]
  )

  return <ChoreContext.Provider value={value}>{children}</ChoreContext.Provider>
}

export function useChores() {
  const context = useContext(ChoreContext)
  if (!context) {
    throw new Error('useChores must be used within a ChoreProvider')
  }
  return context
}
