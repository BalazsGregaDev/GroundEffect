import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { pageLabel, publicPages } from '../lib/popupPages.js'
import PopupCard from '../components/PopupCard.jsx'
import ToggleSwitch from '../components/ToggleSwitch.jsx'
import { useAuth } from './useAuth.js'
import { usePopups } from './usePopups.js'
import './PopupList.css'

const blank = {
  id: null,
  name: '',
  enabled: false,
  trigger_kind: 'first_visit',
  pages: [],
  eyebrow: '',
  title1: '',
  title2: '',
  body: '',
  button: '',
  link: '',
}

function places(popup) {
  if (popup.trigger_kind === 'first_visit') {
    return 'Főoldal, első látogatáskor'
  }

  const pages = Array.isArray(popup.pages) ? popup.pages : []

  return pages.length === 0 ? 'nincs oldal kiválasztva' : pages.map(pageLabel).join(', ')
}

export default function PopupList() {
  const { canEdit } = useAuth()
  const { popups, loading, error, reload } = usePopups()
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function open(id) {
    setFailure(null)
    setConfirmDelete(false)

    if (id === null) {
      setDraft({ ...blank })
      return
    }

    const { data, error: loadError } = await supabase
      .from('site_popups')
      .select('*')
      .eq('id', id)
      .single()

    if (loadError) {
      setFailure(`Ez a felugró ablak nem érhető el: ${loadError.message}`)
      return
    }

    setDraft({ ...data, pages: Array.isArray(data.pages) ? data.pages : [] })
  }

  function set(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function togglePage(path) {
    setDraft((current) => ({
      ...current,
      pages: current.pages.includes(path)
        ? current.pages.filter((item) => item !== path)
        : [...current.pages, path],
    }))
  }

  async function toggleEnabled(popup, next) {
    setFailure(null)

    const { error: writeError } = await supabase
      .from('site_popups')
      .update({ enabled: next })
      .eq('id', popup.id)

    if (writeError) {
      setFailure(`A módosítás nem sikerült: ${writeError.message}`)
      return
    }

    await reload()
  }

  async function save() {
    setSaving(true)
    setFailure(null)

    const payload = {
      name: draft.name.trim(),
      enabled: draft.enabled,
      trigger_kind: draft.trigger_kind,
      pages: draft.trigger_kind === 'subpage' ? draft.pages : [],
      eyebrow: draft.eyebrow,
      title1: draft.title1,
      title2: draft.title2,
      body: draft.body,
      button: draft.button,
      link: draft.link.trim(),
      version: Date.now(),
    }

    const { error: writeError } = draft.id
      ? await supabase.from('site_popups').update(payload).eq('id', draft.id)
      : await supabase.from('site_popups').insert(payload)

    setSaving(false)

    if (writeError) {
      setFailure(`A mentés nem sikerült: ${writeError.message}`)
      return
    }

    setDraft(null)
    await reload()
  }

  async function remove() {
    setConfirmDelete(false)

    const { error: deleteError } = await supabase
      .from('site_popups')
      .delete()
      .eq('id', draft.id)

    if (deleteError) {
      setFailure(`A törlés nem sikerült: ${deleteError.message}`)
      return
    }

    setDraft(null)
    await reload()
  }

  return (
    <div>
      <div className="list-head">
        <h1>Popup üzenetek</h1>

        {canEdit && (
          <button type="button" className="admin-button" onClick={() => open(null)}>
            Új popup
          </button>
        )}
      </div>

      <p className="admin-readonly">
        A felugró ablak akkor jelenik meg, amikor a látogató a megadott oldalra navigál vagy
        frissít. Az első látogatásra állított ablakot a böngésző megjegyzi, és csak akkor
        mutatja újra, ha mentés után módosult a tartalma.
      </p>

      {failure && <p className="admin-error">{failure}</p>}
      {error && <p className="admin-error">A felugró ablakok betöltése nem sikerült.</p>}

      {draft && (
        <div className="popup-editor">
          <div className="popup-editor-form">
            <label className="admin-field">
              <span>Név (csak az adminban látszik)</span>
              <input
                type="text"
                value={draft.name}
                onChange={(event) => set('name', event.target.value)}
                placeholder="Pl. Nyári merch akció"
              />
            </label>

            <fieldset className="popup-when">
              <legend>Mikor jelenjen meg?</legend>

              <label>
                <input
                  type="radio"
                  name="trigger"
                  checked={draft.trigger_kind === 'first_visit'}
                  onChange={() => set('trigger_kind', 'first_visit')}
                />
                <span>A főoldal első megnyitásakor</span>
              </label>

              <label>
                <input
                  type="radio"
                  name="trigger"
                  checked={draft.trigger_kind === 'subpage'}
                  onChange={() => set('trigger_kind', 'subpage')}
                />
                <span>Kiválasztott oldalak megnyitásakor</span>
              </label>
            </fieldset>

            {draft.trigger_kind === 'subpage' && (
              <fieldset className="popup-when">
                <legend>Mely oldalakon?</legend>

                {publicPages.map((page) => (
                  <label key={page.path}>
                    <input
                      type="checkbox"
                      checked={draft.pages.includes(page.path)}
                      onChange={() => togglePage(page.path)}
                    />
                    <span>
                      {page.label} <small>{page.path}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            <label className="admin-field">
              <span>Kis felirat a cím fölött</span>
              <input
                type="text"
                value={draft.eyebrow}
                onChange={(event) => set('eyebrow', event.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Cím első fele</span>
              <input
                type="text"
                value={draft.title1}
                onChange={(event) => set('title1', event.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Cím második fele (aranyszínű)</span>
              <input
                type="text"
                value={draft.title2}
                onChange={(event) => set('title2', event.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Szöveg</span>
              <textarea
                rows={3}
                value={draft.body}
                onChange={(event) => set('body', event.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Gomb felirata</span>
              <input
                type="text"
                value={draft.button}
                onChange={(event) => set('button', event.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Gomb linkje (üresen csak bezár)</span>
              <input
                type="text"
                value={draft.link}
                onChange={(event) => set('link', event.target.value)}
                placeholder="/merch vagy https://..."
              />
            </label>

            <div className="popup-editor-actions">
              <button type="button" className="admin-button" onClick={save} disabled={saving}>
                {saving ? 'Mentés…' : 'Mentés'}
              </button>

              {draft.id && !confirmDelete && (
                <button
                  type="button"
                  className="cover-clear"
                  onClick={() => setConfirmDelete(true)}
                >
                  Törlés
                </button>
              )}

              {confirmDelete && (
                <span className="popup-confirm">
                  <button type="button" className="cover-clear" onClick={remove}>
                    Végleges törlés
                  </button>
                  <button
                    type="button"
                    className="cover-clear"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Mégsem
                  </button>
                </span>
              )}

              <button type="button" className="cover-clear" onClick={() => setDraft(null)}>
                Bezárás
              </button>
            </div>
          </div>

          <div className="popup-editor-preview">
            <span className="popup-preview-label">Előnézet</span>
            <PopupCard popup={draft} />
          </div>
        </div>
      )}

      {loading && <p className="list-empty">Betöltés…</p>}

      {!loading && popups.length === 0 && <p className="list-empty">Még nincs felugró ablak.</p>}

      {popups.length > 0 && (
        <table className="list-table popup-table">
          <thead>
            <tr>
              <th>Név</th>
              <th>Hol jelenik meg</th>
              <th>Látszik</th>
            </tr>
          </thead>
          <tbody>
            {popups.map((popup) => (
              <tr key={popup.id}>
                <td>
                  <button type="button" className="popup-open" onClick={() => open(popup.id)}>
                    {popup.name || '(név nélkül)'}
                  </button>
                </td>
                <td className="popup-place">{places(popup)}</td>
                <td>
                  <ToggleSwitch
                    checked={popup.enabled}
                    onChange={(next) => toggleEnabled(popup, next)}
                    label={`${popup.name} megjelenítése`}
                    disabled={!canEdit}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
