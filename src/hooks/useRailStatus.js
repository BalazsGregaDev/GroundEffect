import { useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { loadSeries, loadUpcomingRaces } from '../lib/raceData.js'
import { ActivePollContext } from './activePollContext.js'

const pollColumns = 'status, starts_at, closes_at, closed_at, hide_after_hours'

function useOwnPoll(skip) {
  const [poll, setPoll] = useState(null)

  useEffect(() => {
    if (skip) {
      return
    }

    let active = true

    supabase
      .from('polls')
      .select(pollColumns)
      .eq('active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setPoll(data ?? null)
        }
      })

    return () => {
      active = false
    }
  }, [skip])

  return poll
}

function useNextRace() {
  const [race, setRace] = useState(null)

  useEffect(() => {
    let active = true

    Promise.all([loadSeries(), loadUpcomingRaces()]).then(([allSeries, races]) => {
      if (!active) {
        return
      }

      const visible = new Map(allSeries.filter((row) => row.visible).map((row) => [row.id, row]))
      const next = races.find((row) => visible.has(row.series_id))

      setRace(next ? { name: next.name, series: visible.get(next.series_id) } : null)
    })

    return () => {
      active = false
    }
  }, [])

  return race
}

export function useRailStatus() {
  const shared = useContext(ActivePollContext)
  const ownPoll = useOwnPoll(shared !== null)
  const race = useNextRace()

  return { poll: shared ? shared.poll : ownPoll, race }
}
