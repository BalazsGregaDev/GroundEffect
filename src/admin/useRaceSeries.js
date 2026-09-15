import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { seriesColumns } from './raceShape.js'

export function useRaceSeries() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const result = await supabase
      .from('race_series')
      .select(`${seriesColumns}, races (count)`)
      .order('sort_order')

    setSeries(result.data ?? [])
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { series, loading, error, reload: load }
}
