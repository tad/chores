import { ChoreProvider } from '@/contexts/ChoreContext'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { CalendarView } from '@/components/calendar/CalendarView'
import { HouseholdMemberList } from '@/components/household/HouseholdMemberList'

function App() {
  return (
    <HouseholdProvider>
      <ChoreProvider>
        <div className="h-screen flex flex-col bg-background">
          {/* Header */}
          <header className="border-b px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">Home Chores</h1>
            <HouseholdMemberList />
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-hidden">
            <CalendarView />
          </main>
        </div>
      </ChoreProvider>
    </HouseholdProvider>
  )
}

export default App
