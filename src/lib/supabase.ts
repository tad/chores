import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create a mock client for when Supabase is not configured
function createMockClient(): SupabaseClient<Database> {
  const mockResponse = { data: null, error: { message: 'Supabase not configured' } }
  const mockArrayResponse = { data: [], error: null }

  const mockQueryBuilder = () => ({
    select: () => mockQueryBuilder(),
    insert: () => mockQueryBuilder(),
    update: () => mockQueryBuilder(),
    delete: () => mockQueryBuilder(),
    eq: () => mockQueryBuilder(),
    in: () => Promise.resolve(mockArrayResponse),
    single: () => Promise.resolve(mockResponse),
    then: (resolve: (value: unknown) => void) => resolve(mockArrayResponse),
  })

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured', name: 'AuthError', status: 500 } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Please set up your .env file.', name: 'AuthError', status: 500 } }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
    },
    from: () => mockQueryBuilder(),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
    removeChannel: () => {},
  } as unknown as SupabaseClient<Database>
}

export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createMockClient()

// Log a warning if Supabase is not configured
if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase is not configured. The app will run in local-only mode.\n' +
    'To enable authentication and cloud sync:\n' +
    '1. Create a Supabase project at https://supabase.com\n' +
    '2. Copy .env.example to .env\n' +
    '3. Fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  )
}
