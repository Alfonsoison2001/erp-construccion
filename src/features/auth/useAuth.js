import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

const DEMO_USERS = {
  admin: {
    user: { id: 'demo-user', email: 'admin@demo.com' },
    profile: { id: 'demo-user', full_name: 'Admin Demo', role: 'admin' }
  },
  residente: {
    user: { id: 'demo-residente', email: 'residente@test.com' },
    profile: { id: 'demo-residente', full_name: 'Residente Demo', role: 'residente' }
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    if (DEMO_MODE) return DEMO_USERS.admin.profile
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    let subscription
    try {
      const result = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      })
      subscription = result.data.subscription
    } catch {
      setLoading(false)
    }

    return () => subscription?.unsubscribe()
  }, [fetchProfile])

  const signIn = async (email, password) => {
    if (DEMO_MODE) {
      const demoKey = email === 'residente@test.com' ? 'residente' : 'admin'
      setUser(DEMO_USERS[demoKey].user)
      setProfile(DEMO_USERS[demoKey].profile)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (DEMO_MODE) {
      setUser(null)
      setProfile(null)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  const isAdmin = profile?.role === 'admin'

  return { user, profile, loading, signIn, signOut, isAdmin }
}
