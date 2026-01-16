import { useState } from 'react'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useChores } from '@/contexts/ChoreContext'
import type { ChoreInstance } from '@/types'
import { Repeat, Pencil, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface ChoreCardProps {
  instance: ChoreInstance
  onEdit: () => void
  compact?: boolean
}

const PRIORITY_COLORS = {
  low: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-red-500',
}

export function ChoreCard({ instance, onEdit, compact = false }: ChoreCardProps) {
  const { getMemberById } = useHousehold()
  const { deleteChore } = useChores()
  const { chore, isRecurrenceInstance } = instance
  const [open, setOpen] = useState(false)

  const assignee = chore.assigneeId ? getMemberById(chore.assigneeId) : null

  const handleEdit = () => {
    setOpen(false)
    onEdit()
  }

  const handleMarkDone = () => {
    setOpen(false)
    deleteChore(chore.id)
  }

  const cardContent = (
    <div
      className={cn(
        compact
          ? 'text-xs p-1 rounded cursor-pointer truncate border-l-2'
          : 'p-2 rounded-md border border-l-4 cursor-pointer',
        PRIORITY_COLORS[chore.priority],
        'hover:bg-accent transition-colors'
      )}
      style={{
        backgroundColor: assignee
          ? `${assignee.color}${compact ? '20' : '10'}`
          : undefined,
      }}
    >
      {compact ? (
        <span className="truncate">{chore.title}</span>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium truncate">{chore.title}</span>
              {isRecurrenceInstance && (
                <Repeat className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {chore.description && (
              <p className="text-sm text-muted-foreground truncate">
                {chore.description}
              </p>
            )}
            {assignee && (
              <div className="flex items-center gap-1 mt-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: assignee.color }}
                />
                <span className="text-xs text-muted-foreground">{assignee.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {cardContent}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleEdit}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleMarkDone}
          >
            <CheckCircle className="h-4 w-4" />
            Mark Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
