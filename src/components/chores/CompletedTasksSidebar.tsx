import { useState, useMemo } from 'react'
import { useChores } from '@/contexts/ChoreContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import type { CompletedChoreInstance, HouseholdMember } from '@/types'
import { format } from 'date-fns'
import { CheckCircle2, ChevronRight, ChevronDown, X, Filter, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CompletedTasksSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface GroupedChores {
  member: HouseholdMember | null
  instances: CompletedChoreInstance[]
}

export function CompletedTasksSidebar({ isOpen, onClose }: CompletedTasksSidebarProps) {
  const { getCompletedChores } = useChores()
  const { members } = useHousehold()
  const [filterMemberId, setFilterMemberId] = useState<string | 'all'>('all')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['unassigned']))

  // Get completed chore instances and optionally filter by member
  const completedInstances = useMemo(() => {
    const all = getCompletedChores()
    if (filterMemberId === 'all') return all
    return all.filter(instance => instance.chore.assigneeId === filterMemberId)
  }, [getCompletedChores, filterMemberId])

  // Group instances by assignee
  const groupedChores = useMemo((): GroupedChores[] => {
    const groups = new Map<string | null, CompletedChoreInstance[]>()

    completedInstances.forEach(instance => {
      const key = instance.chore.assigneeId
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(instance)
    })

    const result: GroupedChores[] = []

    // Add unassigned group first if it exists
    if (groups.has(null)) {
      result.push({ member: null, instances: groups.get(null)! })
    }

    // Add member groups
    members.forEach(member => {
      if (groups.has(member.id)) {
        result.push({ member, instances: groups.get(member.id)! })
      }
    })

    return result
  }, [completedInstances, members])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  if (!isOpen) return null

  return (
    <div className="w-80 border-l bg-background h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="font-semibold">Completed Tasks</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterMemberId} onValueChange={setFilterMemberId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filter by member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
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
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-2">
        {groupedChores.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No completed tasks yet
          </p>
        ) : (
          groupedChores.map(group => {
            const groupId = group.member?.id ?? 'unassigned'
            const isExpanded = expandedGroups.has(groupId)

            return (
              <div key={groupId} className="mb-2">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(groupId)}
                  className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {group.member ? (
                    <>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.member.color }}
                      />
                      <span className="font-medium">{group.member.name}</span>
                    </>
                  ) : (
                    <span className="font-medium text-muted-foreground">Unassigned</span>
                  )}
                  <span className="text-sm text-muted-foreground ml-auto">
                    ({group.instances.length})
                  </span>
                </button>

                {/* Group Tasks */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {group.instances.map((instance, idx) => (
                      <CompletedChoreItem
                        key={`${instance.chore.id}-${instance.completedDate}-${idx}`}
                        instance={instance}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function CompletedChoreItem({ instance }: { instance: CompletedChoreInstance }) {
  const { chore, completedDate } = instance
  const isRecurring = !!chore.recurrenceRule

  return (
    <div className="p-2 rounded-md border bg-card text-sm">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
        <span className="line-through text-muted-foreground truncate">
          {chore.title}
        </span>
        {isRecurring && (
          <Repeat className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1 ml-5">
        Completed {format(new Date(completedDate), 'MMM d, yyyy')}
      </p>
    </div>
  )
}
