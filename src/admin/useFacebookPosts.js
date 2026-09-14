import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns =
  'id, facebook_id, message, permalink_url, image_url, created_time, visible, synced_at'

export function useFacebookPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)

    const result = await supabase
      .from('facebook_posts')
      .select(columns)
      .order('created_time', { ascending: false })

    setPosts(result.data ?? [])
    setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { posts, loading, error, reload: load }
}
