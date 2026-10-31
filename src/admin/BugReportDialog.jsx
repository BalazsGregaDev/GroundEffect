import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { functionErrorMessage } from '../lib/functionError.js'
import { logKinds, readLog } from './adminLog.js'
import { dateTimeBounds } from './dateInput.js'
import './BugReportDialog.css'

const bugKinds = [
  'Hibaüzenet jelent meg',
  'Nem mentődött el, elveszett adat',
  'Nem működik egy gomb vagy funkció',
  'Rosszul jelenik meg',
  'Lassú vagy lefagy',
  'Kép- vagy videófeltöltés',
  'Egyéb',
]

function localNow() {
  const date = new Date()

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function clock(iso) {
  return new Date(iso).toLocaleTimeString('hu-HU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function Field({ label, hint, children }) {
  return (
    <label className="admin-field bug-field">
      <span>{label}</span>
      <small className="bug-hint">{hint}</small>
      {children}
    </label>
  )
}

export default function BugReportDialog({ onClose }) {
  const { pathname } = useLocation()
  const [entries] = useState(readLog)
  const [form, setForm] = useState(() => ({
    kind: '',
    happenedAt: localNow(),
    goal: '',
    trigger: '',
    note: '',
  }))
  const [attach, setAttach] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const dirty = Boolean(form.goal || form.trigger || form.note)

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape' && !sending && (!dirty || result)) {
        onClose()
      }
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, sending, dirty, result])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSending(true)
    setError(null)

    const { data, error: sendError } = await supabase.functions.invoke('send-bug-report', {
      body: {
        kind: form.kind,
        happened_at: form.happenedAt ? new Date(form.happenedAt).toISOString() : null,
        goal: form.goal.trim(),
        trigger: form.trigger.trim(),
        note: form.note.trim(),
        page: pathname,
        user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        log: attach ? entries : [],
      },
    })

    setSending(false)

    if (sendError) {
      setError(await functionErrorMessage(sendError, 'A hibajegyet nem sikerült elküldeni.'))
      return
    }

    setResult(data.message)
  }

  return (
    <div className="bug-backdrop">
      <div className="bug-panel" role="dialog" aria-labelledby="bug-title" data-log="off">
        <h2 id="bug-title">Hibajegy</h2>

        {result ? (
          <>
            <p className="bug-done">{result}</p>

            <button type="button" className="admin-button" onClick={onClose} autoFocus>
              Bezárás
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="bug-intro">
              Írd le röviden, mi történt. A napló az utolsó lépéseidet is elküldi, így
              könnyebb megtalálni a hibát.
            </p>

            <Field label="Milyen típusú hiba?" hint="Válaszd ki, ami a legjobban illik rá.">
              <select
                value={form.kind}
                onChange={(event) => update('kind', event.target.value)}
                required
                autoFocus
              >
                <option value="">Válassz…</option>
                {bugKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Mikor történt?" hint="Ha nem most, állítsd be nagyjából az időpontot.">
              <input
                type="datetime-local"
                {...dateTimeBounds}
                value={form.happenedAt}
                onChange={(event) => update('happenedAt', event.target.value)}
              />
            </Field>

            <Field
              label="Mi volt a cél?"
              hint="Mit szerettél volna elérni, például cikk mentése vagy kép feltöltése."
            >
              <input
                type="text"
                value={form.goal}
                onChange={(event) => update('goal', event.target.value)}
                maxLength={300}
                required
              />
            </Field>

            <Field
              label="Mi után jelentkezett?"
              hint="Az utolsó lépés a hiba előtt, például a Mentés gomb megnyomása."
            >
              <input
                type="text"
                value={form.trigger}
                onChange={(event) => update('trigger', event.target.value)}
                maxLength={300}
              />
            </Field>

            <Field
              label="Megjegyzés"
              hint="Bármi, ami segíthet: a hibaüzenet szövege, mi jelent meg helyette."
            >
              <textarea
                value={form.note}
                onChange={(event) => update('note', event.target.value)}
                maxLength={4000}
                rows={4}
              />
            </Field>

            <label className="bug-attach">
              <input
                type="checkbox"
                checked={attach}
                onChange={(event) => setAttach(event.target.checked)}
              />
              Napló csatolása ({entries.length} esemény)
            </label>

            {attach && entries.length > 0 && (
              <details className="bug-log">
                <summary>Napló megtekintése</summary>

                <ol>
                  {[...entries].reverse().map((entry, index) => (
                    <li key={`${entry.at}-${index}`}>
                      <time>{clock(entry.at)}</time>
                      <span className="bug-log-kind">{logKinds[entry.kind] ?? entry.kind}</span>
                      <span>{entry.message}</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {error && <p className="admin-error bug-error">{error}</p>}

            <div className="bug-actions">
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={onClose}
                disabled={sending}
              >
                Mégsem
              </button>
              <button type="submit" className="admin-button" disabled={sending}>
                {sending ? 'Küldés…' : 'Küldés'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
