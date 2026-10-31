import { supabase } from './supabase.js'

const seriesColumns = 'id, slug, name, visible, sort_order, cover_tone, cover_url'

const raceColumns =
  'id, series_id, name, location, circuit, country, starts_at, ' +
  'race_sessions (id, kind, label, starts_at)'

const raceLimit = 120
const reuseWindow = 5000

function shared(fetcher) {
  let pending = null
  let startedAt = 0

  return function load({ fresh = false } = {}) {
    if (fresh || !pending || Date.now() - startedAt > reuseWindow) {
      startedAt = Date.now()
      pending = fetcher()
    }

    return pending
  }
}

export const loadSeries = shared(async () => {
  const { data } = await supabase.from('race_series').select(seriesColumns).order('sort_order')

  return data ?? []
})

export const loadUpcomingRaces = shared(async () => {
  const { data } = await supabase
    .from('races')
    .select(raceColumns)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(raceLimit)

  return data ?? []
})
