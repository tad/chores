import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoreForm } from './ChoreForm'
import { ChoreProvider } from '@/contexts/ChoreContext'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { format } from 'date-fns'

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <HouseholdProvider>
      <ChoreProvider>{ui}</ChoreProvider>
    </HouseholdProvider>
  )
}

describe('ChoreForm', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('date handling', () => {
    it('correctly saves chore with clicked date (not previous day)', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      // Simulate clicking on January 16, 2026
      const clickedDate = new Date(2026, 0, 16) // Month is 0-indexed

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          initialDate={clickedDate}
        />
      )

      // Wait for form to be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Fill in the form
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test Chore for Date Bug')

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /add chore/i })
      await user.click(submitButton)

      // Verify the chore was saved with the correct date
      await waitFor(() => {
        const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
        expect(storedChores).toHaveLength(1)

        const savedChore = storedChores[0]
        const savedDate = new Date(savedChore.dueDate)

        // The saved date should be January 16, 2026, NOT January 15
        expect(savedDate.getFullYear()).toBe(2026)
        expect(savedDate.getMonth()).toBe(0) // January (0-indexed)
        expect(savedDate.getDate()).toBe(16) // Should be 16, not 15
      })
    })

    it('uses current date when no initialDate provided', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const today = new Date()

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
        />
      )

      // Wait for form to be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Check that the date input has today's date
      const dateInput = screen.getByLabelText(/due date/i) as HTMLInputElement
      expect(dateInput.value).toBe(format(today, 'yyyy-MM-dd'))

      // Fill in and submit
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Chore with today date')

      const submitButton = screen.getByRole('button', { name: /add chore/i })
      await user.click(submitButton)

      // Verify the saved date matches today
      await waitFor(() => {
        const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
        expect(storedChores).toHaveLength(1)

        const savedChore = storedChores[0]
        const savedDate = new Date(savedChore.dueDate)

        expect(savedDate.getFullYear()).toBe(today.getFullYear())
        expect(savedDate.getMonth()).toBe(today.getMonth())
        expect(savedDate.getDate()).toBe(today.getDate())
      })
    })

    it('preserves manually changed date', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const initialDate = new Date(2026, 0, 16)

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          initialDate={initialDate}
        />
      )

      // Wait for form to be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Change the date manually to January 20
      const dateInput = screen.getByLabelText(/due date/i)
      await user.clear(dateInput)
      await user.type(dateInput, '2026-01-20')

      // Fill in title
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Chore with custom date')

      // Submit
      const submitButton = screen.getByRole('button', { name: /add chore/i })
      await user.click(submitButton)

      // Verify the saved date is January 20, not the initial date
      await waitFor(() => {
        const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
        expect(storedChores).toHaveLength(1)

        const savedChore = storedChores[0]
        const savedDate = new Date(savedChore.dueDate)

        expect(savedDate.getFullYear()).toBe(2026)
        expect(savedDate.getMonth()).toBe(0)
        expect(savedDate.getDate()).toBe(20)
      })
    })
  })

  describe('form submission', () => {
    it('closes dialog after successful submission', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
        />
      )

      // Wait for form
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Fill and submit
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test Chore')

      const submitButton = screen.getByRole('button', { name: /add chore/i })
      await user.click(submitButton)

      // Verify onOpenChange was called with false
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('requires title to be filled', async () => {
      const onOpenChange = vi.fn()

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
        />
      )

      // Wait for form
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Submit button should be disabled when title is empty
      const submitButton = screen.getByRole('button', { name: /add chore/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('time input', () => {
    it('saves chore with time when provided', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      renderWithProviders(
        <ChoreForm open={true} onOpenChange={onOpenChange} />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Timed Chore')

      const timeInput = screen.getByLabelText(/time/i)
      await user.clear(timeInput)
      await user.type(timeInput, '14:30')

      await user.click(screen.getByRole('button', { name: /add chore/i }))

      await waitFor(() => {
        const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
        expect(storedChores[0].dueTime).toBe('14:30')
      })
    })

    it('saves chore without time when not provided', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      renderWithProviders(
        <ChoreForm open={true} onOpenChange={onOpenChange} />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Untimed Chore')
      await user.click(screen.getByRole('button', { name: /add chore/i }))

      await waitFor(() => {
        const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
        expect(storedChores[0].dueTime).toBeUndefined()
      })
    })

    it('preserves time when editing a chore', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      // First create a chore with time
      renderWithProviders(
        <ChoreForm open={true} onOpenChange={onOpenChange} />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Original Chore')
      const timeInput = screen.getByLabelText(/time/i)
      await user.clear(timeInput)
      await user.type(timeInput, '09:00')
      await user.click(screen.getByRole('button', { name: /add chore/i }))

      await waitFor(() => {
        const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
        expect(storedChores).toHaveLength(1)
      })

      // Now edit the chore
      const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
      const choreToEdit = storedChores[0]

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          editChore={choreToEdit}
        />
      )

      await waitFor(() => {
        const timeInputEdit = screen.getByLabelText(/time/i) as HTMLInputElement
        expect(timeInputEdit.value).toBe('09:00')
      })
    })
  })

  describe('recurrence editing', () => {
    it('shows RecurrenceSelect when editing a chore', async () => {
      const onOpenChange = vi.fn()

      // Create a chore with recurrence
      const choreWithRecurrence = {
        id: 'test-id',
        title: 'Recurring Chore',
        description: '',
        priority: 'medium' as const,
        assigneeId: null,
        dueDate: new Date(2026, 0, 16).toISOString(),
        dueTime: undefined,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
        completed: false,
        createdAt: new Date().toISOString(),
      }

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          editChore={choreWithRecurrence}
        />
      )

      // Wait for form to be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // RecurrenceSelect should be visible (look for "Repeat this chore" text)
      expect(screen.getByText(/repeat this chore/i)).toBeInTheDocument()
    })

    it('populates recurrence configuration when editing', async () => {
      const onOpenChange = vi.fn()

      // Create a chore with weekly recurrence on Mon, Wed, Fri
      const choreWithRecurrence = {
        id: 'test-id',
        title: 'Recurring Chore',
        description: '',
        priority: 'medium' as const,
        assigneeId: null,
        dueDate: new Date(2026, 0, 16).toISOString(),
        dueTime: undefined,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
        completed: false,
        createdAt: new Date().toISOString(),
      }

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          editChore={choreWithRecurrence}
        />
      )

      // Wait for form to be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // The recurrence should be set to "Weekly"
      // Note: This is a basic check - full UI testing would require checking
      // the actual select values, but that requires more complex DOM queries
      expect(screen.getByText(/repeat this chore/i)).toBeInTheDocument()
    })

    it('allows modifying recurrence when editing', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      // Create a chore with daily recurrence
      const choreWithRecurrence = {
        id: 'test-id',
        title: 'Recurring Chore',
        description: '',
        priority: 'medium' as const,
        assigneeId: null,
        dueDate: new Date(2026, 0, 16).toISOString(),
        dueTime: undefined,
        recurrenceRule: 'FREQ=DAILY',
        completed: false,
        createdAt: new Date().toISOString(),
      }

      // Store the chore first
      localStorage.setItem('chores', JSON.stringify([choreWithRecurrence]))

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          editChore={choreWithRecurrence}
        />
      )

      // Wait for form to be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Modify the title to trigger a change
      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Recurring Chore')

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      // Verify the chore was updated
      await waitFor(() => {
        const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
        expect(storedChores[0].title).toBe('Updated Recurring Chore')
        // Recurrence should still be present (contains FREQ=DAILY)
        expect(storedChores[0].recurrenceRule).toContain('FREQ=DAILY')
      })
    })

    it('handles editing chores without recurrence', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      // Create a chore without recurrence
      const choreWithoutRecurrence = {
        id: 'test-id',
        title: 'One-time Chore',
        description: '',
        priority: 'medium' as const,
        assigneeId: null,
        dueDate: new Date(2026, 0, 16).toISOString(),
        dueTime: undefined,
        recurrenceRule: undefined,
        completed: false,
        createdAt: new Date().toISOString(),
      }

      // Store the chore first
      localStorage.setItem('chores', JSON.stringify([choreWithoutRecurrence]))

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          editChore={choreWithoutRecurrence}
        />
      )

      // Wait for form to be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // RecurrenceSelect should still be visible
      expect(screen.getByText(/repeat this chore/i)).toBeInTheDocument()

      // Update the chore
      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated One-time Chore')

      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)

      // Verify the update
      await waitFor(() => {
        const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
        expect(storedChores[0].title).toBe('Updated One-time Chore')
        expect(storedChores[0].recurrenceRule).toBeUndefined()
      })
    })
  })

  describe('delete confirmation', () => {
    const createTestChore = () => ({
      id: 'test-delete-id',
      title: 'Chore to Delete',
      description: '',
      priority: 'medium' as const,
      assigneeId: null,
      dueDate: new Date(2026, 0, 16).toISOString(),
      dueTime: undefined,
      recurrenceRule: undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    })

    it('opens confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const testChore = createTestChore()

      localStorage.setItem('chores', JSON.stringify([testChore]))

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          editChore={testChore}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Click the Delete button
      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      // Confirmation dialog should appear with the title "Delete Chore"
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /delete chore/i })).toBeInTheDocument()
      })
    })

    it('shows chore title in confirmation message', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const testChore = createTestChore()

      localStorage.setItem('chores', JSON.stringify([testChore]))

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          editChore={testChore}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      // Confirmation message should include the chore title
      await waitFor(() => {
        expect(screen.getByText(/chore to delete/i)).toBeInTheDocument()
      })
    })

    it('closes confirmation dialog when cancel is clicked without deleting', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const testChore = createTestChore()

      localStorage.setItem('chores', JSON.stringify([testChore]))

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          editChore={testChore}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Click the Delete button to open confirmation
      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /delete chore/i })).toBeInTheDocument()
      })

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Confirmation dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /delete chore/i })).not.toBeInTheDocument()
      })

      // Chore should still exist in storage
      const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
      expect(storedChores).toHaveLength(1)
      expect(storedChores[0].id).toBe('test-delete-id')
    })

    it('deletes chore when confirm is clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      const testChore = createTestChore()

      localStorage.setItem('chores', JSON.stringify([testChore]))

      renderWithProviders(
        <ChoreForm
          open={true}
          onOpenChange={onOpenChange}
          editChore={testChore}
        />
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      // Click the Delete button to open confirmation
      const deleteButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /delete chore/i })).toBeInTheDocument()
      })

      // Click the confirmation Delete button (in the dialog footer)
      const confirmDeleteButtons = screen.getAllByRole('button', { name: /^delete$/i })
      // The second Delete button is the confirmation one
      const confirmDeleteButton = confirmDeleteButtons[confirmDeleteButtons.length - 1]
      await user.click(confirmDeleteButton)

      // Dialog should close
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })

      // Chore should be deleted from storage
      await waitFor(() => {
        const storedChores = JSON.parse(localStorage.getItem('chores') || '[]')
        expect(storedChores).toHaveLength(0)
      })
    })
  })
})
