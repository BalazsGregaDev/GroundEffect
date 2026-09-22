import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns =
  'id, slug, title, lead, reading_minutes, published_at, cover_url, cover_focus, ' +
  'categories (name, slug), ' +
  'primary_series:tags!articles_primary_series_tag_id_fkey (slug, name)'

export function toArchiveArticle({ categories, primary_series: series, ...article }) {
  return {
    ...article,
    category: categories?.name ?? null,
    series_slug: series?.slug ?? null,
    series_name: series?.name ?? null,
  }
}

export function useArticleArchive(pageSize) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const loadPage = useCallback(
    async (offset) => {
      setLoading(true)

      const result = await supabase
        .from('articles')
        .select(columns)
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      const page = (result.data ?? []).map(toArchiveArticle)

      setArticles((current) => (offset === 0 ? page : [...current, ...page]))
      setError(result.error)
      setDone(page.length < pageSize)
      setLoading(false)
    },
    [pageSize],
  )

  useEffect(() => {
    loadPage(0)
  }, [loadPage])

  return {
    articles,
    loading,
    error,
    done,
    loadMore: () => loadPage(articles.length),
  }
}
