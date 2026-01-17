import { useState, useEffect } from 'react'
import { useChores } from '@/contexts/ChoreContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { createRRule, parseRRuleToConfig } from '@/lib/recurrence'
import type { Chore, Priority, RecurrenceConfig } from '@/types'
import { format } from 'date-fns'

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  // Normalize time to HH:mm format (handles HH:mm:ss from some browsers)
  const normalizeTime = (timeStr: string): string => {
    const trimmed = timeStr.trim()
    // Handle HH:mm:ss format - strip seconds
    const timeWithSeconds = /^(\d{1,2}:\d{2}):\d{2}$/.exec(trimmed)
    if (timeWithSeconds) {
      return timeWithSeconds[1]
    }
    return trimmed
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Normalize and convert time format
    const normalized = normalizeTime(value)
    const converted = convertTo24Hour(normalized)
    setDueTime(converted)
  }

  // Extract date part from either YYYY-MM-DD or ISO format
  const extractDatePart = (dateStr: string): string => {
    // Handle ISO format with T separator
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    // Already YYYY-MM-DD format
    return dateStr
  }

  // Reset form when dialog opens or editChore changes
  useEffect(() => {
    if (open) {
      if (editChore) {
        setTitle(editChore.title)
        setDescription(editChore.description || '')
        setPriority(editChore.priority)
        setAssigneeId(editChore.assigneeId || '')
        setDueDate(extractDatePart(editChore.dueDate))
        setDueTime(editChore.dueTime || '')
        setRecurrence(editChore.recurrenceRule ? parseRRuleToConfig(editChore.recurrenceRule) : null)
      } else {
        setTitle('')
        setDescription('')
        setPriority('medium')
        setAssigneeId('')
        setDueDate(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
        setDueTime('')
        setRecurrence(null)
      }
    }
  }, [open, editChore, initialDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate and sanitize time input
    let sanitizedTime: string | undefined = undefined
    if (dueTime) {
      // Normalize and validate time
      const normalized = normalizeTime(dueTime)
      // Check if it matches HH:mm format (24-hour)
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(normalized)) {
        // Ensure 2-digit hour format for consistency
        const [hours, minutes] = normalized.split(':')
        sanitizedTime = `${hours.padStart(2, '0')}:${minutes}`
      } else {
        alert('Please enter a valid time in HH:mm format (e.g., 14:30 for 2:30 PM)')
        return
      }
    }

    // Create a Date at local midnight for the selected date
    // This avoids timezone issues when storing/comparing dates
    const [year, month, day] = dueDate.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)

    const choreData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate, // Store as YYYY-MM-DD string to avoid timezone issues
      dueTime: sanitizedTime,
      recurrenceRule: recurrence
        ? createRRule(recurrence, localDate)
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
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (editChore) {
      deleteChore(editChore.id)
      setShowDeleteConfirm(false)
      onOpenChange(false)
    }
  }

  return (
    <>
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
                // Normalize and convert on blur
                const normalized = normalizeTime(e.target.value)
                const converted = convertTo24Hour(normalized)
                if (converted !== dueTime) {
                  setDueTime(converted)
                }
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
          <RecurrenceSelect value={recurrence} onChange={setRecurrence} />

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

    <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Chore</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{editChore?.title}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
