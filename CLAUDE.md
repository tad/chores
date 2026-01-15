# Home Chores

A household chore management application with recurring task support and multi-user assignment.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 with TypeScript (strict mode) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 with custom Oklahoma LCH theme |
| UI Components | Radix UI (headless) with custom wrappers |
| Date Handling | date-fns |
| Recurrence | rrule (iCalendar RRULE standard) |
| Persistence | Browser localStorage (no backend) |
| Icons | lucide-react |

## Project Structure

```
src/
├── App.tsx                    # Root component with context providers
├── main.tsx                   # React DOM entry point
├── index.css                  # Tailwind theme and global styles
├── types/index.ts             # All TypeScript interfaces
├── contexts/                  # React Context state management
│   ├── ChoreContext.tsx       # Chore CRUD + recurrence expansion
│   └── HouseholdContext.tsx   # Household member management
├── hooks/
│   └── useLocalStorage.ts     # Generic localStorage sync hook
├── lib/
│   ├── recurrence.ts          # RRULE creation/parsing utilities
│   └── utils.ts               # cn() classname utility
└── components/
    ├── ui/                    # Radix UI wrapped primitives
    ├── calendar/              # CalendarView + Month/Week/Day views
    ├── chores/                # ChoreForm, ChoreCard, RecurrenceSelect
    └── household/             # HouseholdMemberList dialog
```

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + production build
npm run preview    # Preview production build locally
npm run typecheck  # Type checking only (for CI)
```

## Key Files

### Entry Points
- `src/App.tsx:9-15` - Context provider hierarchy
- `src/main.tsx:5-10` - React DOM render

### State Management
- `src/contexts/ChoreContext.tsx` - All chore operations (add/update/delete/complete)
- `src/contexts/HouseholdContext.tsx` - Member management with auto-color assignment
- `src/hooks/useLocalStorage.ts` - Generic localStorage persistence hook

### Type Definitions
- `src/types/index.ts:1-14` - `Chore` interface
- `src/types/index.ts:16-20` - `ChoreInstance` (expanded recurrence)
- `src/types/index.ts:22-31` - `RecurrenceConfig`
- `src/types/index.ts:33-38` - `HouseholdMember`

### Recurrence Logic
- `src/lib/recurrence.ts:21-51` - `createRRule()` - Build RRULE from config
- `src/lib/recurrence.ts:53-65` - `getRecurrenceInstances()` - Expand dates in range
- `src/lib/recurrence.ts:102-159` - `parseRRuleToConfig()` - Parse RRULE to config

### Calendar Views
- `src/components/calendar/CalendarView.tsx` - Container with navigation and view switching
- `src/components/calendar/MonthView.tsx` - Grid layout
- `src/components/calendar/WeekView.tsx` - 7-column layout
- `src/components/calendar/DayView.tsx` - Single day focus

### Forms & Display
- `src/components/chores/ChoreForm.tsx` - Add/edit dialog with recurrence support
- `src/components/chores/ChoreCard.tsx` - Compact and full render modes
- `src/components/chores/RecurrenceSelect.tsx` - RRULE builder UI

## Path Alias

`@/*` maps to `./src/*` - configured in `tsconfig.json:20` and `vite.config.ts:8-10`

## localStorage Keys

| Key | Data |
|-----|------|
| `chores` | Array of Chore objects |
| `household-members` | Array of HouseholdMember objects |

## Core Concepts

### Chore Instances
Recurring chores are stored once but expanded into `ChoreInstance` objects when querying by date range. The `isRecurrenceInstance` flag distinguishes generated instances from the original.

### Member Colors
8 predefined colors (`blue`, `green`, `purple`, `orange`, `pink`, `teal`, `amber`, `rose`) are auto-assigned to new members cyclically.

### Priority System
Three levels: `low` (green), `medium` (yellow), `high` (red) - displayed as left border color on ChoreCards.

## Adding New Features or Fixing Bugs

**IMPORTANT** When you work on a new feature or bug, create a git branch first.
Then work on changes in that branch for the remainder of the session.

## Before Pushing to GitHub

Before every push to GitHub:
1. Update `README.md` with a short summary of what changed
2. Increment the version number in `package.json`

---

## Additional Documentation

When working on specific areas, check these files for detailed patterns:

| File | Topic |
|------|-------|
| `.claude/docs/architectural_patterns.md` | Context pattern, UI component structure, calendar architecture, recurrence system, form patterns, type system |
