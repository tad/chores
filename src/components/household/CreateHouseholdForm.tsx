import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useAuth } from '@/contexts/AuthContext'

interface CreateHouseholdFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateHouseholdForm({ onSuccess, onCancel }: CreateHouseholdFormProps) {
  const { user } = useAuth()
  const { createHousehold } = useHousehold()
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Household name is required')
      return
    }

    if (!displayName.trim()) {
      setError('Your display name is required')
      return
    }

    setLoading(true)

    const { error: createError } = await createHousehold(name.trim(), displayName.trim())

    if (createError) {
      setError(createError.message)
      setLoading(false)
    } else {
      setLoading(false)
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="householdName">Household Name</Label>
        <Input
          id="householdName"
          type="text"
          placeholder="e.g., Smith Family"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Your Name in This Household</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="e.g., Dad, Mom, John"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Household'}
        </Button>
      </div>
    </form>
  )
}
