# Home Chores

A simple, browser-based household chore management app. Keep track of tasks, assign them to family members, and set up recurring schedules—all without needing an account or server.

## Features

- **Calendar Views** — View your chores by day, week, or month
- **Optional Time Assignment** — Add specific times to chores (e.g., "2:30 PM") or leave them for anytime during the day. Timed chores are sorted before untimed chores.
- **Recurring Tasks** — Set chores to repeat daily, weekly, monthly, or yearly with flexible scheduling options (e.g., "every 2 weeks on Monday and Thursday" or "the last Friday of each month")
- **Household Members** — Add family members and assign chores to them, each with their own color for easy identification
- **Priority Levels** — Mark chores as low, medium, or high priority
- **No Account Required** — All data is stored locally in your browser

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/tad/chores.git
cd chores

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Usage

1. **Add household members** — Click the "Household" button in the header to add family members
2. **Create a chore** — Click "Add Chore" or click on any day in the calendar
3. **Set up recurrence** — Check "Repeat this chore" to configure a recurring schedule
4. **Assign and prioritize** — Assign the chore to a household member and set its priority

## Tech Stack

- React 19 with TypeScript
- Vite
- Tailwind CSS 4
- Radix UI
- date-fns
- rrule (iCalendar RRULE standard)

## Data Storage

All data is stored in your browser's localStorage. This means:
- Your data stays on your device
- No account or login required
- Data persists between sessions
- Clearing browser data will remove your chores

## Changelog

### 1.0.6
- Fixed recurring task completion bug where marking one instance as complete would hide all future instances
- Added individual instance tracking for recurring chores with completedDates array
- Updated completed tasks sidebar to show individual recurring instances with repeat icon
- Added migration to fix existing incorrectly marked recurring chores

### 1.0.5
- Fixed bug where clicking Edit on a chore would open an empty "Add Chore" dialog instead of the edit dialog with the chore's data

### 1.0.4
- Added click-to-action menu for chores on calendar: click any chore to see Edit and Mark Done options
- Mark Done now deletes the chore (simplified completion flow)

### 1.0.3
- Fixed bug where "Every 2 days" was displayed as "Every 2 dais"
- Fixed weekday index asymmetry in recurrence parsing (roundtrip now preserves original weekday values)
- Added accessible dialog description to Household Members dialog

### 1.0.2
- Added color picker when creating new household members

### 1.0.1
- Added contribution guidelines to CLAUDE.md for pre-push checklist

## License

MIT
