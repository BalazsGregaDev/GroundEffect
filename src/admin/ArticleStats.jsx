import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import DailyChart from './DailyChart.jsx'
import { duration, number, share } from './statsFormat.js'
import './ArticleStats.css'

const series = [{ key: 'views', label: 'Megtekintés', color: '#c08a1a', kind: 'bar' }]
const shareNames = { facebook: 'Facebook', copy: 'link', native: 'továbbküldés' }

export default function ArticleStats({ articleId }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true

    supabase.rpc('article_stats', { p_article: articleId, p_days: 30 }).then(({ data }) => {
      if (active) {
        setStats(data ?? null)
      }
    })

    return () => {
      active = false
    }
  }, [articleId])

  if (!stats) {
    return null
  }

  const { totals } = stats
  const shares = Object.entries(stats.shares ?? {})
  const cards = [
    { label: 'Megtekintés', value: number.format(totals.views) },
    { label: 'Átl. aktív idő', value: duration(totals.read_seconds / totals.views) },
    { label: 'Végigolvasta', value: share(totals.depth_100, totals.views) },
    { label: 'Ajánlóból jött', value: number.format(totals.rec_in) },
  ]

  return (
    <section className="artstats">
      <h3>Olvasottság, utolsó 30 nap</h3>

      <div className="artstats-cards">
        {cards.map((card) => (
          <div key={card.label}>
            <span className="artstats-value">{card.value}</span>
            <span className="artstats-label">{card.label}</span>
          </div>
        ))}
      </div>

      <DailyChart rows={stats.daily} series={series} height={120} label="Napi megtekintések" />

      <p className="editor-hint">
        Összesen {number.format(stats.total_views ?? 0)} megtekintés.
        {shares.length > 0 &&
          ` Megosztva: ${shares.map(([key, value]) => `${shareNames[key] ?? key} ${number.format(value)}`).join(', ')}.`}
      </p>
    </section>
  )
}
