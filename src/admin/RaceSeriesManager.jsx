import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import ToggleSwitch from '../components/ToggleSwitch.jsx'
import { slugify } from '../lib/text.js'

export default function RaceSeriesManager({ series, canEdit, onChange, onError }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  async function add() {
    const trimmed = name.trim()
    const slug = slugify(trimmed)

    if (!trimmed || !slug) {
      onError('A sorozat neve nem lehet üres, és tartalmaznia kell betűt vagy számot.')
      return
    }

    if (series.some((item) => item.slug === slug)) {
      onError(`Már van ilyen azonosítójú sorozat: ${slug}`)
      return
    }

    setBusy(true)
    onError(null)

    const highest = series.reduce((max, item) => Math.max(max, item.sort_order), 0)
    const { error } = await supabase
      .from('race_series')
      .insert({ slug, name: trimmed, sort_order: highest + 1 })

    setBusy(false)

    if (error) {
      onError(`A sorozat felvétele nem sikerült: ${error.message}`)
      return
    }

    setName('')
    await onChange()
  }

  async function rename(item, next) {
    onError(null)
    const { error } = await supabase.from('race_series').update({ name: next }).eq('id', item.id)

    if (error) {
      onError(`Az átnevezés nem sikerült: ${error.message}`)
      return
    }

    await onChange()
  }

  async function toggleVisible(item) {
    onError(null)
    const { error } = await supabase
      .from('race_series')
      .update({ visible: !item.visible })
      .eq('id', item.id)

    if (error) {
      onError(`A módosítás nem sikerült: ${error.message}`)
      return
    }

    await onChange()
  }

  async function remove(item) {
    setBusy(true)
    onError(null)

    const { error } = await supabase.from('race_series').delete().eq('id', item.id)

    setBusy(false)
    setConfirmId(null)

    if (error) {
      onError(`A törlés nem sikerült: ${error.message}`)
      return
    }

    await onChange()
  }

  return (
    <details className="series-manager">
      <summary>
        <span>Sorozatok</span>
        <small>{series.length} db</small>
      </summary>

      <table className="list-table series-table">
        <thead>
          <tr>
            <th>Név</th>
            <th>Azonosító</th>
            <th>Forrás</th>
            <th>Futam</th>
            <th>Naptárban</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {series.map((item) => {
            const count = item.races?.[0]?.count ?? 0

            return (
              <tr key={item.id}>
                <td>
                  <input
                    className="series-name"
                    type="text"
                    defaultValue={item.name}
                    disabled={!canEdit}
                    onBlur={(event) => {
                      const next = event.target.value.trim()

                      if (next && next !== item.name) {
                        rename(item, next)
                      } else {
                        event.target.value = item.name
                      }
                    }}
                  />
                </td>
                <td className="list-number">{item.slug}</td>
                <td>
                  {item.source_key ? (
                    <span className="series-auto">szinkronizált</span>
                  ) : (
                    <span className="series-manual">kézi</span>
                  )}
                </td>
                <td className="list-number">{count}</td>
                <td>
                  <ToggleSwitch
                    checked={item.visible}
                    onChange={() => toggleVisible(item)}
                    label={`${item.name} megjelenítése`}
                    disabled={!canEdit}
                  />
                </td>
                <td>
                  {canEdit && !item.source_key && count === 0 && confirmId !== item.id && (
                    <button
                      type="button"
                      className="series-remove"
                      onClick={() => setConfirmId(item.id)}
                    >
                      Törlés
                    </button>
                  )}

                  {confirmId === item.id && (
                    <span className="series-confirm">
                      <button
                        type="button"
                        className="series-remove"
                        onClick={() => remove(item)}
                        disabled={busy}
                      >
                        Igen
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)}>
                        Mégsem
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {canEdit && (
        <div className="series-add">
          <label className="admin-field">
            <span>Új sorozat neve</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Pl. Dakar Rali"
            />
          </label>

          <button type="button" className="admin-button" onClick={add} disabled={busy || !name.trim()}>
            Felvétel
          </button>
        </div>
      )}

      {canEdit && (
        <p className="editor-hint">
          A kézi sorozatok futamait itt az admin felületen viszed fel. A szinkronizált
          sorozatokat a napi szinkron tölti, azokat nem lehet törölni.
        </p>
      )}
    </details>
  )
}
