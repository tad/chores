import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HouseholdMemberList } from './HouseholdMemberList'
import { HouseholdProvider, MEMBER_COLORS } from '@/contexts/HouseholdContext'

const renderWithProvider = () => {
  return render(
    <HouseholdProvider>
      <HouseholdMemberList />
    </HouseholdProvider>
  )
}

describe('HouseholdMemberList', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('color change feature', () => {
    it('displays color indicator for each member', async () => {
      const user = userEvent.setup()
      renderWithProvider()

      // Open the dialog
      await user.click(screen.getByRole('button', { name: /household/i }))

      // Add a member
      const input = screen.getByPlaceholderText(/enter name/i)
      await user.type(input, 'John')
      await user.click(screen.getByRole('button', { name: '' })) // Plus button

      // Find the member's color button
      const colorButton = screen.getByRole('button', { name: /change color for john/i })
      expect(colorButton).toBeInTheDocument()
    })

    it('opens color picker popover when clicking member color', async () => {
      const user = userEvent.setup()
      renderWithProvider()

      // Open the dialog
      await user.click(screen.getByRole('button', { name: /household/i }))

      // Add a member
      const input = screen.getByPlaceholderText(/enter name/i)
      await user.type(input, 'John')
      await user.click(screen.getByRole('button', { name: '' }))

      // Click on the color button to open popover
      const colorButton = screen.getByRole('button', { name: /change color for john/i })
      await user.click(colorButton)

      // Verify popover content is shown
      expect(screen.getByText('Choose color')).toBeInTheDocument()
    })

    it('shows all available colors in the picker', async () => {
      const user = userEvent.setup()
      renderWithProvider()

      // Open the dialog
      await user.click(screen.getByRole('button', { name: /household/i }))

      // Add a member
      const input = screen.getByPlaceholderText(/enter name/i)
      await user.type(input, 'John')
      await user.click(screen.getByRole('button', { name: '' }))

      // Click on the color button to open popover
      const colorButton = screen.getByRole('button', { name: /change color for john/i })
      await user.click(colorButton)

      // Find all color option buttons in the popover (excluding the trigger)
      const popoverContent = screen.getByText('Choose color').parentElement!
      const colorOptions = within(popoverContent).getAllByRole('button')

      expect(colorOptions).toHaveLength(MEMBER_COLORS.length)
    })

    it('changes member color when selecting a new color', async () => {
      const user = userEvent.setup()
      renderWithProvider()

      // Open the dialog
      await user.click(screen.getByRole('button', { name: /household/i }))

      // Add a member
      const input = screen.getByPlaceholderText(/enter name/i)
      await user.type(input, 'John')
      await user.click(screen.getByRole('button', { name: '' }))

      // Get initial color
      const colorButton = screen.getByRole('button', { name: /change color for john/i })
      const initialColor = colorButton.style.backgroundColor

      // Click to open popover
      await user.click(colorButton)

      // Select a different color (the last one to ensure it's different)
      const popoverContent = screen.getByText('Choose color').parentElement!
      const colorOptions = within(popoverContent).getAllByRole('button')
      const newColorButton = colorOptions[colorOptions.length - 1]
      await user.click(newColorButton)

      // Verify the color changed
      const updatedColorButton = screen.getByRole('button', { name: /change color for john/i })
      expect(updatedColorButton.style.backgroundColor).not.toBe(initialColor)
    })

    it('highlights current color in the picker', async () => {
      const user = userEvent.setup()
      renderWithProvider()

      // Open the dialog
      await user.click(screen.getByRole('button', { name: /household/i }))

      // Add a member with specific color
      const input = screen.getByPlaceholderText(/enter name/i)
      await user.type(input, 'John')

      // Select a specific color before adding
      const addColorButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.includes('Select') &&
        btn.getAttribute('aria-label')?.includes('color')
      )
      await user.click(addColorButtons[2]) // Select third color
      await user.click(screen.getByRole('button', { name: '' }))

      // Open the color picker for the member
      const memberColorButton = screen.getByRole('button', { name: /change color for john/i })
      await user.click(memberColorButton)

      // The current color should have ring styling (selected state)
      const popoverContent = screen.getByText('Choose color').parentElement!
      const colorOptions = within(popoverContent).getAllByRole('button')
      const selectedColorOption = colorOptions[2]

      expect(selectedColorOption.className).toContain('ring-2')
    })

    it('allows changing color for multiple members independently', async () => {
      const user = userEvent.setup()
      renderWithProvider()

      // Open the dialog
      await user.click(screen.getByRole('button', { name: /household/i }))

      // Add first member
      const input = screen.getByPlaceholderText(/enter name/i)
      await user.type(input, 'John')
      await user.keyboard('{Enter}')

      // Add second member
      await user.clear(input)
      await user.type(input, 'Jane')
      await user.keyboard('{Enter}')

      // Change John's color
      const johnColorButton = screen.getByRole('button', { name: /change color for john/i })
      await user.click(johnColorButton)

      let popoverContent = screen.getByText('Choose color').parentElement!
      let colorOptions = within(popoverContent).getAllByRole('button')
      await user.click(colorOptions[3]) // Select 4th color

      // Change Jane's color
      const janeColorButton = screen.getByRole('button', { name: /change color for jane/i })
      await user.click(janeColorButton)

      popoverContent = screen.getByText('Choose color').parentElement!
      colorOptions = within(popoverContent).getAllByRole('button')
      await user.click(colorOptions[5]) // Select 6th color

      // Verify both colors are different
      const updatedJohnButton = screen.getByRole('button', { name: /change color for john/i })
      const updatedJaneButton = screen.getByRole('button', { name: /change color for jane/i })

      expect(updatedJohnButton.style.backgroundColor).not.toBe(updatedJaneButton.style.backgroundColor)
    })
  })
})
