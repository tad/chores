import { format, isToday } from 'date-fns'
import { useChores } from '@/contexts/ChoreContext'
import { ChoreCard } from '@/components/chores/ChoreCard'
import type { Chore } from '@/types'
import { cn } from '@/lib/utils'

interface DayViewProps {
  currentDate: Date
  onDateClick: (date: Date) => void
  onChoreClick: (chore: Chore) => void
}

export function DayView({ currentDate, onDateClick, onChoreClick }: DayViewProps) {
  const { getChoresForDay } = useChores()
  const dayChores = getChoresForDay(currentDate)

  const today = isToday(currentDate)

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div
        className={cn(
          'p-4 border-b text-center',
          today && 'bg-primary/5'
        )}
      >
        <div className="text-sm text-muted-foreground">
          {format(currentDate, 'EEEE')}
        </div>
        <div
          className={cn(
            'text-4xl font-bold mt-1 w-16 h-16 mx-auto flex items-center justify-center rounded-full',
            today && 'bg-primary text-primary-foreground'
          )}
        >
          {format(currentDate, 'd')}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {format(currentDate, 'MMMM yyyy')}
        </div>
      </div>

      {/* Chores list */}
      <div
        onClick={() => onDateClick(currentDate)}
        className="flex-1 p-4 overflow-y-auto cursor-pointer"
      >
        {dayChores.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No chores scheduled for this day.</p>
            <p className="text-sm mt-2">Click to add a chore.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {dayChores.map((instance, idx) => (
              <ChoreCard
                key={`${instance.chore.id}-${idx}`}
                instance={instance}
                onEdit={() => onChoreClick(instance.chore)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
