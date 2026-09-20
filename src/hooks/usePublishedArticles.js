import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns = 'id, slug, title, reading_minutes, published_at, categories (name)'

function withCategory(rows) {
  return (rows ?? []).map(({ categories, ...article }) => ({
    ...article,
    category: categories?.name ?? null,
  }))
}

export function usePublishedArticles(limit) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    supabase
      .from('articles')
      .select(columns)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(limit)
      .then((result) => {
        if (!active) {
          return
        }

        setArticles(withCategory(result.data))
        setError(result.error)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [limit])

  return { articles, loading, error }
}
