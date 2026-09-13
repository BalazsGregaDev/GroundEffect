import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns =
  'id, youtube_id, title, duration, thumbnail_url, views, published_at, featured, hidden, synced_at'

export function useAdminVideos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)

    const result = await supabase
      .from('videos')
      .select(columns)
      .order('published_at', { ascending: false })

    setVideos(result.data ?? [])
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { videos, loading, error, reload: load }
}
