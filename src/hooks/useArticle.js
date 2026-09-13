import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns =
  'id, slug, title, lead, body, cover_url, cover_focus, reading_minutes, published_at, ' +
  'categories (name, slug), article_tags (tags (id, slug, name))'

export function useArticle(slug) {
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const counted = useRef(null)

  useEffect(() => {
    let active = true
    setLoading(true)

    supabase
      .from('articles')
      .select(columns)
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) {
          return
        }

        setArticle(data)
        setLoading(false)

        if (data && counted.current !== slug) {
          counted.current = slug
          supabase.rpc('increment_article_views', { article_slug: slug })
        }
      })

    return () => {
      active = false
    }
  }, [slug])

  return { article, loading }
}
