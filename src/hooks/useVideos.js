import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns =
  'id, youtube_id, title, duration, thumbnail_url, views, published_at, featured'

export function useVideos(gridSize) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('videos')
      .select(columns)
      .eq('hidden', false)
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(gridSize + 1)
      .then(({ data }) => {
        if (active) {
          setVideos(data ?? [])
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [gridSize])

  return { latest: videos[0] ?? null, grid: videos.slice(1), loading }
}
