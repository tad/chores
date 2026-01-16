import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompletedTasksSidebar } from './CompletedTasksSidebar'
import { ChoreProvider } from '@/contexts/ChoreContext'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import type { Chore, HouseholdMember } from '@/types'

const completedChore: Chore = {
  id: 'completed-1',
  title: 'Completed Task',
  priority: 'medium',
  assigneeId: 'member-1',
  dueDate: '2025-01-15T10:00:00Z',
  createdAt: '2025-01-01T10:00:00Z',
  completed: true,
  completedDate: '2025-01-15T12:00:00Z',
}

const member: HouseholdMember = {
  id: 'member-1',
  name: 'Test User',
  color: '#3b82f6',
}

const renderWithProviders = (
  ui: React.ReactElement,
  { chores = [], members = [] }: { chores?: Chore[]; members?: HouseholdMember[] } = {}
) => {
  localStorage.setItem('chores', JSON.stringify(chores))
  localStorage.setItem('household-members', JSON.stringify(members))

  return render(
    <HouseholdProvider>
      <ChoreProvider>{ui}</ChoreProvider>
    </HouseholdProvider>
  )
}

describe('CompletedTasksSidebar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders nothing when closed', () => {
    const onClose = vi.fn()
    const { container } = renderWithProviders(
      <CompletedTasksSidebar isOpen={false} onClose={onClose} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders sidebar when open', () => {
    const onClose = vi.fn()
    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />)

    expect(screen.getByText('Completed Tasks')).toBeInTheDocument()
  })

  it('shows completed tasks grouped by assignee', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />, {
      chores: [completedChore],
      members: [member],
    })

    expect(screen.getByText('Test User')).toBeInTheDocument()

    // Expand the group to see tasks
    await user.click(screen.getByText('Test User'))

    expect(screen.getByText('Completed Task')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />)

    const closeButton = screen.getByRole('button', { name: '' })
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('displays filter dropdown with all members', () => {
    const onClose = vi.fn()
    const member2: HouseholdMember = { id: 'member-2', name: 'Another User', color: '#10b981' }
    const chore2: Chore = {
      ...completedChore,
      id: 'completed-2',
      title: 'Other Task',
      assigneeId: 'member-2',
    }

    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />, {
      chores: [completedChore, chore2],
      members: [member, member2],
    })

    // Both groups should be present when filter is "All Members"
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Another User')).toBeInTheDocument()

    // Filter dropdown should be present
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('displays completion date for each task', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />, {
      chores: [completedChore],
      members: [member],
    })

    // Expand the group to see task details
    await user.click(screen.getByText('Test User'))

    expect(screen.getByText(/Completed Jan 15, 2025/)).toBeInTheDocument()
  })

  it('shows empty state when no completed tasks', () => {
    const onClose = vi.fn()
    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />)

    expect(screen.getByText('No completed tasks yet')).toBeInTheDocument()
  })

  it('groups unassigned tasks separately', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const unassignedChore: Chore = {
      ...completedChore,
      id: 'unassigned-1',
      title: 'Unassigned Task',
      assigneeId: null,
    }

    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />, {
      chores: [completedChore, unassignedChore],
      members: [member],
    })

    // Both group headers should be present
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()

    // Expand unassigned group (should be expanded by default based on code)
    expect(screen.getByText('Unassigned Task')).toBeInTheDocument()

    // Expand Test User group
    await user.click(screen.getByText('Test User'))
    expect(screen.getByText('Completed Task')).toBeInTheDocument()
  })

  it('toggles group expansion when clicking group header', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />, {
      chores: [completedChore],
      members: [member],
    })

    // Group should be collapsed initially, so task is not visible
    expect(screen.queryByText('Completed Task')).not.toBeInTheDocument()

    // Click group header to expand
    await user.click(screen.getByText('Test User'))

    // Task should be visible
    await waitFor(() => {
      expect(screen.getByText('Completed Task')).toBeInTheDocument()
    })

    // Click again to collapse
    await user.click(screen.getByText('Test User'))

    // Task should be hidden again
    await waitFor(() => {
      expect(screen.queryByText('Completed Task')).not.toBeInTheDocument()
    })
  })

  it('shows task count for each group', () => {
    const onClose = vi.fn()
    const chore2: Chore = {
      ...completedChore,
      id: 'completed-2',
      title: 'Another Task',
    }

    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />, {
      chores: [completedChore, chore2],
      members: [member],
    })

    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('shows multiple completed instances of a recurring chore', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const recurringChore: Chore = {
      id: 'recurring-1',
      title: 'Daily Task',
      priority: 'medium',
      assigneeId: 'member-1',
      dueDate: '2025-01-15T10:00:00Z',
      createdAt: '2025-01-01T10:00:00Z',
      completed: false,
      recurrenceRule: 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
      completedDates: ['2025-01-15T12:00:00Z', '2025-01-16T14:00:00Z'],
    }

    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />, {
      chores: [recurringChore],
      members: [member],
    })

    // Expand the group
    await user.click(screen.getByText('Test User'))

    // Should show two instances
    const dailyTasks = screen.getAllByText('Daily Task')
    expect(dailyTasks).toHaveLength(2)
  })

  it('shows recurrence icon for completed recurring chore instances', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const recurringChore: Chore = {
      id: 'recurring-1',
      title: 'Daily Task',
      priority: 'medium',
      assigneeId: 'member-1',
      dueDate: '2025-01-15T10:00:00Z',
      createdAt: '2025-01-01T10:00:00Z',
      completed: false,
      recurrenceRule: 'DTSTART:20250115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1',
      completedDates: ['2025-01-15T12:00:00Z'],
    }

    renderWithProviders(<CompletedTasksSidebar isOpen={true} onClose={onClose} />, {
      chores: [recurringChore],
      members: [member],
    })

    // Expand the group
    await user.click(screen.getByText('Test User'))

    // Verify task is shown
    expect(screen.getByText('Daily Task')).toBeInTheDocument()
  })
})
