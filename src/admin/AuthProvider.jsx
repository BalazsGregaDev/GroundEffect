import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { AuthContext } from './authContext.js'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [access, setAccess] = useState(undefined)
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
      return { access: null, mustChange: false, error: null }
    }

    const [accessResult, profileResult] = await Promise.all([
      supabase.rpc('current_admin_access'),
      supabase
        .from('admin_users')
        .select('must_change_password')
        .eq('email', session.user.email)
        .maybeSingle(),
    ])

    return {
      access: accessResult.data?.[0] ?? null,
      mustChange: profileResult.data?.must_change_password ?? false,
      error: accessResult.error ?? profileResult.error,
    }
  }, [session])

  useEffect(() => {
    if (session === undefined) {
      return
    }

    if (session === null) {
      setAccess(null)
      setMustChangePassword(false)
      setRoleError(null)
      return
    }

    let active = true

    readProfile().then((profile) => {
      if (active) {
        setAccess(profile.access)
        setMustChangePassword(profile.mustChange)
        setRoleError(profile.error)
      }
    })

    return () => {
      active = false
    }
  }, [session, readProfile])

  const role = access === undefined ? undefined : (access?.role ?? null)
  const permissions = access?.permissions ?? []
  const readOnly = access?.read_only ?? true

  const value = {
    session,
    role,
    roleName: access?.name ?? null,
    permissions,
    readOnly,
    roleError,
    loading: session === undefined || access === undefined,
    isSuperadmin: role === 'superadmin',
    can: (permission) => permissions.includes(permission),
    canWrite: (permission) => !readOnly && permissions.includes(permission),
    mustChangePassword,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    refreshProfile: async () => {
      const profile = await readProfile()

      setAccess(profile.access)
      setMustChangePassword(profile.mustChange)
      setRoleError(profile.error)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
