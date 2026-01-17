# Home Chores

A household chore management app with multi-user authentication. Keep track of tasks, assign them to family members, and set up recurring schedules—with real-time sync across all your devices.

## Features

- **Multi-User Authentication** — Sign up with email/password, create or join households, and sync chores across all your devices
- **Real-Time Sync** — Changes made by any household member appear instantly on all devices
- **Calendar Views** — View your chores by day, week, or month
- **Optional Time Assignment** — Add specific times to chores (e.g., "2:30 PM") or leave them for anytime during the day. Timed chores are sorted before untimed chores.
- **Recurring Tasks** — Set chores to repeat daily, weekly, monthly, or yearly with flexible scheduling options (e.g., "every 2 weeks on Monday and Thursday" or "the last Friday of each month")
- **Household Members** — Add family members and assign chores to them, each with their own color for easy identification
- **Priority Levels** — Mark chores as low, medium, or high priority
- **Invite System** — Share your household's invite code with family members to let them join

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
- Supabase (Authentication & Database)
- React Router

## Setup

### Prerequisites

- Node.js 18+
- npm
- Supabase project (free tier available at https://supabase.com)

### Supabase Configuration

1. Create a new Supabase project
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql`
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Data Storage

All data is stored in Supabase with row-level security:
- Your data syncs across all your devices
- Real-time updates when household members make changes
- Secure authentication with email/password
- Existing localStorage data can be migrated on first login

## Changelog

### 2.1.0
- **Multi-user authentication** — Sign up with email/password to access your chores from any device
- **Household system** — Create or join households with invite codes
- **Real-time sync** — All changes sync instantly across devices via Supabase
- **Migration wizard** — Migrate existing localStorage data to your new account
- **Toast notifications** — User-friendly success/error messages
- **Loading states** — Visual feedback during data operations

### 1.0.9
- Added confirmation dialog when deleting a chore to prevent accidental deletions

### 1.0.8
- Fixed bug where recurrence settings were hidden when editing existing chores
- Existing recurrence patterns now populate correctly when editing a chore
- Users can now view and modify recurrence settings for existing tasks

### 1.0.7
- Added optional time support for chores with 12-hour format display (e.g., "2:30 PM")
- Timed chores are now sorted before untimed chores on the same day
- Times display in both compact and full calendar views
- Added automatic 12-hour to 24-hour format conversion

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
