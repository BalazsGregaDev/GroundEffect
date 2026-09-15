import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const raceColumns =
  'id, series_id, name, location, circuit, country, starts_at, ' +
  'race_sessions (id, kind, label, starts_at)'

const lookahead = 120

export function useRaceCalendar() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const [seriesResult, raceResult, articleResult] = await Promise.all([
        supabase
          .from('race_series')
          .select('id, slug, name')
          .eq('visible', true)
          .order('sort_order'),
        supabase
          .from('races')
          .select(raceColumns)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at')
          .limit(lookahead),
        supabase.rpc('series_articles'),
      ])

      if (!active) {
        return
      }

      const articles = new Map((articleResult.data ?? []).map((row) => [row.series_id, row]))
      const next = new Map()

      for (const race of raceResult.data ?? []) {
        if (!next.has(race.series_id)) {
          next.set(race.series_id, {
            ...race,
            race_sessions: [...race.race_sessions].sort((left, right) =>
              left.starts_at.localeCompare(right.starts_at),
            ),
          })
        }
      }

      setSeries(
        (seriesResult.data ?? []).map((row) => ({
          ...row,
          race: next.get(row.id) ?? null,
          article: articles.get(row.id) ?? null,
        })),
      )
      setLoading(false)
    }

    load()

    return () => {
      active = false
    }
  }, [])

  return { series, loading }
}
