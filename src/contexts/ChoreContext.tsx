import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Chore, ChoreInstance } from '@/types'
import { getRecurrenceInstances } from '@/lib/recurrence'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
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
}

const ChoreContext = createContext<ChoreContextType | null>(null)

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function ChoreProvider({ children }: { children: ReactNode }) {
  const [chores, setChores] = useLocalStorage<Chore[]>('chores', [])

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

          // For recurring chores, we mark only the specific instance as completed
          // by updating the completed status and date
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
        // Skip completed chores
        if (chore.completed) return

        const choreDate = new Date(chore.dueDate)

        if (chore.recurrenceRule) {
          // Get all instances within the range
          const recurrenceInstances = getRecurrenceInstances(
            chore.recurrenceRule,
            start,
            end
          )
          recurrenceInstances.forEach(date => {
            instances.push({
              chore,
              date,
              isRecurrenceInstance: true,
            })
          })
        } else {
          // Non-recurring chore - check if it falls within range
          if (choreDate >= start && choreDate <= end) {
            instances.push({
              chore,
              date: choreDate,
              isRecurrenceInstance: false,
            })
          }
        }
      })

      return instances.sort((a, b) => a.date.getTime() - b.date.getTime())
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
