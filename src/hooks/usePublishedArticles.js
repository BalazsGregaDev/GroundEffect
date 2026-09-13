import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns = 'id, slug, title, reading_minutes, views, published_at, categories (name)'

export function usePublishedArticles(limit) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    supabase
      .from('articles')
      .select(columns)
      .order('published_at', { ascending: false })
      .limit(limit)
      .then((result) => {
        if (!active) {
          return
        }

        setArticles(result.data ?? [])
        setError(result.error)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [limit])

  return { articles, loading, error }
}
