import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { raceColumns } from './raceShape.js'

export function useRaces(season) {
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)

    const result = await supabase
      .from('races')
      .select(raceColumns)
      .eq('season', season)
      .order('starts_at', { nullsFirst: false })

    setRaces(result.data ?? [])
    setError(result.error)
    setLoading(false)
  }, [season])

  useEffect(() => {
    load()
  }, [load])

  return { races, loading, error, reload: load }
}
