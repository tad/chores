import { describe, it } from 'vitest'

// ChoreForm is used inside a Dialog, so rendering tests require
// the dialog to be open. For now, these tests are skipped pending
// proper dialog testing setup.
describe('ChoreForm', () => {
  describe.skip('Component rendering tests', () => {
    it('TODO: renders form with title input when dialog is open', () => {})
    it('TODO: renders form fields when dialog is open', () => {})
  })

  describe.skip('Supabase integration tests', () => {
    it('TODO: submits form and creates chore', () => {})
    it('TODO: updates existing chore when editing', () => {})
  })
})
