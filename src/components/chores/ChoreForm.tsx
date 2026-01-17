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
  const [dueTime, setDueTime] = useState<string>('')
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | null>(null)

  // Convert 12-hour time format to 24-hour format
  const convertTo24Hour = (timeStr: string): string => {
    const time12hrPattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    const match = timeStr.trim().match(time12hrPattern)

    if (match) {
      let hours = parseInt(match[1], 10)
      const minutes = match[2]
      const period = match[3].toUpperCase()

      if (period === 'PM' && hours !== 12) {
        hours += 12
      } else if (period === 'AM' && hours === 12) {
        hours = 0
      }

      return `${hours.toString().padStart(2, '0')}:${minutes}`
    }

    return timeStr
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log('handleTimeChange called with:', value)
    // Auto-convert 12-hour format to 24-hour format
    const converted = convertTo24Hour(value)
    console.log('Converted to:', converted)
    setDueTime(converted)
  }

  // Reset form when dialog opens or editChore changes
  useEffect(() => {
    console.log('Form reset effect triggered, open:', open)
    if (open) {
      if (editChore) {
        console.log('Editing chore:', editChore)
        setTitle(editChore.title)
        setDescription(editChore.description || '')
        setPriority(editChore.priority)
        setAssigneeId(editChore.assigneeId || '')
        setDueDate(editChore.dueDate.split('T')[0])
        setDueTime(editChore.dueTime || '')
        console.log('Set dueTime to:', editChore.dueTime || '(empty)')
        setRecurrence(null) // TODO: parse existing recurrence
      } else {
        console.log('Creating new chore')
        setTitle('')
        setDescription('')
        setPriority('medium')
        setAssigneeId('')
        setDueDate(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
        setDueTime('')
        console.log('Set dueTime to empty string')
        setRecurrence(null)
      }
    }
  }, [open, editChore, initialDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate and sanitize time input
    let sanitizedTime: string | undefined = undefined
    if (dueTime) {
      // Remove any whitespace and ensure it's in HH:mm format
      const trimmedTime = dueTime.trim()
      // Check if it matches HH:mm format (24-hour)
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(trimmedTime)) {
        sanitizedTime = trimmedTime
      } else {
        console.error('Invalid time format:', dueTime)
        alert('Please enter a valid time in HH:mm format (e.g., 14:30 for 2:30 PM)')
        return
      }
    }

    const choreData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigneeId: assigneeId || null,
      dueDate: parse(dueDate, 'yyyy-MM-dd', new Date()).toISOString(),
      dueTime: sanitizedTime,
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

          {/* Due Time */}
          <div className="space-y-2">
            <Label htmlFor="dueTime">Time (optional)</Label>
            <Input
              id="dueTime"
              type="time"
              value={dueTime}
              onChange={handleTimeChange}
              onBlur={e => {
                // Convert on blur in case user typed 12-hour format
                const converted = convertTo24Hour(e.target.value)
                if (converted !== e.target.value) {
                  setDueTime(converted)
                }
              }}
              onFocus={() => {
                // Debug: log current value when focused
                console.log('Time input focused, current value:', dueTime)
              }}
              autoComplete="off"
              step="60"
            />
            {!dueTime && (
              <p className="text-xs text-muted-foreground">
                Leave blank for anytime during the day
              </p>
            )}
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
