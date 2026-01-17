import { useState } from 'react'
import { Check, ChevronDown, Copy, Plus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useHousehold } from '@/contexts/HouseholdContext'
import { CreateHouseholdForm } from './CreateHouseholdForm'
import { JoinHouseholdForm } from './JoinHouseholdForm'

export function HouseholdSelector() {
  const { currentHousehold, households, setCurrentHousehold, loading } = useHousehold()
  const [open, setOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyInviteCode = async () => {
    if (!currentHousehold) return

    await navigator.clipboard.writeText(currentHousehold.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    )
  }

  // No households - show setup options
  if (!currentHousehold) {
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Get Started
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false)
                  setCreateDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Household
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false)
                  setJoinDialogOpen(true)
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Join Household
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Household</DialogTitle>
            </DialogHeader>
            <CreateHouseholdForm onSuccess={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join a Household</DialogTitle>
            </DialogHeader>
            <JoinHouseholdForm onSuccess={() => setJoinDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">
            {currentHousehold.name}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-2">
            {/* Household list */}
            <div className="space-y-1">
              {households.map((household) => (
                <Button
                  key={household.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentHousehold(household)
                    setOpen(false)
                  }}
                >
                  {household.id === currentHousehold.id && (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {household.id !== currentHousehold.id && (
                    <span className="mr-2 w-4" />
                  )}
                  {household.name}
                </Button>
              ))}
            </div>

            {/* Invite code */}
            <div className="border-t pt-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs text-muted-foreground">
                  Invite code: {currentHousehold.invite_code}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyInviteCode}
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false)
                  setCreateDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Household
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false)
                  setJoinDialogOpen(true)
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Join Another Household
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Household</DialogTitle>
          </DialogHeader>
          <CreateHouseholdForm onSuccess={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a Household</DialogTitle>
          </DialogHeader>
          <JoinHouseholdForm onSuccess={() => setJoinDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
