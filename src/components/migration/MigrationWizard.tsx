import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import type { Chore, HouseholdMember } from '@/types'

interface LocalStorageData {
  chores: Chore[]
  members: HouseholdMember[]
}

function getLocalStorageData(): LocalStorageData | null {
  try {
    const choresStr = localStorage.getItem('chores')
    const membersStr = localStorage.getItem('household-members')

    const chores = choresStr ? JSON.parse(choresStr) : []
    const members = membersStr ? JSON.parse(membersStr) : []

    if (chores.length === 0 && members.length === 0) {
      return null
    }

    return { chores, members }
  } catch {
    return null
  }
}

function clearLocalStorageData() {
  localStorage.removeItem('chores')
  localStorage.removeItem('household-members')
}

interface MigrationWizardProps {
  open: boolean
  onClose: () => void
}

export function MigrationWizard({ open, onClose }: MigrationWizardProps) {
  const { user } = useAuth()
  const { currentHousehold, refreshHousehold } = useHousehold()
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const localData = getLocalStorageData()

  const handleMigrate = async () => {
    if (!user || !currentHousehold || !localData) return

    setMigrating(true)
    setError(null)

    try {
      // Migrate chores
      for (const chore of localData.chores) {
        const { error: choreError } = await supabase.from('chores').insert({
          household_id: currentHousehold.id,
          title: chore.title,
          description: chore.description || null,
          priority: chore.priority,
          assignee_id: null, // Can't map old assignees to new memberships
          due_date: chore.dueDate,
          due_time: chore.dueTime || null,
          recurrence_rule: chore.recurrenceRule || null,
          completed: chore.completed,
          completed_date: chore.completedDate || null,
          created_by: user.id,
        })

        if (choreError) {
          console.error('Error migrating chore:', choreError)
        }
      }

      // Clear old data
      clearLocalStorageData()

      // Refresh to load new data
      await refreshHousehold()

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed')
    } finally {
      setMigrating(false)
    }
  }

  const handleSkip = () => {
    clearLocalStorageData()
    onClose()
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Migration Complete</DialogTitle>
            <DialogDescription>
              Your data has been migrated successfully. Your chores are now synced across all your devices.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Migrate Existing Data</DialogTitle>
          <DialogDescription>
            We found existing chores data stored locally on this device.
            Would you like to migrate it to your new account?
          </DialogDescription>
        </DialogHeader>

        {localData && (
          <div className="bg-muted p-4 rounded-md text-sm">
            <p>Found:</p>
            <ul className="list-disc list-inside mt-1">
              <li>{localData.chores.length} chore(s)</li>
              <li>{localData.members.length} household member(s)</li>
            </ul>
            <p className="mt-2 text-muted-foreground text-xs">
              Note: Household members will need to create their own accounts and join your household.
              Chore assignments will be cleared during migration.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleSkip} disabled={migrating}>
            Skip & Clear
          </Button>
          <Button onClick={handleMigrate} disabled={migrating || !currentHousehold}>
            {migrating ? 'Migrating...' : 'Migrate Data'}
          </Button>
        </div>

        {!currentHousehold && (
          <p className="text-sm text-muted-foreground">
            Please create or join a household first before migrating data.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function useMigrationCheck() {
  const [showMigration, setShowMigration] = useState(false)

  const checkForMigration = () => {
    const data = getLocalStorageData()
    if (data) {
      setShowMigration(true)
    }
  }

  return {
    showMigration,
    setShowMigration,
    checkForMigration,
  }
}
