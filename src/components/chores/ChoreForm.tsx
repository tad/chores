import { useState, useEffect } from 'react'
import { useChores } from '@/contexts/ChoreContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RecurrenceSelect } from './RecurrenceSelect'
import { createRRule } from '@/lib/recurrence'
import type { Chore, Priority, RecurrenceConfig } from '@/types'
import { format, parse } from 'date-fns'

interface ChoreFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editChore?: Chore
  initialDate?: Date
}

export function ChoreForm({ open, onOpenChange, editChore, initialDate }: ChoreFormProps) {
  const { addChore, updateChore, deleteChore } = useChores()
  const { members } = useHousehold()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(null)

  // Reset form when dialog opens or editChore changes
  useEffect(() => {
    if (open) {
      if (editChore) {
        setTitle(editChore.title)
        setDescription(editChore.description || '')
        setPriority(editChore.priority)
        setAssigneeId(editChore.assigneeId || '')
        setDueDate(editChore.dueDate.split('T')[0])
        setRecurrence(null) // TODO: parse existing recurrence
      } else {
        setTitle('')
        setDescription('')
        setPriority('medium')
        setAssigneeId('')
        setDueDate(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
        setRecurrence(null)
      }
    }
  }, [open, editChore, initialDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const choreData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigneeId: assigneeId || null,
      dueDate: parse(dueDate, 'yyyy-MM-dd', new Date()).toISOString(),
      recurrenceRule: recurrence
        ? createRRule(recurrence, parse(dueDate, 'yyyy-MM-dd', new Date()))
        : undefined,
    }

    if (editChore) {
      updateChore(editChore.id, choreData)
    } else {
      addChore(choreData)
    }

    onOpenChange(false)
  }

  const handleDelete = () => {
    if (editChore) {
      deleteChore(editChore.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editChore ? 'Edit Chore' : 'Add Chore'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Additional details..."
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v: Priority) => setPriority(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label>Assign to</Label>
            <Select
              value={assigneeId || "__unassigned__"}
              onValueChange={(v) => setAssigneeId(v === "__unassigned__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {members.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: member.color }}
                      />
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence */}
          {!editChore && (
            <RecurrenceSelect value={recurrence} onChange={setRecurrence} />
          )}

          <DialogFooter className="gap-2">
            {editChore && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button type="submit" disabled={!title.trim()}>
              {editChore ? 'Save' : 'Add Chore'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
