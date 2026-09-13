import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { useAdminVideos } from './useAdminVideos.js'
import { thumbnailUrl } from '../lib/youtube.js'
import { formatCount, relativeTime } from '../lib/format.js'
import './VideoList.css'

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

  async function runSync() {
    setSyncing(true)
    setNotice(null)
    setFailure(null)

    try {
      const { data, error: syncError } = await supabase.functions.invoke('sync-videos')

      if (syncError) {
        const detail = await syncError.context?.json().catch(() => null)
        setFailure(detail?.error ?? 'A szinkronizálás nem sikerült.')
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
          ? `A csatorna legutóbbi 50 feltöltése. Utolsó szinkron: ${relativeTime(synced)}.`
          : 'A csatorna feltöltései még nincsenek behúzva. Indítsd el a szinkronizálást.'}
      </p>

      {notice && <p className="admin-readonly">{notice}</p>}

      {failure && <p className="admin-error">{failure}</p>}

      {error && <p className="admin-error">Nem sikerült betölteni a videókat: {error.message}</p>}

      {loading && <p className="list-empty">Betöltés…</p>}

      {!loading && videos.length === 0 && <p className="list-empty">Még nincs behúzott videó.</p>}

      {videos.length > 0 && (
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
            {videos.map((video) => (
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
                </td>
                <td className="list-number">{video.duration ?? '–'}</td>
                <td className="list-number">{formatCount(video.views)}</td>
                <td className="list-number">{relativeTime(video.published_at)}</td>
                <td>
                  {canEdit ? (
                    <div className="video-actions">
                      <button
                        type="button"
                        className={video.featured ? 'video-toggle is-on' : 'video-toggle'}
                        onClick={() => toggleFeatured(video)}
                      >
                        Kiemelt
                      </button>
                      <button
                        type="button"
                        className={video.hidden ? 'video-toggle is-on' : 'video-toggle'}
                        onClick={() => toggleHidden(video)}
                      >
                        Rejtett
                      </button>
                    </div>
                  ) : (
                    <span className="video-state">
                      {[video.featured && 'kiemelt', video.hidden && 'rejtett']
                        .filter(Boolean)
                        .join(', ') || '–'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
