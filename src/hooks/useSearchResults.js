import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { isSearching, searchDebounce, searchWords } from '../lib/search.js'
import { track } from '../lib/track.js'

const videoColumns = 'id, youtube_id, title, duration, thumbnail_url, views, published_at'
const videoLimit = 12

const empty = { videos: [], articles: [], loading: false }
const settleAfter = 2000
const keepAfter = 1500

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
    let report = null
    let settled = null

    setResults((current) => ({ ...current, loading: true }))

    const timer = setTimeout(async () => {
      const [videos, articles] = await Promise.all([
        withVideos ? findVideos(searchWords(term)) : [],
        findArticles(term, limit),
      ])

      if (!active) {
        return
      }

      setResults({ videos, articles, loading: false })

      settled = {
        at: Date.now(),
        event: {
          type: 'search',
          q: term.toLowerCase().slice(0, 60),
          n: videos.length + articles.length,
          scope: withVideos ? 'home' : 'archive',
        },
      }

      report = setTimeout(() => {
        track(settled.event)
        settled = null
      }, settleAfter)
    }, searchDebounce)

    return () => {
      active = false
      clearTimeout(timer)
      clearTimeout(report)

      if (settled && Date.now() - settled.at >= keepAfter) {
        track(settled.event)
      }
    }
  }, [term, withVideos, limit])

  return results
}
