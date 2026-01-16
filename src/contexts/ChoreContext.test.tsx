import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ChoreProvider, useChores } from './ChoreContext'
import type { ReactNode } from 'react'
import type { Chore } from '@/types'

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChoreProvider>{children}</ChoreProvider>
)

describe('ChoreContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('useChores hook', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useChores())
      }).toThrow('useChores must be used within a ChoreProvider')

      consoleSpy.mockRestore()
    })

    it('returns context values when used within provider', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      expect(result.current.chores).toEqual([])
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

  describe('addChore', () => {
    it('adds a chore with provided data', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      const choreData: Omit<Chore, 'id' | 'createdAt' | 'completed'> = {
        title: 'Test Chore',
        priority: 'medium',
        assigneeId: null,
        dueDate: '2025-01-15T10:00:00Z',
      }

      act(() => {
        result.current.addChore(choreData)
      })

      expect(result.current.chores).toHaveLength(1)
      expect(result.current.chores[0].title).toBe('Test Chore')
      expect(result.current.chores[0].priority).toBe('medium')
    })

    it('auto-generates unique ID', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Chore 1',
          priority: 'low',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
        result.current.addChore({
          title: 'Chore 2',
          priority: 'high',
          assigneeId: null,
          dueDate: '2025-01-16T10:00:00Z',
        })
      })

      expect(result.current.chores[0].id).not.toBe(result.current.chores[1].id)
    })

    it('sets createdAt to current timestamp', () => {
      const { result } = renderHook(() => useChores(), { wrapper })
      const beforeAdd = new Date().toISOString()

      act(() => {
        result.current.addChore({
          title: 'Test',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      const afterAdd = new Date().toISOString()
      const createdAt = result.current.chores[0].createdAt

      expect(createdAt >= beforeAdd).toBe(true)
      expect(createdAt <= afterAdd).toBe(true)
    })

    it('sets completed to false', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Test',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      expect(result.current.chores[0].completed).toBe(false)
    })

    it('preserves existing chores', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'First',
          priority: 'low',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      act(() => {
        result.current.addChore({
          title: 'Second',
          priority: 'high',
          assigneeId: null,
          dueDate: '2025-01-16T10:00:00Z',
        })
      })

      expect(result.current.chores).toHaveLength(2)
      expect(result.current.chores[0].title).toBe('First')
      expect(result.current.chores[1].title).toBe('Second')
    })
  })

  describe('updateChore', () => {
    it('updates chore title', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Original',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      const choreId = result.current.chores[0].id

      act(() => {
        result.current.updateChore(choreId, { title: 'Updated' })
      })

      expect(result.current.chores[0].title).toBe('Updated')
    })

    it('updates multiple fields', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Test',
          priority: 'low',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      const choreId = result.current.chores[0].id

      act(() => {
        result.current.updateChore(choreId, {
          title: 'New Title',
          priority: 'high',
          description: 'New description',
        })
      })

      expect(result.current.chores[0].title).toBe('New Title')
      expect(result.current.chores[0].priority).toBe('high')
      expect(result.current.chores[0].description).toBe('New description')
    })

    it('does not affect other chores', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Chore 1',
          priority: 'low',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
        result.current.addChore({
          title: 'Chore 2',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-16T10:00:00Z',
        })
      })

      const chore1Id = result.current.chores[0].id

      act(() => {
        result.current.updateChore(chore1Id, { title: 'Updated' })
      })

      expect(result.current.chores[1].title).toBe('Chore 2')
    })

    it('does nothing for non-existent ID', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Test',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      act(() => {
        result.current.updateChore('non-existent', { title: 'New' })
      })

      expect(result.current.chores[0].title).toBe('Test')
    })
  })

  describe('deleteChore', () => {
    it('removes chore by ID', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Test',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      const choreId = result.current.chores[0].id

      act(() => {
        result.current.deleteChore(choreId)
      })

      expect(result.current.chores).toHaveLength(0)
    })

    it('preserves other chores', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Chore 1',
          priority: 'low',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
        result.current.addChore({
          title: 'Chore 2',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-16T10:00:00Z',
        })
        result.current.addChore({
          title: 'Chore 3',
          priority: 'high',
          assigneeId: null,
          dueDate: '2025-01-17T10:00:00Z',
        })
      })

      const chore2Id = result.current.chores[1].id

      act(() => {
        result.current.deleteChore(chore2Id)
      })

      expect(result.current.chores).toHaveLength(2)
      expect(result.current.chores.find(c => c.title === 'Chore 2')).toBeUndefined()
      expect(result.current.chores.find(c => c.title === 'Chore 1')).toBeDefined()
      expect(result.current.chores.find(c => c.title === 'Chore 3')).toBeDefined()
    })

    it('does nothing for non-existent ID', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Test',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      act(() => {
        result.current.deleteChore('non-existent')
      })

      expect(result.current.chores).toHaveLength(1)
    })
  })

  describe('completeChore', () => {
    it('marks chore as completed', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Test',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      const choreId = result.current.chores[0].id
      const completionDate = new Date('2025-01-15T12:00:00Z')

      act(() => {
        result.current.completeChore(choreId, completionDate)
      })

      expect(result.current.chores[0].completed).toBe(true)
    })

    it('sets completedDate', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Test',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      const choreId = result.current.chores[0].id
      const completionDate = new Date('2025-01-15T12:00:00Z')

      act(() => {
        result.current.completeChore(choreId, completionDate)
      })

      expect(result.current.chores[0].completedDate).toBe(completionDate.toISOString())
    })

    it('does nothing for non-existent ID', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Test',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      act(() => {
        result.current.completeChore('non-existent', new Date())
      })

      expect(result.current.chores[0].completed).toBe(false)
    })

    it('adds date to completedDates array for recurring chores', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Daily Chore',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          recurrenceRule: 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
        })
      })

      const choreId = result.current.chores[0].id
      const completionDate = new Date('2025-01-15T12:00:00Z')

      act(() => {
        result.current.completeChore(choreId, completionDate)
      })

      expect(result.current.chores[0].completedDates).toContain(completionDate.toISOString())
      expect(result.current.chores[0].completed).toBe(false)
    })

    it('does not add duplicate dates to completedDates', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Daily Chore',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          recurrenceRule: 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
        })
      })

      const choreId = result.current.chores[0].id
      const completionDate = new Date('2025-01-15T12:00:00Z')

      act(() => {
        result.current.completeChore(choreId, completionDate)
        result.current.completeChore(choreId, completionDate)
      })

      expect(result.current.chores[0].completedDates).toHaveLength(1)
    })

    it('allows completing multiple different dates', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Daily Chore',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          recurrenceRule: 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
        })
      })

      const choreId = result.current.chores[0].id

      act(() => {
        result.current.completeChore(choreId, new Date('2025-01-15T12:00:00Z'))
        result.current.completeChore(choreId, new Date('2025-01-16T12:00:00Z'))
      })

      expect(result.current.chores[0].completedDates).toHaveLength(2)
    })
  })

  describe('getChoresForRange', () => {
    it('returns non-recurring chores within range', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'In Range',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      const instances = result.current.getChoresForRange(
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-31T23:59:59Z')
      )

      expect(instances).toHaveLength(1)
      expect(instances[0].chore.title).toBe('In Range')
      expect(instances[0].isRecurrenceInstance).toBe(false)
    })

    it('excludes non-recurring chores outside range', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Out of Range',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-02-15T10:00:00Z',
        })
      })

      const instances = result.current.getChoresForRange(
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-31T23:59:59Z')
      )

      expect(instances).toHaveLength(0)
    })

    it('excludes completed chores', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Completed',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      const choreId = result.current.chores[0].id

      act(() => {
        result.current.completeChore(choreId, new Date())
      })

      const instances = result.current.getChoresForRange(
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-31T23:59:59Z')
      )

      expect(instances).toHaveLength(0)
    })

    it('expands recurring chores within range', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Daily Chore',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          recurrenceRule: 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
        })
      })

      const instances = result.current.getChoresForRange(
        new Date('2025-01-15T00:00:00Z'),
        new Date('2025-01-21T23:59:59Z')
      )

      expect(instances.length).toBeGreaterThanOrEqual(7)
      instances.forEach(instance => {
        expect(instance.isRecurrenceInstance).toBe(true)
      })
    })

    it('sorts instances by date', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Later',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-20T10:00:00Z',
        })
        result.current.addChore({
          title: 'Earlier',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-10T10:00:00Z',
        })
      })

      const instances = result.current.getChoresForRange(
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-31T23:59:59Z')
      )

      expect(instances[0].chore.title).toBe('Earlier')
      expect(instances[1].chore.title).toBe('Later')
    })

    it('excludes completed instances but keeps uncompleted ones for recurring chores', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Daily Chore',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          recurrenceRule: 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
        })
      })

      const choreId = result.current.chores[0].id

      // Complete one instance (Jan 16)
      act(() => {
        result.current.completeChore(choreId, new Date('2025-01-16T10:00:00Z'))
      })

      // Query for Jan 15-17
      const instances = result.current.getChoresForRange(
        new Date('2025-01-15T00:00:00Z'),
        new Date('2025-01-17T23:59:59Z')
      )

      // Should have Jan 15 and Jan 17, but NOT Jan 16
      expect(instances.length).toBe(2)
      const dates = instances.map(i => i.date.toISOString().split('T')[0])
      expect(dates).toContain('2025-01-15')
      expect(dates).toContain('2025-01-17')
      expect(dates).not.toContain('2025-01-16')
    })

    it('sorts timed chores before untimed chores on same day', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Untimed',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
        result.current.addChore({
          title: 'Timed',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          dueTime: '14:30',
        })
      })

      const instances = result.current.getChoresForRange(
        new Date('2025-01-15T00:00:00Z'),
        new Date('2025-01-15T23:59:59Z')
      )

      expect(instances[0].chore.title).toBe('Timed')
      expect(instances[1].chore.title).toBe('Untimed')
    })

    it('sorts timed chores chronologically', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Later',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          dueTime: '16:00',
        })
        result.current.addChore({
          title: 'Earlier',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          dueTime: '09:00',
        })
      })

      const instances = result.current.getChoresForRange(
        new Date('2025-01-15T00:00:00Z'),
        new Date('2025-01-15T23:59:59Z')
      )

      expect(instances[0].chore.title).toBe('Earlier')
      expect(instances[1].chore.title).toBe('Later')
    })

    it('sorts by date first, then by time', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Day 2 Morning',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-16T10:00:00Z',
          dueTime: '09:00',
        })
        result.current.addChore({
          title: 'Day 1 Evening',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          dueTime: '18:00',
        })
        result.current.addChore({
          title: 'Day 1 Morning',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          dueTime: '09:00',
        })
      })

      const instances = result.current.getChoresForRange(
        new Date('2025-01-15T00:00:00Z'),
        new Date('2025-01-16T23:59:59Z')
      )

      expect(instances[0].chore.title).toBe('Day 1 Morning')
      expect(instances[1].chore.title).toBe('Day 1 Evening')
      expect(instances[2].chore.title).toBe('Day 2 Morning')
    })

    it('maintains mixed sorting with timed and untimed chores across multiple days', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Day 2 Untimed',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-16T10:00:00Z',
        })
        result.current.addChore({
          title: 'Day 1 Timed',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          dueTime: '14:30',
        })
        result.current.addChore({
          title: 'Day 1 Untimed',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
        result.current.addChore({
          title: 'Day 2 Timed',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-16T10:00:00Z',
          dueTime: '10:00',
        })
      })

      const instances = result.current.getChoresForRange(
        new Date('2025-01-15T00:00:00Z'),
        new Date('2025-01-16T23:59:59Z')
      )

      expect(instances[0].chore.title).toBe('Day 1 Timed')
      expect(instances[1].chore.title).toBe('Day 1 Untimed')
      expect(instances[2].chore.title).toBe('Day 2 Timed')
      expect(instances[3].chore.title).toBe('Day 2 Untimed')
    })
  })

  describe('getChoresForDay', () => {
    it('returns chores for the specific day', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Today',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T14:00:00Z',
        })
        result.current.addChore({
          title: 'Tomorrow',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-16T10:00:00Z',
        })
      })

      const instances = result.current.getChoresForDay(new Date('2025-01-15T12:00:00Z'))

      expect(instances).toHaveLength(1)
      expect(instances[0].chore.title).toBe('Today')
    })
  })

  describe('getChoresForWeek', () => {
    it('returns chores for the entire week starting Sunday', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      // Jan 15, 2025 is a Wednesday
      // Week should be Jan 12 (Sun) to Jan 18 (Sat)
      act(() => {
        result.current.addChore({
          title: 'In Week',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
        result.current.addChore({
          title: 'Next Week',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-20T10:00:00Z',
        })
      })

      const instances = result.current.getChoresForWeek(new Date('2025-01-15T12:00:00Z'))

      expect(instances).toHaveLength(1)
      expect(instances[0].chore.title).toBe('In Week')
    })
  })

  describe('getChoresForMonth', () => {
    it('returns chores for the entire month', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Jan 1st',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-01T10:00:00Z',
        })
        result.current.addChore({
          title: 'Jan 31st',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-31T10:00:00Z',
        })
        result.current.addChore({
          title: 'Feb 1st',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-02-01T10:00:00Z',
        })
      })

      const instances = result.current.getChoresForMonth(new Date('2025-01-15T12:00:00Z'))

      expect(instances).toHaveLength(2)
      expect(instances.find(i => i.chore.title === 'Jan 1st')).toBeDefined()
      expect(instances.find(i => i.chore.title === 'Jan 31st')).toBeDefined()
      expect(instances.find(i => i.chore.title === 'Feb 1st')).toBeUndefined()
    })
  })

  describe('getCompletedChores', () => {
    it('returns only completed chores', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Incomplete',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
        result.current.addChore({
          title: 'Complete',
          priority: 'high',
          assigneeId: null,
          dueDate: '2025-01-16T10:00:00Z',
        })
      })

      const completeId = result.current.chores[1].id

      act(() => {
        result.current.completeChore(completeId, new Date('2025-01-16T12:00:00Z'))
      })

      const completed = result.current.getCompletedChores()

      expect(completed).toHaveLength(1)
      expect(completed[0].chore.title).toBe('Complete')
    })

    it('sorts by completion date, most recent first', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'First Completed',
          priority: 'low',
          assigneeId: null,
          dueDate: '2025-01-10T10:00:00Z',
        })
        result.current.addChore({
          title: 'Second Completed',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      act(() => {
        result.current.completeChore(result.current.chores[0].id, new Date('2025-01-10T12:00:00Z'))
      })

      act(() => {
        result.current.completeChore(result.current.chores[1].id, new Date('2025-01-15T12:00:00Z'))
      })

      const completed = result.current.getCompletedChores()

      expect(completed).toHaveLength(2)
      expect(completed[0].chore.title).toBe('Second Completed')
      expect(completed[1].chore.title).toBe('First Completed')
    })

    it('returns empty array when no chores are completed', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Incomplete',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
        })
      })

      const completed = result.current.getCompletedChores()

      expect(completed).toHaveLength(0)
    })

    it('returns individual completed instances of recurring chores', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        result.current.addChore({
          title: 'Daily Chore',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          recurrenceRule: 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
        })
      })

      const choreId = result.current.chores[0].id

      act(() => {
        result.current.completeChore(choreId, new Date('2025-01-15T12:00:00Z'))
        result.current.completeChore(choreId, new Date('2025-01-16T14:00:00Z'))
      })

      const completed = result.current.getCompletedChores()

      expect(completed).toHaveLength(2)
      expect(completed[0].chore.title).toBe('Daily Chore')
      expect(completed[1].chore.title).toBe('Daily Chore')
    })

    it('returns both recurring and non-recurring completed chores', () => {
      const { result } = renderHook(() => useChores(), { wrapper })

      act(() => {
        // Add recurring chore
        result.current.addChore({
          title: 'Daily Chore',
          priority: 'medium',
          assigneeId: null,
          dueDate: '2025-01-15T10:00:00Z',
          recurrenceRule: 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
        })
        // Add non-recurring chore
        result.current.addChore({
          title: 'One-time Chore',
          priority: 'high',
          assigneeId: null,
          dueDate: '2025-01-20T10:00:00Z',
        })
      })

      const recurringId = result.current.chores[0].id
      const oneTimeId = result.current.chores[1].id

      act(() => {
        result.current.completeChore(recurringId, new Date('2025-01-15T12:00:00Z'))
        result.current.completeChore(oneTimeId, new Date('2025-01-20T15:00:00Z'))
      })

      const completed = result.current.getCompletedChores()

      expect(completed).toHaveLength(2)
    })
  })
})
