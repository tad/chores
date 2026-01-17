import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useAuth } from '@/contexts/AuthContext'
import type { HouseholdMember } from '@/types'
import { supabase } from '@/lib/supabase'

interface JoinHouseholdFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

type JoinStep = 'enter-code' | 'select-member'

export function JoinHouseholdForm({ onSuccess, onCancel }: JoinHouseholdFormProps) {
  const { user } = useAuth()
  const { joinHousehold, getUnclaimedMembers } = useHousehold()
  const [step, setStep] = useState<JoinStep>('enter-code')
  const [inviteCode, setInviteCode] = useState('')
  const [unclaimedMembers, setUnclaimedMembers] = useState<HouseholdMember[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleValidateInviteCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!inviteCode.trim()) {
      setError('Invite code is required')
      return
    }

    setLoading(true)

    // Validate invite code and get household
    const { data: household, error: findError } = await supabase
      .from('households')
      .select()
      .eq('invite_code', inviteCode.toLowerCase().trim())
      .single()

    if (findError || !household) {
      setError('Invalid invite code')
      setLoading(false)
      return
    }

    // Get unclaimed members
    const members = await getUnclaimedMembers(household.id)

    setUnclaimedMembers(members)
    setStep('select-member')
    setLoading(false)
  }

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // If joining as new member, require display name
    if (!selectedMemberId && !displayName.trim()) {
      setError('Your display name is required')
      return
    }

    setLoading(true)

    const { error: joinError } = await joinHousehold(
      inviteCode.trim(),
      displayName.trim(),
      selectedMemberId || undefined
    )

    if (joinError) {
      setError(joinError.message)
      setLoading(false)
    } else {
      setLoading(false)
      onSuccess?.()
    }
  }

  if (step === 'enter-code') {
    return (
      <form onSubmit={handleValidateInviteCode} className="space-y-4">
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

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Validating...' : 'Next'}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleJoin} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Label>Join Options</Label>

        {unclaimedMembers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Claim an existing household member:
            </p>
            <div className="space-y-2">
              {unclaimedMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-accent"
                >
                  <input
                    type="radio"
                    name="member-option"
                    value={member.id}
                    checked={selectedMemberId === member.id}
                    onChange={() => {
                      setSelectedMemberId(member.id)
                      setDisplayName('')
                    }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: member.color }}
                  />
                  <span>{member.name}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 border-t" />
            </div>
          </div>
        )}

        <label className="flex items-start gap-2 p-2 border rounded-md cursor-pointer hover:bg-accent">
          <input
            type="radio"
            name="member-option"
            value="new"
            checked={selectedMemberId === null}
            onChange={() => setSelectedMemberId(null)}
          />
          <div className="flex-1 space-y-2">
            <span className="text-sm">Join as new member</span>
            <Input
              type="text"
              placeholder="Enter your name (e.g., Dad, Mom, John)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={selectedMemberId !== null}
              required={selectedMemberId === null}
            />
          </div>
        </label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setStep('enter-code')
            setSelectedMemberId(null)
            setError(null)
          }}
        >
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Joining...' : 'Join Household'}
        </Button>
      </div>
    </form>
  )
}
