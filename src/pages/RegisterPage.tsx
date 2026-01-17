import { Navigate } from 'react-router-dom'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useAuth } from '@/contexts/AuthContext'

export function RegisterPage() {
  const { user, loading } = useAuth()

  // If already authenticated, redirect to home
  if (user && !loading) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Get started with Home Chores
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
