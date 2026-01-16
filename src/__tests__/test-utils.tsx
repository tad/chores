import { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ChoreProvider } from '@/contexts/ChoreContext'
import { HouseholdProvider } from '@/contexts/HouseholdContext'

interface WrapperProps {
  children: ReactNode
}

function AllProviders({ children }: WrapperProps) {
  return (
    <HouseholdProvider>
      <ChoreProvider>
        {children}
      </ChoreProvider>
    </HouseholdProvider>
  )
}

function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
