import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { useRaces } from './useRaces.js'
import { useRaceSeries } from './useRaceSeries.js'
import { useRaceSeasons } from './useRaceSeasons.js'
import RaceSeriesManager from './RaceSeriesManager.jsx'
import { functionErrorMessage } from '../lib/functionError.js'
import { relativeTime } from '../lib/format.js'
import './RaceList.css'

function lastSync(series) {
  const stamps = series.map((item) => item.synced_at).filter(Boolean)

  return stamps.length === 0 ? null : stamps.reduce((newest, stamp) => (stamp > newest ? stamp : newest))
}

function raceMoment(race) {
  return race.starts_at
    ? new Date(race.starts_at).toLocaleString('hu-HU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
}

export default function RaceList() {
  const { canEdit } = useAuth()
  const { series, loading: seriesLoading, reload: reloadSeries } = useRaceSeries()
  const { seasons, reload: reloadSeasons } = useRaceSeasons()
  const [season, setSeason] = useState(() => new Date().getFullYear())
  const { races, loading, error, reload } = useRaces(season)
  const [filter, setFilter] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [notice, setNotice] = useState(null)
  const [failure, setFailure] = useState(null)

  async function runSync() {
    setSyncing(true)
    setNotice(null)
    setFailure(null)

    try {
      const { data, error: syncError } = await supabase.functions.invoke('sync-races')

      if (syncError) {
        setFailure(await functionErrorMessage(syncError, 'A szinkronizálás nem sikerült.'))
        return
      }

      setNotice(`${data.synced} futam frissítve.`)
      await Promise.all([reload(), reloadSeries(), reloadSeasons()])
    } catch (thrown) {
      setFailure(thrown.message)
    } finally {
      setSyncing(false)
    }
  }

  const synced = lastSync(series)
  const shown = filter === 'all' ? races : races.filter((race) => race.series_id === filter)
  const named = new Map(series.map((item) => [item.id, item.name]))

  return (
    <div>
      <div className="list-head">
        <h1>Versenynaptár</h1>

        {canEdit && (
          <div className="list-head-actions">
            <Link to="/admin/naptar/uj" className="admin-button admin-button--ghost">
              Új futam
            </Link>
            <button type="button" className="admin-button" onClick={runSync} disabled={syncing}>
              {syncing ? 'Szinkronizálás…' : 'Szinkronizálás most'}
            </button>
          </div>
        )}
      </div>

      <p className="race-hint">
        {synced ? `Utolsó szinkron: ${relativeTime(synced)}` : 'Még nem futott szinkronizálás.'}
      </p>

      {notice && <p className="admin-readonly">{notice}</p>}
      {failure && <p className="admin-error">{failure}</p>}
      {error && <p className="admin-error">Nem sikerült betölteni a futamokat: {error.message}</p>}

      {!seriesLoading && (
        <RaceSeriesManager
          series={series}
          canEdit={canEdit}
          onChange={async () => {
            await Promise.all([reloadSeries(), reload()])
          }}
          onError={setFailure}
        />
      )}

      <div className="race-filters">
        <label className="admin-field race-season">
          <span>Szezon</span>
          <select value={season} onChange={(event) => setSeason(Number(event.target.value))}>
            {seasons.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <div className="list-filters">
          <button
            type="button"
            className={filter === 'all' ? 'list-filter is-active' : 'list-filter'}
            onClick={() => setFilter('all')}
          >
            Mind
          </button>

          {series.map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? 'list-filter is-active' : 'list-filter'}
              onClick={() => setFilter(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="list-empty">Betöltés…</p>}

      {!loading && shown.length === 0 && (
        <p className="list-empty">Ebben a szezonban nincs futam ezzel a szűrővel.</p>
      )}

      {shown.length > 0 && (
        <table className="list-table race-table">
          <thead>
            <tr>
              <th>Kör</th>
              <th>Futam</th>
              <th>Sorozat</th>
              <th>Helyszín</th>
              <th>Futam időpontja</th>
              <th>Események</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((race) => (
              <tr key={race.id}>
                <td className="list-number">{race.round ?? '—'}</td>
                <td>
                  <Link to={`/admin/naptar/${race.id}`}>{race.name}</Link>
                  {race.tbc && <span className="race-tbc">nem végleges</span>}
                  {!race.synced_at && <span className="race-manual">kézi</span>}
                </td>
                <td>{named.get(race.series_id) ?? '—'}</td>
                <td>{race.location || race.circuit || '—'}</td>
                <td className="list-number">{raceMoment(race)}</td>
                <td className="list-number">{race.race_sessions.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
