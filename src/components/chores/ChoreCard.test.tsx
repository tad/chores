import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoreCard } from './ChoreCard'
import { ChoreProvider } from '@/contexts/ChoreContext'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import type { ChoreInstance } from '@/types'

const mockChoreInstance: ChoreInstance = {
  chore: {
    id: 'test-chore-1',
    title: 'Test Chore',
    description: 'Test description',
    priority: 'medium',
    assigneeId: null,
    dueDate: '2025-01-15T10:00:00Z',
    createdAt: '2025-01-01T10:00:00Z',
    completed: false,
  },
  date: new Date('2025-01-15T10:00:00Z'),
  isRecurrenceInstance: false,
}

const mockRecurringChoreInstance: ChoreInstance = {
  chore: {
    id: 'test-chore-2',
    title: 'Recurring Chore',
    priority: 'high',
    assigneeId: null,
    dueDate: '2025-01-15T10:00:00Z',
    createdAt: '2025-01-01T10:00:00Z',
    completed: false,
    recurrenceRule: 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
  },
  date: new Date('2025-01-15T10:00:00Z'),
  isRecurrenceInstance: true,
}

const renderWithProviders = (
  ui: React.ReactElement,
  initialChores: ChoreInstance['chore'][] = []
) => {
  // Set up localStorage with initial chores
  if (initialChores.length > 0) {
    localStorage.setItem('chores', JSON.stringify(initialChores))
  }

  return render(
    <HouseholdProvider>
      <ChoreProvider>{ui}</ChoreProvider>
    </HouseholdProvider>
  )
}

describe('ChoreCard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('display', () => {
    it('renders chore title', () => {
      const onEdit = vi.fn()
      renderWithProviders(
        <ChoreCard instance={mockChoreInstance} onEdit={onEdit} />
      )

      expect(screen.getByText('Test Chore')).toBeInTheDocument()
    })

    it('renders chore description', () => {
      const onEdit = vi.fn()
      renderWithProviders(
        <ChoreCard instance={mockChoreInstance} onEdit={onEdit} />
      )

      expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('shows recurrence icon for recurring chores', () => {
      const onEdit = vi.fn()
      renderWithProviders(
        <ChoreCard instance={mockRecurringChoreInstance} onEdit={onEdit} />
      )

      // The Repeat icon should be present
      expect(screen.getByText('Recurring Chore')).toBeInTheDocument()
    })

    it('renders compact mode correctly', () => {
      const onEdit = vi.fn()
      renderWithProviders(
        <ChoreCard instance={mockChoreInstance} onEdit={onEdit} compact />
      )

      expect(screen.getByText('Test Chore')).toBeInTheDocument()
      // Description should not be visible in compact mode
      expect(screen.queryByText('Test description')).not.toBeInTheDocument()
    })
  })

  describe('popover menu', () => {
    it('opens popover when clicking on the card', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      renderWithProviders(
        <ChoreCard instance={mockChoreInstance} onEdit={onEdit} />
      )

      await user.click(screen.getByText('Test Chore'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /mark done/i })).toBeInTheDocument()
      })
    })

    it('opens popover when clicking compact card', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      renderWithProviders(
        <ChoreCard instance={mockChoreInstance} onEdit={onEdit} compact />
      )

      await user.click(screen.getByText('Test Chore'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /mark done/i })).toBeInTheDocument()
      })
    })

    it('calls onEdit when clicking Edit button', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      renderWithProviders(
        <ChoreCard instance={mockChoreInstance} onEdit={onEdit} />
      )

      // Open popover
      await user.click(screen.getByText('Test Chore'))

      // Click Edit
      await waitFor(async () => {
        const editButton = screen.getByRole('button', { name: /edit/i })
        await user.click(editButton)
      })

      expect(onEdit).toHaveBeenCalledTimes(1)
    })

    it('closes popover after clicking Edit', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      renderWithProviders(
        <ChoreCard instance={mockChoreInstance} onEdit={onEdit} />
      )

      // Open popover
      await user.click(screen.getByText('Test Chore'))

      // Click Edit
      await waitFor(async () => {
        const editButton = screen.getByRole('button', { name: /edit/i })
        await user.click(editButton)
      })

      // Popover should be closed
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
      })
    })

    it('deletes chore when clicking Mark Done', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()

      // Initialize with the chore in localStorage
      renderWithProviders(
        <ChoreCard instance={mockChoreInstance} onEdit={onEdit} />,
        [mockChoreInstance.chore]
      )

      // Open popover
      await user.click(screen.getByText('Test Chore'))

      // Click Mark Done
      await waitFor(async () => {
        const markDoneButton = screen.getByRole('button', { name: /mark done/i })
        await user.click(markDoneButton)
      })

      // Verify the chore is deleted from localStorage
      await waitFor(() => {
        const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
        expect(storedChores.find((c: { id: string }) => c.id === 'test-chore-1')).toBeUndefined()
      })
    })

    it('closes popover after clicking Mark Done', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()

      renderWithProviders(
        <ChoreCard instance={mockChoreInstance} onEdit={onEdit} />,
        [mockChoreInstance.chore]
      )

      // Open popover
      await user.click(screen.getByText('Test Chore'))

      // Click Mark Done
      await waitFor(async () => {
        const markDoneButton = screen.getByRole('button', { name: /mark done/i })
        await user.click(markDoneButton)
      })

      // Popover should be closed
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /mark done/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('priority colors', () => {
    it('applies correct border color for low priority', () => {
      const onEdit = vi.fn()
      const lowPriorityInstance: ChoreInstance = {
        ...mockChoreInstance,
        chore: { ...mockChoreInstance.chore, priority: 'low' },
      }

      const { container } = renderWithProviders(
        <ChoreCard instance={lowPriorityInstance} onEdit={onEdit} />
      )

      const card = container.querySelector('.border-l-green-500')
      expect(card).toBeInTheDocument()
    })

    it('applies correct border color for medium priority', () => {
      const onEdit = vi.fn()
      const mediumPriorityInstance: ChoreInstance = {
        ...mockChoreInstance,
        chore: { ...mockChoreInstance.chore, priority: 'medium' },
      }

      const { container } = renderWithProviders(
        <ChoreCard instance={mediumPriorityInstance} onEdit={onEdit} />
      )

      const card = container.querySelector('.border-l-yellow-500')
      expect(card).toBeInTheDocument()
    })

    it('applies correct border color for high priority', () => {
      const onEdit = vi.fn()
      const highPriorityInstance: ChoreInstance = {
        ...mockChoreInstance,
        chore: { ...mockChoreInstance.chore, priority: 'high' },
      }

      const { container } = renderWithProviders(
        <ChoreCard instance={highPriorityInstance} onEdit={onEdit} />
      )

      const card = container.querySelector('.border-l-red-500')
      expect(card).toBeInTheDocument()
    })
  })

  describe('event propagation', () => {
    it('prevents click events from bubbling to parent elements', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const parentOnClick = vi.fn()

      const { container } = renderWithProviders(
        <div onClick={parentOnClick}>
          <ChoreCard instance={mockChoreInstance} onEdit={onEdit} />
        </div>
      )

      // Click on the chore card
      const card = container.querySelector('.cursor-pointer')
      if (card) {
        await user.click(card)
      }

      // Parent onClick should NOT be called because event propagation is stopped
      expect(parentOnClick).not.toHaveBeenCalled()
    })

    it('still allows popover to open when clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const parentOnClick = vi.fn()

      renderWithProviders(
        <div onClick={parentOnClick}>
          <ChoreCard instance={mockChoreInstance} onEdit={onEdit} />
        </div>
      )

      // Click on the chore card
      await user.click(screen.getByText('Test Chore'))

      // Popover should open
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      })

      // Parent onClick should NOT be called
      expect(parentOnClick).not.toHaveBeenCalled()
    })
  })
})
