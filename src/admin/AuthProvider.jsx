import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { AuthContext } from './authContext.js'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [role, setRole] = useState(undefined)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [roleError, setRoleError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const readProfile = useCallback(async () => {
    if (!session) {
      return { role: null, mustChange: false, error: null }
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('role, must_change_password')
      .eq('email', session.user.email)
      .maybeSingle()

    return { role: data?.role ?? null, mustChange: data?.must_change_password ?? false, error }
  }, [session])

  useEffect(() => {
    if (session === undefined) {
      return
    }

    if (session === null) {
      setRole(null)
      setMustChangePassword(false)
      setRoleError(null)
      return
    }

    let active = true

    readProfile().then((profile) => {
      if (active) {
        setRole(profile.role)
        setMustChangePassword(profile.mustChange)
        setRoleError(profile.error)
      }
    })

    return () => {
      active = false
    }
  }, [session, readProfile])

  const value = {
    session,
    role,
    roleError,
    loading: session === undefined || role === undefined,
    canEdit: role === 'superadmin' || role === 'admin',
    isSuperadmin: role === 'superadmin',
    mustChangePassword,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    refreshProfile: async () => {
      const profile = await readProfile()

      setRole(profile.role)
      setMustChangePassword(profile.mustChange)
      setRoleError(profile.error)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
