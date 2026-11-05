import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { byStrength } from './permissions.js'

export function useAdminRoles() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('admin_roles')
      .select('key, name, permissions, read_only, locked')

    setRoles([...(data ?? [])].sort(byStrength))
    setError(loadError)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { roles, loading, error, reload: load }
}
