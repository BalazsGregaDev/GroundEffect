import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { defaultDesign, mergeDesign } from './seriesCover.js'
import { mergeSections } from '../data/sections.js'

const empty = {
  design: defaultDesign,
  fallbackUrl: null,
  series: new Map(),
  sections: mergeSections([]),
}

let cache = null
let inflight = null
const listeners = new Set()

async function fetchConfig() {
  const [settings, series] = await Promise.all([
    supabase
      .from('site_settings')
      .select('cover_design, cover_fallback_url, sections_order')
      .maybeSingle(),
    supabase.from('race_series').select('slug, cover_tone, cover_url'),
  ])

  return {
    design: mergeDesign(settings.data?.cover_design),
    fallbackUrl: settings.data?.cover_fallback_url ?? null,
    series: new Map((series.data ?? []).map((row) => [row.slug, row])),
    sections: mergeSections(settings.data?.sections_order),
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

export function refreshSiteConfig() {
  cache = null
  inflight = null

  return load()
}

export function useSiteConfig() {
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
