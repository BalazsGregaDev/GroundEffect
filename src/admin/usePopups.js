import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function usePopups() {
  const [popups, setPopups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const result = await supabase
      .from('site_popups')
      .select('id, name, enabled, trigger_kind, pages, sort_order')
      .order('sort_order')
      .order('created_at')

    setPopups(result.data ?? [])
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { popups, loading, error, reload: load }
}
