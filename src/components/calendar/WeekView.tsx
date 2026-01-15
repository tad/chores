import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
} from 'date-fns'
import { useChores } from '@/contexts/ChoreContext'
import { ChoreCard } from '@/components/chores/ChoreCard'
import type { Chore, ChoreInstance } from '@/types'
import { cn } from '@/lib/utils'

interface WeekViewProps {
  currentDate: Date
  onDateClick: (date: Date) => void
  onChoreClick: (chore: Chore) => void
}

export function WeekView({ currentDate, onDateClick, onChoreClick }: WeekViewProps) {
  const { getChoresForRange } = useChores()

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const chores = getChoresForRange(weekStart, weekEnd)

  const getChoresForDay = (date: Date): ChoreInstance[] => {
    return chores.filter(instance => isSameDay(instance.date, date))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {days.map(day => (
          <div
            key={day.toISOString()}
            className={cn(
              'p-3 text-center border-r',
              isToday(day) && 'bg-primary/5'
            )}
          >
            <div className="text-sm text-muted-foreground">
              {format(day, 'EEE')}
            </div>
            <div
              className={cn(
                'text-2xl font-semibold w-10 h-10 mx-auto flex items-center justify-center rounded-full',
                isToday(day) && 'bg-primary text-primary-foreground'
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 flex-1">
        {days.map(day => {
          const dayChores = getChoresForDay(day)

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              className={cn(
                'border-r p-2 cursor-pointer min-h-[400px] overflow-y-auto',
                'hover:bg-accent/30 transition-colors',
                isToday(day) && 'bg-primary/5'
              )}
            >
              <div className="space-y-2">
                {dayChores.map((instance, idx) => (
                  <ChoreCard
                    key={`${instance.chore.id}-${idx}`}
                    instance={instance}
                    onClick={() => onChoreClick(instance.chore)}
                  />
                ))}
                {dayChores.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-4">
                    No chores
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
