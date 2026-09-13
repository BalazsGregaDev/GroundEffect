import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const columns = 'id, slug, title, published_at, categories (name), article_tags (tag_id)'
const poolSize = 60
const latestCount = 3
const relatedCount = 7

function rank(pool, currentTagIds) {
  return pool
    .map((article) => ({
      article,
      score: article.article_tags.filter((row) => currentTagIds.has(row.tag_id)).length,
    }))
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.article)
}

export function useSidebarArticles(current) {
  const [groups, setGroups] = useState({ latest: [], related: [] })

  useEffect(() => {
    let active = true

    supabase
      .from('articles')
      .select(columns)
      .order('published_at', { ascending: false })
      .limit(poolSize)
      .then(({ data }) => {
        if (!active) {
          return
        }

        const pool = (data ?? []).filter((article) => article.id !== current.id)
        const currentTagIds = new Set(current.article_tags.map((row) => row.tags.id))

        setGroups({
          latest: pool.slice(0, latestCount),
          related: rank(pool.slice(latestCount), currentTagIds).slice(0, relatedCount),
        })
      })

    return () => {
      active = false
    }
  }, [current])

  return groups
}
