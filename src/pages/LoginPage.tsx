import { Navigate } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'

export function LoginPage() {
  const { user, loading } = useAuth()

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If already authenticated, redirect to home
  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sign in to your Home Chores account
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md text-sm">
            <p className="font-medium">Supabase not configured</p>
            <p className="mt-1">
              To enable authentication, create a <code className="bg-amber-100 px-1 rounded">.env</code> file
              with your Supabase credentials. See <code className="bg-amber-100 px-1 rounded">.env.example</code> for details.
            </p>
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  )
}
