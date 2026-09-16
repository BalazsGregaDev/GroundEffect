import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns =
  'id, slug, title, lead, status, featured, views, reading_minutes, published_at, updated_at, ' +
  'categories (name)'

export function useArticles({ status, search }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)

    let query = supabase.from('articles').select(columns).order('updated_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      const pattern = `%${search}%`.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      query = query.or(`title.ilike."${pattern}",lead.ilike."${pattern}"`)
    }

    const result = await query

    setArticles(result.data ?? [])
    setError(result.error)
    setLoading(false)
  }, [status, search])

  useEffect(() => {
    load()
  }, [load])

  return { articles, loading, error, reload: load }
}
