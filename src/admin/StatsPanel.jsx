import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import './StatsPanel.css'

const ranges = [
  { days: 7, label: '7 nap' },
  { days: 30, label: '30 nap' },
  { days: 90, label: '90 nap' },
]

const number = new Intl.NumberFormat('hu-HU')

function duration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '–'
  }

  const rounded = Math.round(seconds)
  const minutes = Math.floor(rounded / 60)
  const rest = String(rounded % 60).padStart(2, '0')

  return `${minutes}:${rest}`
}

function share(part, whole) {
  if (!whole) {
    return '–'
  }

  return `${Math.round((part / whole) * 100)}%`
}

function SearchList({ title, hint, rows, value, empty }) {
  return (
    <section className="stats-block">
      <h3>{title}</h3>
      <p className="stats-hint">{hint}</p>

      {rows.length === 0 ? (
        <p className="stats-empty">{empty}</p>
      ) : (
        <ol className="stats-searches">
          {rows.map((row) => (
            <li key={row.query}>
              <span className="stats-query">{row.query}</span>
              <span className="stats-num">{value(row)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default function StatsPanel() {
  const [days, setDays] = useState(7)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true

    setError(false)

    supabase.rpc('stats_overview', { p_days: days }).then(({ data, error: loadError }) => {
      if (!active) {
        return
      }

      setStats(data ?? null)
      setError(Boolean(loadError))
    })

    return () => {
      active = false
    }
  }, [days])

  const totals = stats?.totals
  const cards = totals
    ? [
        { label: 'Cikkmegtekintés', value: number.format(totals.views) },
        { label: 'Átlagos aktív olvasás', value: duration(totals.read_seconds / totals.views) },
        { label: 'Végigolvasta', value: share(totals.depth_100, totals.views) },
        { label: 'Továbbkattintott ajánlott cikkre', value: share(totals.rec_out, totals.views) },
      ]
    : []

  return (
    <section className="stats" aria-busy={!stats && !error}>
      <div className="stats-head">
        <h2>Olvasottság</h2>

        <div className="stats-range" role="group" aria-label="Időszak">
          {ranges.map((range) => (
            <button
              key={range.days}
              type="button"
              className={range.days === days ? 'is-active' : undefined}
              aria-pressed={range.days === days}
              onClick={() => setDays(range.days)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <p className="stats-hint">
        Süti és azonosító nélkül, napi összesítésben. A bejelentkezett adminok olvasása nem számít bele.
      </p>

      {error && <p className="admin-error">A statisztika betöltése nem sikerült.</p>}

      {totals && (
        <>
          <div className="stats-cards">
            {cards.map((card) => (
              <div key={card.label} className="stats-card">
                <span className="stats-value">{card.value}</span>
                <span className="stats-label">{card.label}</span>
              </div>
            ))}
          </div>

          {totals.rec_out > 0 && (
            <p className="stats-hint">
              Ajánlóból: Legfrissebb cikkek {number.format(stats.slots.latest)}, Kapcsolódó cikkek{' '}
              {number.format(stats.slots.related)} kattintás.
            </p>
          )}

          <section className="stats-block">
            <h3>Legolvasottabb cikkek</h3>

            {stats.articles.length === 0 ? (
              <p className="stats-empty">Ebben az időszakban még nincs adat.</p>
            ) : (
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Cikk</th>
                    <th>Megtekintés</th>
                    <th>Átl. aktív idő</th>
                    <th>Félig olvasta</th>
                    <th>Végigolvasta</th>
                    <th>Továbbment</th>
                    <th>Ajánlóból jött</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.articles.map((row) => (
                    <tr key={row.id}>
                      <td className="stats-title">
                        <Link to={`/admin/cikkek/${row.id}`}>{row.title}</Link>
                        {row.reading_minutes > 0 && (
                          <span className="stats-meta">becsült olvasás {row.reading_minutes} perc</span>
                        )}
                      </td>
                      <td data-label="Megtekintés">{number.format(row.views)}</td>
                      <td data-label="Átl. aktív idő">{duration(row.read_seconds / row.views)}</td>
                      <td data-label="Félig olvasta">{share(row.depth_50, row.views)}</td>
                      <td data-label="Végigolvasta">{share(row.depth_100, row.views)}</td>
                      <td data-label="Továbbment">{share(row.rec_out, row.views)}</td>
                      <td data-label="Ajánlóból jött">{number.format(row.rec_in)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <div className="stats-split">
            <SearchList
              title="Leggyakoribb keresések"
              hint="Főoldali és cikkarchívumbeli keresések együtt."
              rows={stats.searches}
              value={(row) => number.format(row.searches)}
              empty="Még nem kerestek semmit."
            />

            <SearchList
              title="Találat nélküli keresések"
              hint="Ezekre nem volt találat, érdemes lehet róluk írni."
              rows={stats.zero}
              value={(row) => number.format(row.zero_results)}
              empty="Minden keresésre volt találat."
            />
          </div>
        </>
      )}
    </section>
  )
}
