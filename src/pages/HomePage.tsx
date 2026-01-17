import { useEffect } from 'react'
import { CalendarView } from '@/components/calendar/CalendarView'
import { HouseholdMemberList } from '@/components/household/HouseholdMemberList'
import { HouseholdSelector } from '@/components/household/HouseholdSelector'
import { UserMenu } from '@/components/auth/UserMenu'
import { MigrationWizard, useMigrationCheck } from '@/components/migration/MigrationWizard'
import { useHousehold } from '@/contexts/HouseholdContext'

export function HomePage() {
  const { currentHousehold, loading } = useHousehold()
  const { showMigration, setShowMigration, checkForMigration } = useMigrationCheck()

  // Check for localStorage data to migrate when component mounts
  useEffect(() => {
    if (!loading) {
      checkForMigration()
    }
  }, [loading, checkForMigration])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Home Chores</h1>
          <HouseholdSelector />
        </div>
        <div className="flex items-center gap-2">
          {currentHousehold && <HouseholdMemberList />}
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : currentHousehold ? (
          <CalendarView />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Welcome to Home Chores</h2>
              <p className="text-muted-foreground">
                Create or join a household to get started
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Migration wizard */}
      <MigrationWizard
        open={showMigration}
        onClose={() => setShowMigration(false)}
      />
    </div>
  )
}
