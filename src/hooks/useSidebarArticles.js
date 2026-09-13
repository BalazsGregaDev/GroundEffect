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

export function useSidebarArticles(slug) {
  const [groups, setGroups] = useState({ latest: [], related: [] })

  useEffect(() => {
    let active = true

    async function load() {
      const { data } = await supabase
        .from('articles')
        .select(columns)
        .order('published_at', { ascending: false })
        .limit(poolSize)

      const rows = data ?? []
      let current = rows.find((article) => article.slug === slug)

      if (!current) {
        const extra = await supabase.from('articles').select(columns).eq('slug', slug).maybeSingle()
        current = extra.data
      }

      if (!active || !current) {
        return
      }

      const currentTagIds = new Set(current.article_tags.map((row) => row.tag_id))
      const others = rows.filter((article) => article.id !== current.id)

      setGroups({
        latest: others.slice(0, latestCount),
        related: rank(others.slice(latestCount), currentTagIds).slice(0, relatedCount),
      })
    }

    load()

    return () => {
      active = false
    }
  }, [slug])

  return groups
}
