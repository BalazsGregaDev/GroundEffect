import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { sections } from '../data/sections.js'
import DailyChart from './DailyChart.jsx'
import { breakdown, duration, number, pivot, share } from './statsFormat.js'
import './StatsPanel.css'

const ranges = [
  { days: 7, label: '7 nap' },
  { days: 30, label: '30 nap' },
  { days: 90, label: '90 nap' },
]

const chartSeries = [
  { key: 'visitors', label: 'Egyedi látogató', color: '#c08a1a', kind: 'bar' },
  { key: 'views', label: 'Cikkmegtekintés', color: '#4a8fd8', kind: 'line' },
]

const deviceNames = { mobile: 'Mobil', tablet: 'Tablet', desktop: 'Asztali gép' }
const videoPlaces = { latest: 'Legfrissebb adás', grid: 'Korábbi adások', search: 'Keresés' }
const linkPlaces = {
  rail: 'oldalsáv',
  footer: 'lábléc',
  community: 'Csatlakozz',
  discounts: 'kedvezménykódok',
  facebook: 'Facebook-posztok',
  popup: 'popup',
  latest: 'Legfrissebb adás',
  videos: 'Korábbi adások',
  search: 'keresés',
  article: 'cikk szövege',
}
const sectionPlaces = { nav: 'oldalsáv', menu: 'mobilmenü' }
const shareNames = { facebook: 'Facebook', copy: 'link másolás', native: 'továbbküldés' }
const sectionNames = Object.fromEntries(sections.map((section) => [section.key, section.nav?.label ?? section.label]))

function StatList({ title, hint, rows, empty = 'Ebben az időszakban még nincs adat.' }) {
  return (
    <section className="stats-block">
      <h3>{title}</h3>
      {hint && <p className="stats-hint">{hint}</p>}

      {rows.length === 0 ? (
        <p className="stats-empty">{empty}</p>
      ) : (
        <ol className="stats-list">
          {rows.map((row) => (
            <li key={row.key}>
              <span className="stats-item">
                <span className="stats-query">{row.label}</span>
                {row.sub && <span className="stats-sub">{row.sub}</span>}
                {row.meter !== undefined && (
                  <span className="stats-meter">
                    <span style={{ width: `${Math.round(row.meter * 100)}%` }} />
                  </span>
                )}
              </span>
              <span className="stats-num">{row.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function linkLabel(key) {
  if (key.startsWith('merch: ')) {
    return key
  }

  return linkPlaces[key] ?? (key || 'egyéb')
}

export default function StatsPanel() {
  const [days, setDays] = useState(7)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(false)

    supabase.rpc('stats_overview', { p_days: days }).then(({ data, error: loadError }) => {
      if (!active) {
        return
      }

      if (data) {
        setStats(data)
      }

      setError(Boolean(loadError))
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [days])

  const totals = stats?.totals
  const events = stats?.events ?? []
  const cards = totals
    ? [
        { label: 'Egyedi látogató', value: number.format(totals.visitors ?? 0) },
        { label: 'Látogatás', value: number.format(totals.visits ?? 0) },
        { label: 'Cikkmegtekintés', value: number.format(totals.views) },
        { label: 'Átlagos aktív olvasás', value: duration(totals.read_seconds / totals.views) },
        { label: 'Végigolvasta', value: share(totals.depth_100, totals.views) },
        { label: 'Továbbkattintott ajánlott cikkre', value: share(totals.rec_out, totals.views) },
      ]
    : []

  const referrers = pivot(events, 'referrer')
  const referrerTotal = referrers.reduce((sum, row) => sum + row.total, 0)
  const devices = pivot(events, 'device')
  const deviceTotal = devices.reduce((sum, row) => sum + row.total, 0)
  const home = pivot(events, 'home')
  const homeViews = home.find((row) => row.name === 'view')?.total ?? 0

  return (
    <section className={loading && stats ? 'stats is-loading' : 'stats'} aria-busy={loading}>
      <div className="stats-head">
        <h2>Statisztika</h2>

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
        Süti nélkül, napi összesítésben. A bejelentkezett adminok nem számítanak bele. Az egyedi
        látogatót naponta cserélődő kulccsal számoljuk, IP-cím tárolása nélkül, ezért aki két
        különböző napon jön, kétszer számít.
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

          {stats.daily?.length > 0 && (
            <section className="stats-block">
              <h3>Napi bontás</h3>
              <DailyChart
                rows={stats.daily}
                series={chartSeries}
                label="Napi egyedi látogatók és cikkmegtekintések"
              />
            </section>
          )}

          <section className="stats-block">
            <h3>Legolvasottabb cikkek</h3>

            {totals.rec_out > 0 && (
              <p className="stats-hint">
                Ajánlóból: Legfrissebb cikkek {number.format(stats.slots.latest)}, Kapcsolódó cikkek{' '}
                {number.format(stats.slots.related)} kattintás.
              </p>
            )}

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
            <StatList
              title="Honnan érkeztek"
              hint="Az oldal első megnyitásakor, a hivatkozó oldal domainje."
              rows={referrers.map((row) => ({
                key: row.name,
                label: row.name === 'direct' ? 'Közvetlen vagy ismeretlen' : row.name,
                value: share(row.total, referrerTotal),
                sub: `${number.format(row.total)} látogatás`,
                meter: referrerTotal ? row.total / referrerTotal : 0,
              }))}
            />

            <StatList
              title="Eszközök"
              hint="Egyedi látogatónként."
              rows={devices.map((row) => ({
                key: row.name,
                label: deviceNames[row.name] ?? row.name,
                value: share(row.total, deviceTotal),
                sub: `${number.format(row.total)} látogató`,
                meter: deviceTotal ? row.total / deviceTotal : 0,
              }))}
            />

            <StatList
              title="Videólejátszások"
              hint="Kattintás a lejátszás gombra, honnan indították."
              rows={pivot(events, 'video').map((row) => ({
                key: row.name,
                label: row.title ?? row.name,
                sub: breakdown(row.labels, videoPlaces),
                value: number.format(row.total),
              }))}
            />

            <StatList
              title="Kimenő kattintások"
              hint="Patreon, Discord, merch, partnerek és minden külső link, honnan kattintottak."
              rows={pivot(events, 'out').map((row) => ({
                key: row.name,
                label: row.name,
                sub: Object.entries(row.labels)
                  .sort((left, right) => right[1] - left[1])
                  .map(([key, value]) => `${linkLabel(key)} ${number.format(value)}`)
                  .join(' · '),
                value: number.format(row.total),
              }))}
            />

            <StatList
              title="Kedvezménykód másolások"
              rows={pivot(events, 'coupon').map((row) => ({
                key: row.name,
                label: row.name,
                value: number.format(row.total),
              }))}
            />

            <StatList
              title="Popupok"
              hint="Megjelenés, gombra kattintás és bezárás."
              rows={pivot(events, 'popup').map((row) => ({
                key: row.name,
                label: row.title ?? 'Törölt popup',
                sub: `megjelent ${number.format(row.labels.shown ?? 0)} · bezárták ${number.format(
                  row.labels.closed ?? 0,
                )}`,
                value: `${share(row.labels.clicked ?? 0, row.labels.shown ?? 0)} kattintott`,
              }))}
            />

            <StatList
              title="Szavazás"
              hint="Hányan látták, nyitották le, szavaztak, értek a végére, javasoltak."
              rows={pivot(events, 'poll').map((row) => ({
                key: row.name,
                label: row.title ?? 'Törölt szavazás',
                sub: [
                  `látta ${number.format(row.labels.shown ?? 0)}`,
                  `lenyitotta ${number.format(row.labels.opened ?? 0)}`,
                  `szavazott ${number.format(row.labels.voted ?? 0)}`,
                  `végigért ${number.format(row.labels.finished ?? 0)}`,
                  `javasolt ${number.format(row.labels.suggested ?? 0)}`,
                ].join(' · '),
                value: `${share(row.labels.voted ?? 0, row.labels.shown ?? 0)} szavazott`,
              }))}
            />

            <StatList
              title="Főoldal görgetés"
              hint={`${number.format(homeViews)} főoldal-megnyitásból ennyien jutottak el az oldal adott pontjáig.`}
              rows={
                homeViews > 0
                  ? ['25', '50', '75', '100'].map((value) => {
                      const reached = home.find((row) => row.name === value)?.total ?? 0

                      return {
                        key: value,
                        label: value === '100' ? 'Az oldal aljáig' : `Az oldal ${value}%-áig`,
                        value: share(reached, homeViews),
                        meter: Math.min(reached / homeViews, 1),
                      }
                    })
                  : []
              }
            />

            <StatList
              title="Menüpontok"
              hint="Kattintás a szekciókra az oldalsávban vagy a mobilmenüben."
              rows={pivot(events, 'section').map((row) => ({
                key: row.name,
                label: sectionNames[row.name] ?? row.name,
                sub: breakdown(row.labels, sectionPlaces),
                value: number.format(row.total),
              }))}
            />

            <StatList
              title="Megosztások"
              rows={pivot(events, 'share').map((row) => ({
                key: row.name,
                label: row.title ?? row.name,
                sub: breakdown(row.labels, shareNames),
                value: number.format(row.total),
              }))}
            />

            <StatList
              title="Nem található oldalak"
              hint="Elírt vagy elavult linkek, amelyekre valaki rákattintott."
              empty="Senki nem futott hibás címre."
              rows={pivot(events, 'notfound').map((row) => ({
                key: row.name,
                label: row.name,
                value: number.format(row.total),
              }))}
            />

            <StatList
              title="Leggyakoribb keresések"
              hint="Főoldali és cikkarchívumbeli keresések együtt."
              empty="Még nem kerestek semmit."
              rows={stats.searches.map((row) => ({
                key: row.query,
                label: row.query,
                value: number.format(row.searches),
              }))}
            />

            <StatList
              title="Találat nélküli keresések"
              hint="Ezekre nem volt találat, érdemes lehet róluk írni."
              empty="Minden keresésre volt találat."
              rows={stats.zero.map((row) => ({
                key: row.query,
                label: row.query,
                value: number.format(row.zero_results),
              }))}
            />
          </div>
        </>
      )}
    </section>
  )
}
