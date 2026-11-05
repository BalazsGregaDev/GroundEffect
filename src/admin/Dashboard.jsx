import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { statuses } from './statuses.js'
import { useAuth } from './useAuth.js'
import { adminNav } from './adminNav.js'
import StatsPanel from './StatsPanel.jsx'
import './Dashboard.css'

function ArticleCounts({ canEdit }) {
  const [counts, setCounts] = useState(null)

  useEffect(() => {
    supabase
      .from('articles')
      .select('status')
      .then(({ data }) => {
        const tally = { draft: 0, review: 0, published: 0 }

        for (const article of data ?? []) {
          tally[article.status] += 1
        }

        setCounts(tally)
      })
  }, [])

  return (
    <>
      <div className="dashboard-cards">
        {statuses.map((status) => (
          <Link key={status.value} to={`/admin/cikkek?allapot=${status.value}`} className="dashboard-card">
            <span className="dashboard-count">{counts ? counts[status.value] : '–'}</span>
            <span className="dashboard-label">{status.label}</span>
          </Link>
        ))}
      </div>

      {canEdit && (
        <Link to="/admin/cikkek/uj" className="admin-button dashboard-new">
          Új cikk
        </Link>
      )}
    </>
  )
}

export default function Dashboard() {
  const { can, canWrite } = useAuth()
  const reachable = adminNav.filter((item) => item.permission && can(item.permission))

  return (
    <div>
      <h1>Áttekintés</h1>

      {can('articles') ? (
        <>
          <ArticleCounts canEdit={canWrite('articles')} />
          <StatsPanel />
        </>
      ) : (
        <p className="admin-readonly">
          {reachable.length > 0
            ? `A szerepköröddel elérhető: ${reachable.map((item) => item.label).join(', ')}.`
            : 'A szerepköröd jelenleg egy menüponthoz sem ad hozzáférést, csak hibajegyet küldhetsz.'}
        </p>
      )}
    </div>
  )
}
