import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const pollColumns = 'status, starts_at, closes_at, closed_at, hide_after_hours'
const lookahead = 12

const empty = { poll: null, race: null }

export function useRailStatus() {
  const [status, setStatus] = useState(empty)

  useEffect(() => {
    let active = true

    async function load() {
      const [pollResult, seriesResult, raceResult] = await Promise.all([
        supabase.from('polls').select(pollColumns).eq('active', true).maybeSingle(),
        supabase.from('race_series').select('id, slug, name').eq('visible', true),
        supabase
          .from('races')
          .select('name, series_id, starts_at')
          .gte('starts_at', new Date().toISOString())
          .order('starts_at')
          .limit(lookahead),
      ])

      if (!active) {
        return
      }

      const series = new Map((seriesResult.data ?? []).map((row) => [row.id, row]))
      const race = (raceResult.data ?? []).find((row) => series.has(row.series_id))

      setStatus({
        poll: pollResult.data ?? null,
        race: race ? { name: race.name, series: series.get(race.series_id) } : null,
      })
    }

    load()

    return () => {
      active = false
    }
  }, [])

  return status
}
