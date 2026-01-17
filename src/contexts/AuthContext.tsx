import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js'
import type { User, Profile } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

function mapSupabaseUser(supabaseUser: SupabaseUser | null, profile?: Profile | null): User | null {
  if (!supabaseUser) return null
  return {
    id: supabaseUser.id,
    email: supabaseUser.email!,
    displayName: profile?.display_name || supabaseUser.user_metadata?.display_name,
    avatarUrl: profile?.avatar_url || undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch or create user profile with timeout
  const fetchOrCreateProfile = useCallback(async (supabaseUser: SupabaseUser, signal?: AbortSignal): Promise<Profile | null> => {
    // Add a timeout to prevent hanging forever
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('Profile fetch timed out')
        resolve(null)
      }, 5000)
    })

    const fetchPromise = async (): Promise<Profile | null> => {
      try {
        // Check if aborted before starting
        if (signal?.aborted) return null

        // Try to fetch existing profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single()

        // Check if aborted after fetch
        if (signal?.aborted) return null

        if (data) {
          return data
        }

        // If profile doesn't exist, create it
        if (error?.code === 'PGRST116') { // Row not found
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUser.id,
              display_name: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0],
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error creating profile:', insertError)
            return null
          }

          return newProfile
        }

        // Log error but don't block auth - profile is optional
        if (error) {
          console.error('Error fetching profile:', error)
        }
        return null
      } catch (err) {
        // Ignore AbortError - it's expected when component unmounts
        if (err instanceof Error && err.name === 'AbortError') {
          return null
        }
        console.error('Profile fetch error:', err)
        return null
      }
    }

    return Promise.race([fetchPromise(), timeoutPromise])
  }, [])

  // Initialize auth state
  useEffect(() => {
    const abortController = new AbortController()
    let isInitialized = false

    async function handleSession(newSession: Session | null) {
      if (abortController.signal.aborted) return

      setSession(newSession)

      if (newSession?.user) {
        const profile = await fetchOrCreateProfile(newSession.user, abortController.signal)
        if (!abortController.signal.aborted) {
          setUser(mapSupabaseUser(newSession.user, profile))
        }
      } else {
        setUser(null)
      }

      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }

    async function initAuth() {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession()

        if (!abortController.signal.aborted && !isInitialized) {
          isInitialized = true
          await handleSession(initialSession)
        }
      } catch (err) {
        // Ignore AbortError
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('Auth init error:', err)
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Skip the initial event if we haven't initialized yet
        if (!isInitialized && event === 'INITIAL_SESSION') {
          return
        }

        if (!abortController.signal.aborted) {
          await handleSession(newSession)
        }
      }
    )

    initAuth()

    return () => {
      abortController.abort()
      subscription.unsubscribe()
    }
  }, [fetchOrCreateProfile])

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })
      return { error }
    },
    []
  )

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }, [])

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) {
        return { error: new Error('Not authenticated') }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (!error) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                displayName: updates.display_name || prev.displayName,
                avatarUrl: updates.avatar_url || prev.avatarUrl,
              }
            : null
        )
      }

      return { error: error ? new Error(error.message) : null }
    },
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
    }),
    [user, session, loading, signUp, signIn, signOut, resetPassword, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
