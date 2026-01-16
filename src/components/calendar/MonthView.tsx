import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { useChores } from '@/contexts/ChoreContext'
import { ChoreCard } from '@/components/chores/ChoreCard'
import type { Chore, ChoreInstance } from '@/types'
import { cn } from '@/lib/utils'

interface MonthViewProps {
  currentDate: Date
  onDateClick: (date: Date) => void
  onChoreClick: (chore: Chore) => void
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthView({ currentDate, onDateClick, onChoreClick }: MonthViewProps) {
  const { getChoresForRange } = useChores()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const chores = getChoresForRange(calendarStart, calendarEnd)

  const getChoresForDay = (date: Date): ChoreInstance[] => {
    return chores.filter(instance => isSameDay(instance.date, date))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAY_HEADERS.map(day => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map(day => {
          const dayChores = getChoresForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              className={cn(
                'border-b border-r p-1 min-h-[100px] cursor-pointer transition-colors',
                'hover:bg-accent/50',
                !isCurrentMonth && 'bg-muted/30'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    !isCurrentMonth && 'text-muted-foreground',
                    isToday(day) && 'bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1 overflow-hidden">
                {dayChores.slice(0, 3).map((instance, idx) => (
                  <ChoreCard
                    key={`${instance.chore.id}-${idx}`}
                    instance={instance}
                    onEdit={() => onChoreClick(instance.chore)}
                    compact
                  />
                ))}
                {dayChores.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{dayChores.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
