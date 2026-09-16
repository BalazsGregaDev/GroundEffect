import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-sync-secret',
}

const source = 'https://raw.githubusercontent.com/sportstimes/f1/main/_db'

const raceKeys: Record<string, string> = {
  f1: 'gp',
  f2: 'feature',
  f3: 'feature',
  motogp: 'race',
  indycar: 'race',
}

const seriesLabels: Record<string, Record<string, string>> = {
  motogp: {
    fp1: 'FP1',
    practice: 'Practice',
    fp2: 'FP2',
    qualifying1: 'Q1',
    qualifying2: 'Q2',
    sprint: 'Sprint',
    warmup: 'Warm Up',
    race: 'Futam',
  },
}

const labels: Record<string, string> = {
  fp1: '1. szabadedzés',
  fp2: '2. szabadedzés',
  fp3: '3. szabadedzés',
  practice: 'Szabadedzés',
  FinalPractice: 'Utolsó szabadedzés',
  qualifying: 'Időmérő',
  qualifying1: 'Időmérő 1',
  qualifying2: 'Időmérő 2',
  sprintQualifying: 'Sprint időmérő',
  sprint: 'Sprintfutam',
  warmup: 'Warm-up',
  gp: 'Futam',
  race: 'Futam',
  feature: 'Főfutam',
}

type RawRace = {
  round?: number
  name?: string
  location?: string
  latitude?: number | string
  longitude?: number | string
  slug?: string
  tbc?: boolean
  sessions?: Record<string, string>
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function describe(series: string, key: string) {
  const named = seriesLabels[series]?.[key] ?? labels[key]

  if (key === raceKeys[series]) {
    return { kind: 'race', label: named ?? 'Futam' }
  }

  const numbered = /^practice(\d+)$/.exec(key)

  if (numbered) {
    return { kind: 'practice', label: named ?? `${numbered[1]}. szabadedzés` }
  }

  if (key === 'practice' || key === 'FinalPractice' || /^fp\d+$/.test(key)) {
    return { kind: 'practice', label: named ?? 'Szabadedzés' }
  }

  if (key === 'sprintQualifying') {
    return { kind: 'sprint_qualifying', label: named ?? 'Sprint időmérő' }
  }

  if (key.startsWith('qualifying')) {
    return { kind: 'qualifying', label: named ?? 'Időmérő' }
  }

  if (key === 'sprint') {
    return { kind: 'sprint', label: named ?? 'Sprintfutam' }
  }

  if (key === 'warmup') {
    return { kind: 'warmup', label: named ?? 'Warm-up' }
  }

  return { kind: 'other', label: named ?? key }
}

function coordinate(value: unknown) {
  const number = Number(value)

  return Number.isFinite(number) && number !== 0 ? number : null
}

export function normalize(series: string, races: RawRace[]) {
  return races.map((race) => ({
    round: race.round ?? null,
    name: race.name ?? '',
    location: race.location ?? null,
    latitude: coordinate(race.latitude),
    longitude: coordinate(race.longitude),
    slug: race.slug ?? null,
    tbc: race.tbc === true,
    sessions: Object.entries(race.sessions ?? {})
      .map(([key, startsAt]) => ({ ...describe(series, key), starts_at: startsAt }))
      .sort((left, right) => left.starts_at.localeCompare(right.starts_at)),
  }))
}

export async function fetchSeason(series: string, season: number) {
  const response = await fetch(`${source}/${series}/${season}.json`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`${series} ${season}: a forrás ${response.status} hibát adott.`)
  }

  const body = await response.json()

  if (!Array.isArray(body.races)) {
    throw new Error(`${series} ${season}: a fájl szerkezete megváltozott.`)
  }

  return normalize(series, body.races)
}

async function callerIsEditor(authorization: string) {
  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  })

  const { data: role, error } = await caller.rpc('current_admin_role')

  if (error) {
    throw new Error('A szerepkör lekérdezése nem sikerült.')
  }

  return role === 'superadmin' || role === 'admin'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const syncSecret = Deno.env.get('SYNC_SECRET')
  const scheduled = Boolean(syncSecret) && req.headers.get('x-sync-secret') === syncSecret

  if (!scheduled) {
    const authorization = req.headers.get('Authorization')

    if (!authorization) {
      return json({ error: 'Hiányzó bejelentkezés.' }, 401)
    }

    if (!(await callerIsEditor(authorization))) {
      return json({ error: 'Ehhez szerkesztői jog kell.' }, 403)
    }
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: series, error: seriesError } = await admin
    .from('race_series')
    .select('slug, source_key')
    .not('source_key', 'is', null)
    .order('sort_order')

  if (seriesError) {
    return json({ error: `A sorozatok lekérdezése nem sikerült: ${seriesError.message}` }, 500)
  }

  const syncedAt = new Date().toISOString()
  const thisYear = new Date().getUTCFullYear()
  const seasons = [thisYear, thisYear + 1]
  const report: Record<string, number> = {}
  let total = 0

  try {
    for (const row of series ?? []) {
      for (const season of seasons) {
        const races = await fetchSeason(row.source_key, season)

        if (races === null) {
          continue
        }

        const { data: count, error } = await admin.rpc('apply_race_sync', {
          p_source_key: row.source_key,
          p_season: season,
          p_races: races,
        })

        if (error) {
          return json({ error: `${row.slug} ${season}: ${error.message}` }, 500)
        }

        report[`${row.slug} ${season}`] = count
        total += count
      }
    }
  } catch (failure) {
    return json({ error: (failure as Error).message }, 502)
  }

  return json({ synced: total, series: report, syncedAt })
})
