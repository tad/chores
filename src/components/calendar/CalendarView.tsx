import { useState } from 'react'
import {
  addDays,
  addWeeks,
  addMonths,
  format,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import { ChoreForm } from '@/components/chores/ChoreForm'
import type { CalendarView as CalendarViewType, Chore } from '@/types'
import { cn } from '@/lib/utils'

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarViewType>('month')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [editingChore, setEditingChore] = useState<Chore | undefined>()

  const navigate = (direction: 'prev' | 'next') => {
    const modifier = direction === 'prev' ? -1 : 1
    if (view === 'day') {
      setCurrentDate(prev => addDays(prev, modifier))
    } else if (view === 'week') {
      setCurrentDate(prev => addWeeks(prev, modifier))
    } else {
      setCurrentDate(prev => addMonths(prev, modifier))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setEditingChore(undefined)
    setFormOpen(true)
  }

  const handleChoreClick = (chore: Chore) => {
    setEditingChore(chore)
    setSelectedDate(undefined)
    setFormOpen(true)
  }

  const getTitle = () => {
    if (view === 'day') {
      return format(currentDate, 'MMMM d, yyyy')
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'MMMM yyyy')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold ml-2">{getTitle()}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border">
            {(['day', 'week', 'month'] as CalendarViewType[]).map(v => (
              <Button
                key={v}
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-none first:rounded-l-md last:rounded-r-md',
                  view === v && 'bg-accent'
                )}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>

          <Button onClick={() => {
            setSelectedDate(new Date())
            setEditingChore(undefined)
            setFormOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Chore
          </Button>
        </div>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-hidden">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            onDateClick={handleDateClick}
            onChoreClick={handleChoreClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            onDateClick={handleDateClick}
            onChoreClick={handleChoreClick}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            onDateClick={handleDateClick}
            onChoreClick={handleChoreClick}
          />
        )}
      </div>

      {/* Chore form dialog */}
      <ChoreForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editChore={editingChore}
        initialDate={selectedDate}
      />
    </div>
  )
}
