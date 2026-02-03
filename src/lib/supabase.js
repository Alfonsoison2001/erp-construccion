import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper: subscribe to auth state changes and call callback when session is ready
// Returns cleanup function. Use in useEffect to re-fetch data when auth becomes available.
export function onAuthReady(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
      callback()
    }
  })
  return () => subscription.unsubscribe()
}
