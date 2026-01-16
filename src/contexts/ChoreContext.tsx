import { createContext, useContext, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Chore, ChoreInstance, CompletedChoreInstance } from '@/types'
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
  addChore: (chore: Omit<Chore, 'id' | 'createdAt' | 'completed'>) => void
  updateChore: (id: string, updates: Partial<Chore>) => void
  deleteChore: (id: string) => void
  completeChore: (id: string, date: Date) => void
  getChoresForRange: (start: Date, end: Date) => ChoreInstance[]
  getChoresForDay: (date: Date) => ChoreInstance[]
  getChoresForWeek: (date: Date) => ChoreInstance[]
  getChoresForMonth: (date: Date) => ChoreInstance[]
  getCompletedChores: () => CompletedChoreInstance[]
}

const ChoreContext = createContext<ChoreContextType | null>(null)

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function ChoreProvider({ children }: { children: ReactNode }) {
  const [chores, setChores] = useLocalStorage<Chore[]>('chores', [])

  // Migration: fix any recurring chores incorrectly marked as completed
  useEffect(() => {
    const hasInvalidRecurringChores = chores.some(
      chore => chore.recurrenceRule && chore.completed
    )

    if (hasInvalidRecurringChores) {
      setChores(prev =>
        prev.map(chore => {
          if (chore.recurrenceRule && chore.completed) {
            // Reset invalid state - completed flag should not be used for recurring chores
            return {
              ...chore,
              completed: false,
              // Migrate the single completedDate to completedDates array
              completedDates: chore.completedDate ? [chore.completedDate] : undefined,
              completedDate: undefined,
            }
          }
          return chore
        })
      )
    }
  }, []) // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const addChore = useCallback(
    (choreData: Omit<Chore, 'id' | 'createdAt' | 'completed'>) => {
      const newChore: Chore = {
        ...choreData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        completed: false,
      }
      setChores(prev => [...prev, newChore])
    },
    [setChores]
  )

  const updateChore = useCallback(
    (id: string, updates: Partial<Chore>) => {
      setChores(prev =>
        prev.map(chore => (chore.id === id ? { ...chore, ...updates } : chore))
      )
    },
    [setChores]
  )

  const deleteChore = useCallback(
    (id: string) => {
      setChores(prev => prev.filter(chore => chore.id !== id))
    },
    [setChores]
  )

  const completeChore = useCallback(
    (id: string, date: Date) => {
      setChores(prev =>
        prev.map(chore => {
          if (chore.id !== id) return chore

          // For recurring chores, add date to completedDates array
          if (chore.recurrenceRule) {
            const dateStr = date.toISOString().split('T')[0] // Use date part only for comparison
            const existingDates = chore.completedDates || []

            // Avoid duplicates
            if (existingDates.some(d => d.startsWith(dateStr))) {
              return chore
            }

            return {
              ...chore,
              completedDates: [...existingDates, date.toISOString()],
            }
          }

          // For non-recurring chores, mark as completed (existing behavior)
          return {
            ...chore,
            completed: true,
            completedDate: date.toISOString(),
          }
        })
      )
    },
    [setChores]
  )

  const getChoresForRange = useCallback(
    (start: Date, end: Date): ChoreInstance[] => {
      const instances: ChoreInstance[] = []

      chores.forEach(chore => {
        if (chore.recurrenceRule) {
          // Get all instances within the range
          const recurrenceInstances = getRecurrenceInstances(
            chore.recurrenceRule,
            start,
            end
          )
          recurrenceInstances.forEach(date => {
            // Check if this specific date is completed
            const dateStr = date.toISOString().split('T')[0]
            const isCompleted = chore.completedDates?.some(
              completedDate => completedDate.startsWith(dateStr)
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
          // Non-recurring chore - skip if completed (existing behavior)
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
    [chores]
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

    chores.forEach(chore => {
      if (chore.recurrenceRule && chore.completedDates) {
        // Add each completed instance of recurring chores
        chore.completedDates.forEach(completedDate => {
          completedInstances.push({
            chore,
            completedDate,
            instanceDate: completedDate,
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
  }, [chores])

  const value = useMemo(
    () => ({
      chores,
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
