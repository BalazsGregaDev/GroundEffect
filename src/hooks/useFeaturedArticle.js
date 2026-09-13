import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns = 'id, slug, title, reading_minutes, published_at, categories (name)'

export function useFeaturedArticle() {
  const [article, setArticle] = useState(null)

  useEffect(() => {
    let active = true

    supabase
      .from('articles')
      .select(columns)
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setArticle(data)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return article
}
