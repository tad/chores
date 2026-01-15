# Architectural Patterns

## State Management: React Context + localStorage

The application uses React Context API with automatic localStorage persistence for all state.

### Context Structure
Both `ChoreContext` and `HouseholdContext` follow an identical pattern:
- Provider wraps entire app (`src/App.tsx:9-15`)
- Custom hook exports state and actions
- `useLocalStorage` hook syncs state to browser storage

**Reference implementations:**
- `src/contexts/ChoreContext.tsx:26-181` - Full context with CRUD operations
- `src/contexts/HouseholdContext.tsx:27-100` - Parallel structure for household data

### useLocalStorage Hook
Generic hook with automatic persistence (`src/hooks/useLocalStorage.ts:3-32`):
- Initializes from localStorage on mount
- Auto-syncs via useEffect on every state change
- Supports both direct value and updater function patterns

## UI Component Pattern: Radix + CVA Wrappers

All UI primitives wrap Radix UI components with Tailwind styling.

### Component Structure
Located in `src/components/ui/`:
- Radix provides accessibility and behavior
- CVA (Class Variance Authority) manages type-safe variants
- ForwardRef for ref forwarding
- `asChild` prop via Radix Slot for composition

**Example:** `src/components/ui/button.tsx:6-34` defines variants:
```
variant: default | destructive | outline | secondary | ghost | link
size: default | sm | lg | icon
```

**Other UI components:** dialog.tsx, select.tsx, input.tsx, label.tsx, popover.tsx

## Calendar Architecture: Container + View Pattern

### CalendarView Container
`src/components/calendar/CalendarView.tsx` manages:
- Current date state (line 20)
- View type: 'day' | 'week' | 'month' (line 21)
- Form dialog state for add/edit (lines 22-24)
- Navigation logic (lines 26-35)

### Child View Components
Each view receives props and queries context for chores:
- `MonthView.tsx` - 7x6 grid, compact ChoreCards
- `WeekView.tsx` - 7-column layout with day headers
- `DayView.tsx` - Single day focus with full ChoreCards

### Chore Querying
Context provides range-based query methods:
- `getChoresForDay()` - `src/contexts/ChoreContext.tsx:118-128`
- `getChoresForWeek()` - `src/contexts/ChoreContext.tsx:130-140`
- `getChoresForMonth()` - `src/contexts/ChoreContext.tsx:142-147`

All methods expand recurring chores into `ChoreInstance` objects with `isRecurrenceInstance` flag.

## Recurrence System: RRULE Standard

Uses iCalendar RRULE format for recurring chores (`src/lib/recurrence.ts`).

### Core Functions
| Function | Line | Purpose |
|----------|------|---------|
| `createRRule()` | 21-51 | Config object to RRULE string |
| `getRecurrenceInstances()` | 53-65 | Generate dates in range |
| `describeRecurrence()` | 67-100 | Human-readable description |
| `parseRRuleToConfig()` | 102-159 | RRULE string to config object |

### Supported Patterns
- Daily, weekly, monthly, yearly frequencies
- Custom intervals (e.g., "every 2 weeks")
- Weekday selection (lines 28-37)
- Ordinal patterns: "2nd Tuesday", "last Friday" via `bySetPos`
- End conditions: count or until date

## Form Pattern: Dual-Mode Dialog

`ChoreForm` (`src/components/chores/ChoreForm.tsx`) demonstrates the form pattern:

### Mode Detection
- Edit mode: `editChore` prop exists (line 47-53)
- Create mode: Uses `initialDate` prop or today

### State Management
Individual useState for each field (lines 37-42), synchronized via useEffect (lines 45-63).

### Recurrence Integration
- `RecurrenceSelect` component returns `RecurrenceConfig | null`
- Converted to RRULE string on submit (lines 74-76)
- Recurrence only available on new chores, not edits (line 178)

## ChoreCard: Context-Aware Rendering

`src/components/chores/ChoreCard.tsx` renders differently based on context:

### Compact Mode (lines 31-48)
Used in month/week views - minimal display with colored indicator.

### Full Mode (lines 51-97)
Used in day view - shows title, description, priority badge, assignee, recurrence icon.

### Visual Indicators
- Priority: Left border color (green/yellow/red) - lines 13-17
- Assignee: Background tint using member's color - lines 40-44
- Completion: Checkmark button with event propagation stop - lines 88-94

## Type System

Central type definitions in `src/types/index.ts`:

### Core Types
- `Chore` (lines 1-14) - Base chore entity
- `ChoreInstance` (lines 16-20) - Expanded recurrence instance
- `RecurrenceConfig` (lines 22-31) - Recurrence rule configuration
- `HouseholdMember` (lines 33-38) - Household member entity

### ID Generation
All entities use `Date.now().toString()` for IDs:
- `src/contexts/ChoreContext.tsx:38`
- `src/contexts/HouseholdContext.tsx:45`

## Color System

### Household Member Colors
8 predefined colors auto-assigned cyclically (`src/contexts/HouseholdContext.tsx:16-25`):
```
blue, green, purple, orange, pink, teal, amber, rose
```

### Priority Colors
Defined inline in ChoreCard (`src/components/chores/ChoreCard.tsx:13-17`):
- low: green-500
- medium: yellow-500
- high: red-500

### Theme Colors
Custom Tailwind theme using Oklahoma LCH color space (`src/index.css:3-28`).
