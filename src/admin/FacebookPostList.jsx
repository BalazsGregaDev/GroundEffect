import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { useFacebookPosts } from './useFacebookPosts.js'
import { functionErrorMessage } from '../lib/functionError.js'
import { relativeTime } from '../lib/format.js'
import ToggleSwitch from '../components/ToggleSwitch.jsx'
import './FacebookPostList.css'

const excerptLength = 180

function excerpt(message) {
  if (!message) {
    return 'Szöveg nélküli bejegyzés'
  }

  return message.length > excerptLength ? `${message.slice(0, excerptLength)}…` : message
}

function lastSync(posts) {
  const stamps = posts.map((post) => post.synced_at).filter(Boolean)

  if (stamps.length === 0) {
    return null
  }

  return stamps.reduce((newest, stamp) => (stamp > newest ? stamp : newest))
}

export default function FacebookPostList() {
  const { canEdit } = useAuth()
  const { posts, loading, error, reload } = useFacebookPosts()
  const [syncing, setSyncing] = useState(false)
  const [notice, setNotice] = useState(null)
  const [failure, setFailure] = useState(null)

  async function runSync() {
    setSyncing(true)
    setNotice(null)
    setFailure(null)

    try {
      const { data, error: syncError } = await supabase.functions.invoke('sync-facebook-posts')

      if (syncError) {
        setFailure(await functionErrorMessage(syncError, 'A szinkronizálás nem sikerült.'))
        return
      }

      setNotice(`${data.synced} bejegyzés frissítve.`)
      await reload()
    } catch (thrown) {
      setFailure(thrown.message)
    } finally {
      setSyncing(false)
    }
  }

  async function setVisible(post, visible) {
    setFailure(null)

    const { error: updateError } = await supabase
      .from('facebook_posts')
      .update({ visible })
      .eq('id', post.id)

    if (updateError) {
      setFailure(`A módosítás nem sikerült: ${updateError.message}`)
      return
    }

    await reload()
  }

  const synced = lastSync(posts)
  const shown = posts.filter((post) => post.visible).length

  return (
    <div>
      <div className="list-head">
        <h1>Facebook poszt</h1>
        {canEdit && (
          <button type="button" className="admin-button" onClick={runSync} disabled={syncing}>
            {syncing ? 'Szinkronizálás…' : 'Szinkronizálás most'}
          </button>
        )}
      </div>

      <p className="fbadmin-hint">
        {synced
          ? `Az oldal legutóbbi ${posts.length} bejegyzése. Utolsó szinkron: ${relativeTime(synced)}. A kapcsolóval döntöd el, melyik kerüljön ki a főoldalra — most ${shown} van bekapcsolva.`
          : 'Az oldal bejegyzései még nincsenek behúzva. Indítsd el a szinkronizálást.'}
      </p>

      {notice && <p className="admin-readonly">{notice}</p>}

      {failure && <p className="admin-error">{failure}</p>}

      {error && <p className="admin-error">Nem sikerült betölteni a bejegyzéseket: {error.message}</p>}

      {loading && <p className="list-empty">Betöltés…</p>}

      {!loading && posts.length === 0 && <p className="list-empty">Még nincs behúzott bejegyzés.</p>}

      <div className="fbadmin-list">
        {posts.map((post) => (
          <article className={post.visible ? 'fbadmin-row is-on' : 'fbadmin-row'} key={post.id}>
            {post.image_url && <img src={post.image_url} alt="" loading="lazy" />}

            <div className="fbadmin-body">
              <span className="fbadmin-date">{relativeTime(post.created_time)}</span>
              <p>{excerpt(post.message)}</p>
              {post.permalink_url && (
                <a href={post.permalink_url} target="_blank" rel="noreferrer">
                  Megnyitás a Facebookon
                </a>
              )}
            </div>

            <div className="fbadmin-switch">
              <ToggleSwitch
                checked={post.visible}
                onChange={(next) => setVisible(post, next)}
                label="Megjelenítés a főoldalon"
                disabled={!canEdit}
              />
              <span className="fbadmin-state">Főoldalon</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
