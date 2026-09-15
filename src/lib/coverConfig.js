import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { defaultDesign, mergeDesign } from './seriesCover.js'

const empty = { design: defaultDesign, fallbackUrl: null, series: new Map() }

let cache = null
let inflight = null
const listeners = new Set()

async function fetchConfig() {
  const [settings, series] = await Promise.all([
    supabase.from('site_settings').select('cover_design, cover_fallback_url').maybeSingle(),
    supabase.from('race_series').select('slug, cover_tone, cover_url'),
  ])

  return {
    design: mergeDesign(settings.data?.cover_design),
    fallbackUrl: settings.data?.cover_fallback_url ?? null,
    series: new Map((series.data ?? []).map((row) => [row.slug, row])),
  }
}

function load() {
  if (!inflight) {
    inflight = fetchConfig()
      .catch(() => empty)
      .then((config) => {
        cache = config
        inflight = null
        listeners.forEach((listener) => listener(config))

        return config
      })
  }

  return inflight
}

export function refreshCoverConfig() {
  cache = null
  inflight = null

  return load()
}

export function useCoverConfig() {
  const [config, setConfig] = useState(cache ?? empty)

  useEffect(() => {
    listeners.add(setConfig)

    if (cache) {
      setConfig(cache)
    } else {
      load()
    }

    return () => {
      listeners.delete(setConfig)
    }
  }, [])

  return config
}
