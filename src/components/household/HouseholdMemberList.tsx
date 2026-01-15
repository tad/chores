import { useState } from 'react'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function HouseholdMemberList() {
  const { members, addMember, deleteMember } = useHousehold()
  const [newMemberName, setNewMemberName] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addMember(newMemberName)
      setNewMemberName('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddMember()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Household ({members.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Household Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new member */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter name..."
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleAddMember} disabled={!newMemberName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Member list */}
          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No household members yet. Add someone above!
              </p>
            ) : (
              members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-md border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: member.color }}
                    />
                    <span>{member.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
