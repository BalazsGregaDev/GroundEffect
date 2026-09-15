import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns =
  'id, label, kind, starts_at, races!inner (name, location, circuit, race_series!inner (name, visible))'

const lookahead = 60

export function useNextRace() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('race_sessions')
      .select(columns)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(lookahead)
      .then(({ data }) => {
        if (active) {
          setSession((data ?? []).find((row) => row.races.race_series.visible) ?? null)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return { session, loading }
}
