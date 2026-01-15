import { useState, useEffect } from 'react'
import type { RecurrenceConfig, RecurrenceFrequency } from '@/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { describeRecurrence } from '@/lib/recurrence'

interface RecurrenceSelectProps {
  value: RecurrenceConfig | null
  onChange: (config: RecurrenceConfig | null) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function RecurrenceSelect({ value, onChange }: RecurrenceSelectProps) {
  const [isRecurring, setIsRecurring] = useState(value !== null)
  const [config, setConfig] = useState<RecurrenceConfig>(
    value || {
      frequency: 'weekly',
      interval: 1,
    }
  )

  useEffect(() => {
    if (isRecurring) {
      onChange(config)
    } else {
      onChange(null)
    }
  }, [isRecurring, config, onChange])

  const updateConfig = (updates: Partial<RecurrenceConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const toggleWeekday = (day: number) => {
    const currentDays = config.byWeekday || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort()
    updateConfig({ byWeekday: newDays.length > 0 ? newDays : undefined })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is-recurring"
          checked={isRecurring}
          onChange={e => setIsRecurring(e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="is-recurring">Repeat this chore</Label>
      </div>

      {isRecurring && (
        <div className="space-y-4 pl-6 border-l-2 border-muted">
          {/* Frequency */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Every</span>
            <Input
              type="number"
              min={1}
              max={99}
              value={config.interval}
              onChange={e => updateConfig({ interval: parseInt(e.target.value) || 1 })}
              className="w-16"
            />
            <Select
              value={config.frequency}
              onValueChange={(v: RecurrenceFrequency) => updateConfig({ frequency: v })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">day(s)</SelectItem>
                <SelectItem value="weekly">week(s)</SelectItem>
                <SelectItem value="monthly">month(s)</SelectItem>
                <SelectItem value="yearly">year(s)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weekday selector for weekly */}
          {config.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label className="text-sm">On days</Label>
              <div className="flex gap-1">
                {WEEKDAYS.map((day, index) => (
                  <Button
                    key={day}
                    type="button"
                    variant={config.byWeekday?.includes(index) ? 'default' : 'outline'}
                    size="sm"
                    className="w-10 h-8 text-xs"
                    onClick={() => toggleWeekday(index)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly options */}
          {config.frequency === 'monthly' && (
            <div className="space-y-2">
              <Label className="text-sm">On the</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={config.bySetPos !== undefined ? config.bySetPos.toString() : undefined}
                  onValueChange={v => {
                    if (v) {
                      updateConfig({ bySetPos: parseInt(v), byMonthDay: undefined })
                    } else {
                      updateConfig({ bySetPos: undefined })
                    }
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st</SelectItem>
                    <SelectItem value="2">2nd</SelectItem>
                    <SelectItem value="3">3rd</SelectItem>
                    <SelectItem value="4">4th</SelectItem>
                    <SelectItem value="-1">Last</SelectItem>
                  </SelectContent>
                </Select>
                {config.bySetPos && (
                  <Select
                    value={config.byWeekday?.[0] !== undefined ? config.byWeekday[0].toString() : undefined}
                    onValueChange={v => updateConfig({ byWeekday: v ? [parseInt(v)] : undefined })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Weekday" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((day, index) => (
                        <SelectItem key={day} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          <p className="text-sm text-muted-foreground">
            {describeRecurrence(config)}
          </p>
        </div>
      )}
    </div>
  )
}
