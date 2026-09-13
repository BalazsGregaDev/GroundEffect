import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { AuthContext } from './authContext.js'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [role, setRole] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) {
      return
    }

    if (session === null) {
      setRole(null)
      return
    }

    let active = true

    supabase.rpc('current_admin_role').then(({ data }) => {
      if (active) {
        setRole(data)
      }
    })

    return () => {
      active = false
    }
  }, [session])

  const value = {
    session,
    role,
    loading: session === undefined || role === undefined,
    canEdit: role === 'superadmin' || role === 'admin',
    isSuperadmin: role === 'superadmin',
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
