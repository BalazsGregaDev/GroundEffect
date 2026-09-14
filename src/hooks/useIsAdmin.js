import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true

    async function check() {
      const { data } = await supabase.auth.getSession()

      if (!active || !data.session) {
        return
      }

      const { data: role } = await supabase.rpc('current_admin_role')

      if (active) {
        setIsAdmin(role !== null)
      }
    }

    check()

    return () => {
      active = false
    }
  }, [])

  return isAdmin
}
