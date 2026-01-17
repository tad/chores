import { useState } from 'react'
import { useHousehold, MEMBER_COLORS } from '@/contexts/HouseholdContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function HouseholdMemberList() {
  const { members, addMember, updateMember, deleteMember } = useHousehold()
  const [newMemberName, setNewMemberName] = useState('')
  const [selectedColor, setSelectedColor] = useState(MEMBER_COLORS[0])
  const [isOpen, setIsOpen] = useState(false)

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addMember(newMemberName, selectedColor)
      setNewMemberName('')
      setSelectedColor(MEMBER_COLORS[0])
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
          <DialogDescription>
            Add and manage household members who can be assigned to chores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new member */}
          <div className="space-y-3">
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Color:</span>
              <div className="flex gap-1">
                {MEMBER_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full transition-all ${
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-primary'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select ${color} color`}
                  />
                ))}
              </div>
            </div>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-5 h-5 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary transition-all"
                          style={{ backgroundColor: member.color }}
                          aria-label={`Change color for ${member.name}`}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Choose color</p>
                          <div className="flex gap-1.5">
                            {MEMBER_COLORS.map(color => (
                              <button
                                key={color}
                                type="button"
                                className={`w-6 h-6 rounded-full transition-all ${
                                  member.color === color
                                    ? 'ring-2 ring-offset-2 ring-primary'
                                    : 'hover:scale-110'
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => updateMember(member.id, { color })}
                                aria-label={`Select ${color} color`}
                              />
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="flex items-center gap-2">
                      <span>{member.name}</span>
                      {!member.userId && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          not linked
                        </span>
                      )}
                    </div>
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
