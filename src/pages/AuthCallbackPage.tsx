import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the OAuth/email confirmation callback
    const handleCallback = async () => {
      try {
        // Get the session - this will parse tokens from URL if present
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/login', { replace: true })
          return
        }

        if (session) {
          // Successfully authenticated, go to home
          navigate('/', { replace: true })
        } else {
          // No session, go to login
          navigate('/login', { replace: true })
        }
      } catch (err) {
        console.error('Auth callback exception:', err)
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Confirming your account...</p>
      </div>
    </div>
  )
}
