import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { useAdminVideos } from './useAdminVideos.js'
import { thumbnailUrl } from '../lib/youtube.js'
import { functionErrorMessage } from '../lib/functionError.js'
import { formatCount, relativeTime } from '../lib/format.js'
import ToggleSwitch from '../components/ToggleSwitch.jsx'
import './VideoList.css'

const filters = [
  { value: 'all', label: 'Mind' },
  { value: 'episodes', label: 'Adások' },
  { value: 'shorts', label: 'Shortok' },
]

function matchesFilter(video, filter) {
  if (filter === 'episodes') {
    return !video.is_short
  }

  if (filter === 'shorts') {
    return video.is_short
  }

  return true
}

function lastSync(videos) {
  const stamps = videos.map((video) => video.synced_at).filter(Boolean)

  if (stamps.length === 0) {
    return null
  }

  return stamps.reduce((newest, stamp) => (stamp > newest ? stamp : newest))
}

export default function VideoList() {
  const { canEdit } = useAuth()
  const { videos, loading, error, reload } = useAdminVideos()
  const [syncing, setSyncing] = useState(false)
  const [notice, setNotice] = useState(null)
  const [failure, setFailure] = useState(null)
  const [filter, setFilter] = useState('all')

  async function runSync() {
    setSyncing(true)
    setNotice(null)
    setFailure(null)

    try {
      const { data, error: syncError } = await supabase.functions.invoke('sync-videos')

      if (syncError) {
        setFailure(await functionErrorMessage(syncError, 'A szinkronizálás nem sikerült.'))
        return
      }

      setNotice(`${data.synced} videó frissítve.`)
      await reload()
    } catch (thrown) {
      setFailure(thrown.message)
    } finally {
      setSyncing(false)
    }
  }

  async function toggleFeatured(video) {
    setFailure(null)

    const { error: clearError } = await supabase
      .from('videos')
      .update({ featured: false })
      .eq('featured', true)

    if (clearError) {
      setFailure(`A kiemelés nem sikerült: ${clearError.message}`)
      return
    }

    if (!video.featured) {
      const { error: setError } = await supabase
        .from('videos')
        .update({ featured: true })
        .eq('id', video.id)

      if (setError) {
        setFailure(`A kiemelés nem sikerült: ${setError.message}`)
        return
      }
    }

    await reload()
  }

  async function toggleHidden(video) {
    setFailure(null)

    const { error: hideError } = await supabase
      .from('videos')
      .update({ hidden: !video.hidden })
      .eq('id', video.id)

    if (hideError) {
      setFailure(`A módosítás nem sikerült: ${hideError.message}`)
      return
    }

    await reload()
  }

  const synced = lastSync(videos)
  const shown = videos.filter((video) => matchesFilter(video, filter))
  const shortCount = videos.filter((video) => video.is_short).length

  return (
    <div>
      <div className="list-head">
        <h1>Videók</h1>
        {canEdit && (
          <button type="button" className="admin-button" onClick={runSync} disabled={syncing}>
            {syncing ? 'Szinkronizálás…' : 'Szinkronizálás most'}
          </button>
        )}
      </div>

      <p className="video-hint">
        {synced
          ? `A csatorna legutóbbi 50 feltöltése. Utolsó szinkron: ${relativeTime(synced)}. A 3 percnél rövidebb és a #shorts című videók automatikusan rejtettek, ebből ${shortCount} van.`
          : 'A csatorna feltöltései még nincsenek behúzva. Indítsd el a szinkronizálást.'}
      </p>

      {videos.length > 0 && (
        <div className="list-filters video-filters">
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              className={option.value === filter ? 'list-filter is-active' : 'list-filter'}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {notice && <p className="admin-readonly">{notice}</p>}

      {failure && <p className="admin-error">{failure}</p>}

      {error && <p className="admin-error">Nem sikerült betölteni a videókat: {error.message}</p>}

      {loading && <p className="list-empty">Betöltés…</p>}

      {!loading && videos.length === 0 && <p className="list-empty">Még nincs behúzott videó.</p>}

      {!loading && videos.length > 0 && shown.length === 0 && (
        <p className="list-empty">Nincs a szűrőnek megfelelő videó.</p>
      )}

      {shown.length > 0 && (
        <table className="list-table video-table">
          <thead>
            <tr>
              <th></th>
              <th>Cím</th>
              <th>Hossz</th>
              <th>Megtekintés</th>
              <th>Közzétéve</th>
              <th>Állapot</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((video) => (
              <tr key={video.id} className={video.hidden ? 'is-hidden' : undefined}>
                <td>
                  <img className="video-thumb" src={thumbnailUrl(video)} alt="" loading="lazy" />
                </td>
                <td>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {video.title}
                  </a>
                  {video.is_short && <span className="video-short">short</span>}
                </td>
                <td className="list-number">{video.duration ?? '–'}</td>
                <td className="list-number">{formatCount(video.views)}</td>
                <td className="list-number">{relativeTime(video.published_at)}</td>
                <td>
                  <div className="video-actions">
                    <div className={video.featured ? 'video-switch is-on' : 'video-switch'}>
                      <ToggleSwitch
                        checked={video.featured}
                        onChange={() => toggleFeatured(video)}
                        label={`${video.title} kiemelése`}
                        disabled={!canEdit}
                      />
                      <span className="video-switch-label">Kiemelt</span>
                    </div>

                    <div className={video.hidden ? 'video-switch is-on' : 'video-switch'}>
                      <ToggleSwitch
                        checked={video.hidden}
                        onChange={() => toggleHidden(video)}
                        label={`${video.title} elrejtése`}
                        disabled={!canEdit}
                      />
                      <span className="video-switch-label">Rejtett</span>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
