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
})
