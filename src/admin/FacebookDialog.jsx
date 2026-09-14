import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { functionErrorMessage } from '../lib/functionError.js'
import { coverUrl } from '../lib/cloudinary.js'
import './FacebookDialog.css'

export default function FacebookDialog({ articleId, form, onClose, onShared }) {
  const [message, setMessage] = useState(form.lead || form.title)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape' && !sending) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, sending])

  async function send() {
    setSending(true)
    setError(null)

    try {
      const { data, error: shareError } = await supabase.functions.invoke('share-facebook', {
        body: { articleId, message },
      })

      if (shareError) {
        setError(await functionErrorMessage(shareError, 'A megosztás nem sikerült.'))
        return
      }

      onShared(data.postId)
    } catch (thrown) {
      setError(thrown.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fb-backdrop" onMouseDown={sending ? undefined : onClose}>
      <div className="fb-panel" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Megosztás a Facebook oldalon</h2>

        <label className="admin-field">
          <span>Kísérőszöveg</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            disabled={sending}
          />
        </label>

        <div className="fb-preview">
          {form.cover_url && <img src={coverUrl(form.cover_url)} alt="" />}
          <div className="fb-preview-text">
            <span className="fb-preview-domain">ground-effect</span>
            <strong>{form.title}</strong>
            {form.lead && <p>{form.lead}</p>}
          </div>
        </div>

        <p className="editor-hint">
          A kártyát a Facebook a cikk oldaláról olvassa ki. Ha nemrég módosítottad a címet vagy a
          borítóképet, pár percig még a régit mutathatja.
        </p>

        {error && <p className="admin-error">{error}</p>}

        <div className="fb-actions">
          <button
            type="button"
            className="admin-button"
            onClick={send}
            disabled={sending || !message.trim()}
          >
            {sending ? 'Küldés…' : 'Megosztás'}
          </button>
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={onClose}
            disabled={sending}
          >
            Mégsem
          </button>
        </div>
      </div>
    </div>
  )
}
