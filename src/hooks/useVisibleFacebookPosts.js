import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns = 'id, message, permalink_url, image_url, created_time'

export function useVisibleFacebookPosts(limit) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('facebook_posts')
      .select(columns)
      .eq('visible', true)
      .order('created_time', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (active) {
          setPosts(data ?? [])
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [limit])

  return { posts, loading }
}
