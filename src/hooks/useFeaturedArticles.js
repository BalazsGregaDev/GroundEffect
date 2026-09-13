import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { featuredArticleLimit } from '../data/site.js'

const columns = 'id, slug, title, reading_minutes, published_at, categories (name)'

export function useFeaturedArticles() {
  const [articles, setArticles] = useState([])

  useEffect(() => {
    let active = true

    supabase
      .from('articles')
      .select(columns)
      .eq('featured', true)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(featuredArticleLimit)
      .then(({ data }) => {
        if (active) {
          setArticles(data ?? [])
        }
      })

    return () => {
      active = false
    }
  }, [])

  return articles
}
