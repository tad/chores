import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useAuth } from '@/contexts/AuthContext'

interface JoinHouseholdFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function JoinHouseholdForm({ onSuccess, onCancel }: JoinHouseholdFormProps) {
  const { user } = useAuth()
  const { joinHousehold } = useHousehold()
  const [inviteCode, setInviteCode] = useState('')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!inviteCode.trim()) {
      setError('Invite code is required')
      return
    }

    if (!displayName.trim()) {
      setError('Your display name is required')
      return
    }

    setLoading(true)

    const { error: joinError } = await joinHousehold(inviteCode.trim(), displayName.trim())

    if (joinError) {
      setError(joinError.message)
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
        <Label htmlFor="inviteCode">Invite Code</Label>
        <Input
          id="inviteCode"
          type="text"
          placeholder="Enter the invite code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Ask a household member for their invite code
        </p>
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
          {loading ? 'Joining...' : 'Join Household'}
        </Button>
      </div>
    </form>
  )
}
