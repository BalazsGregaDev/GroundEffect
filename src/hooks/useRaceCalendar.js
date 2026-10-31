import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { loadSeries, loadUpcomingRaces } from '../lib/raceData.js'

export function useRaceCalendar() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const [allSeries, races, articleResult] = await Promise.all([
        loadSeries(),
        loadUpcomingRaces(),
        supabase.rpc('series_articles'),
      ])

      if (!active) {
        return
      }

      const articles = new Map((articleResult.data ?? []).map((row) => [row.series_id, row]))
      const next = new Map()

      for (const race of races) {
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
        allSeries
          .filter((row) => row.visible)
          .map((row) => ({
            id: row.id,
            slug: row.slug,
            name: row.name,
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
