import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useCoverSettings() {
  const [settings, setSettings] = useState(null)
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const [settingsResult, seriesResult] = await Promise.all([
      supabase.from('site_settings').select('cover_design, cover_fallback_url').maybeSingle(),
      supabase
        .from('race_series')
        .select('id, slug, name, cover_tone, cover_url')
        .order('sort_order'),
    ])

    setSettings(settingsResult.data ?? null)
    setSeries(seriesResult.data ?? [])
    setError(settingsResult.error ?? seriesResult.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { settings, series, loading, error, reload: load }
}
