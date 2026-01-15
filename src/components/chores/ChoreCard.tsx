import { useHousehold } from '@/contexts/HouseholdContext'
import { useChores } from '@/contexts/ChoreContext'
import type { ChoreInstance } from '@/types'
import { Check, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChoreCardProps {
  instance: ChoreInstance
  onClick: () => void
  compact?: boolean
}

const PRIORITY_COLORS = {
  low: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-red-500',
}

export function ChoreCard({ instance, onClick, compact = false }: ChoreCardProps) {
  const { getMemberById } = useHousehold()
  const { completeChore } = useChores()
  const { chore, date, isRecurrenceInstance } = instance

  const assignee = chore.assigneeId ? getMemberById(chore.assigneeId) : null

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    completeChore(chore.id, date)
  }

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'text-xs p-1 rounded cursor-pointer truncate border-l-2',
          PRIORITY_COLORS[chore.priority],
          'hover:bg-accent'
        )}
        style={{
          backgroundColor: assignee
            ? `${assignee.color}20`
            : undefined,
        }}
      >
        <span className="truncate">{chore.title}</span>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-2 rounded-md border border-l-4 cursor-pointer',
        PRIORITY_COLORS[chore.priority],
        'hover:bg-accent transition-colors'
      )}
      style={{
        backgroundColor: assignee
          ? `${assignee.color}10`
          : undefined,
      }}
    >
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
        <button
          onClick={handleComplete}
          className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
          title="Mark complete"
        >
          <Check className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
