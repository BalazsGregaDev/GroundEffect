import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { isSearching, searchDebounce, searchWords } from '../lib/search.js'

const videoColumns = 'id, youtube_id, title, duration, thumbnail_url, views, published_at'
const videoLimit = 12

const empty = { videos: [], articles: [], loading: false }

async function findVideos(words) {
  if (words.length === 0) {
    return []
  }

  let request = supabase.from('videos').select(videoColumns).eq('hidden', false)

  for (const word of words) {
    request = request.ilike('title', `%${word}%`)
  }

  const { data } = await request.order('published_at', { ascending: false }).limit(videoLimit)

  return data ?? []
}

async function findArticles(term, limit) {
  const { data } = await supabase.rpc('search_articles', { p_query: term, p_limit: limit })

  return data ?? []
}

export function useSearchResults(query, { withVideos = true, limit = 20 } = {}) {
  const [results, setResults] = useState(empty)
  const term = query.trim()

  useEffect(() => {
    if (!isSearching(term)) {
      setResults(empty)
      return
    }

    let active = true

    setResults((current) => ({ ...current, loading: true }))

    const timer = setTimeout(async () => {
      const [videos, articles] = await Promise.all([
        withVideos ? findVideos(searchWords(term)) : [],
        findArticles(term, limit),
      ])

      if (active) {
        setResults({ videos, articles, loading: false })
      }
    }, searchDebounce)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [term, withVideos, limit])

  return results
}
