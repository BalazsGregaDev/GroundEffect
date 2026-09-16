import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { coverUrl, deleteImages } from '../lib/cloudinary.js'
import { refreshCoverConfig } from '../lib/coverConfig.js'
import { defaultDesign, mergeDesign, seriesTone } from '../lib/seriesCover.js'
import CoverArt from '../components/CoverArt.jsx'
import CoverUpload from './CoverUpload.jsx'
import { useAuth } from './useAuth.js'
import { useCoverSettings } from './useCoverSettings.js'
import './CoverSettings.css'

const knobs = [
  { key: 'tint', label: 'Háttér színkeverése', min: 0, max: 70, unit: '%' },
  { key: 'stripeOpacity', label: 'Csíkok átlátszósága', min: 0, max: 100, unit: '%' },
  { key: 'stripeCount', label: 'Csíkok száma', min: 0, max: 6 },
  { key: 'stripeWidth', label: 'Csík vastagsága', min: 2, max: 40 },
  { key: 'stripeGap', label: 'Csíkok távolsága', min: 4, max: 60 },
  { key: 'stripeLean', label: 'Csíkok dőlése', min: 0, max: 120 },
  { key: 'stripeStart', label: 'Csíkok kezdete', min: 120, max: 320 },
  { key: 'ruleHeight', label: 'Alsó sáv vastagsága', min: 0, max: 20 },
  { key: 'textInset', label: 'Felirat behúzása', min: 8, max: 80 },
  { key: 'maxFont', label: 'Felirat legnagyobb mérete', min: 14, max: 60 },
]

function Preview({ name, tone, url, design }) {
  return (
    <figure className="cover-sample">
      <span className="cover-sample-box">
        {url ? (
          <img src={coverUrl(url)} alt="" />
        ) : (
          <CoverArt name={name} tone={tone} design={design} />
        )}
      </span>
      <figcaption>{name}</figcaption>
    </figure>
  )
}

export default function CoverSettings() {
  const { canEdit } = useAuth()
  const { settings, series, loading, error, reload } = useCoverSettings()
  const [design, setDesign] = useState(defaultDesign)
  const [fallbackUrl, setFallbackUrl] = useState(null)
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (loading) {
      return
    }

    setDesign(mergeDesign(settings?.cover_design))
    setFallbackUrl(settings?.cover_fallback_url ?? null)
    setRows(series)
  }, [loading, settings, series])

  if (loading) {
    return <p className="admin-boot">Betöltés…</p>
  }

  const savedDesign = mergeDesign(settings?.cover_design)
  const changed = rows.filter((row) => {
    const original = series.find((item) => item.id === row.id)

    if (!original) {
      return false
    }

    return original.cover_tone !== row.cover_tone || original.cover_url !== row.cover_url
  })

  const dirty =
    changed.length > 0 ||
    fallbackUrl !== (settings?.cover_fallback_url ?? null) ||
    JSON.stringify(design) !== JSON.stringify(savedDesign)

  function setKnob(key, value) {
    setNotice(null)
    setDesign((current) => ({ ...current, [key]: value }))
  }

  function changeFallback(next) {
    if (fallbackUrl && fallbackUrl !== next && fallbackUrl !== settings?.cover_fallback_url) {
      deleteImages(fallbackUrl)
    }

    setNotice(null)
    setFallbackUrl(next)
  }

  function changeRowCover(row, next) {
    const original = series.find((item) => item.id === row.id)

    if (row.cover_url && row.cover_url !== next && row.cover_url !== original?.cover_url) {
      deleteImages(row.cover_url)
    }

    setRow(row.id, { cover_url: next })
  }

  function setRow(id, patch) {
    setNotice(null)
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function resetKnobs() {
    setNotice(null)
    setDesign((current) => ({
      ...current,
      ...Object.fromEntries(knobs.map((knob) => [knob.key, defaultDesign[knob.key]])),
    }))
  }

  async function save() {
    setBusy(true)
    setFailure(null)
    setNotice(null)

    const orphans = changed
      .map((row) => {
        const original = series.find((item) => item.id === row.id)

        return original?.cover_url && original.cover_url !== row.cover_url
          ? original.cover_url
          : null
      })
      .filter(Boolean)

    if (settings?.cover_fallback_url && settings.cover_fallback_url !== fallbackUrl) {
      orphans.push(settings.cover_fallback_url)
    }

    const results = await Promise.all([
      supabase
        .from('site_settings')
        .update({ cover_design: design, cover_fallback_url: fallbackUrl })
        .eq('id', true),
      ...changed.map((row) =>
        supabase
          .from('race_series')
          .update({ cover_tone: row.cover_tone, cover_url: row.cover_url })
          .eq('id', row.id),
      ),
    ])

    setBusy(false)

    const failed = results.find((result) => result.error)

    if (failed) {
      setFailure(`A mentés nem sikerült: ${failed.error.message}`)
      return
    }

    if (orphans.length > 0) {
      deleteImages(orphans)
    }

    refreshCoverConfig()
    setNotice('Mentve.')
    await reload()
  }

  return (
    <div className="cover-settings">
      <h1>Borítóképek</h1>

      <p className="cover-intro">
        Ez jelenik meg mindenhol, ahol a cikkhez nincs feltöltve saját borítókép: a főoldali
        versenynaptárban és a megnyitott cikk élén is. Sorrend: a cikk saját képe, utána a
        sorozat default képe, utána a tartalék kép, és ha egyik sincs, a generált rajz.
      </p>

      {error && <p className="admin-error">A beállítások betöltése nem sikerült.</p>}

      <div className="cover-strip">
        {rows.map((row) => (
          <Preview
            key={row.id}
            name={row.name}
            tone={row.cover_tone || seriesTone(row.slug) || design.fallbackTone}
            url={row.cover_url || fallbackUrl}
            design={design}
          />
        ))}

        <Preview
          name={design.fallbackName}
          tone={design.fallbackTone}
          url={fallbackUrl}
          design={design}
        />
      </div>

      <section className="cover-block">
        <h2>Rajz</h2>
        <p className="editor-hint">
          Ezek a beállítások minden sorozatra vonatkoznak, hogy a borítók egy családnak
          látszódjanak. Az előnézet azonnal követi a csúszkákat, menteni külön kell.
        </p>

        <div className="cover-knobs">
          {knobs.map((knob) => (
            <label className="cover-knob" key={knob.key}>
              <span>
                {knob.label}
                <output>
                  {design[knob.key]}
                  {knob.unit}
                </output>
              </span>
              <input
                type="range"
                min={knob.min}
                max={knob.max}
                value={design[knob.key]}
                disabled={!canEdit}
                onChange={(event) => setKnob(knob.key, Number(event.target.value))}
              />
            </label>
          ))}
        </div>

        {canEdit && (
          <button type="button" className="admin-button admin-button--ghost" onClick={resetKnobs}>
            Rajz alaphelyzetbe
          </button>
        )}
      </section>

      <section className="cover-block">
        <h2>Tartalék</h2>
        <p className="editor-hint">
          Erre esik vissza minden olyan cikk, amelyik nem tartozik egy sorozathoz sem.
        </p>

        <div className="cover-fallback">
          <label className="admin-field">
            <span>Felirat</span>
            <input
              type="text"
              value={design.fallbackName}
              disabled={!canEdit}
              onChange={(event) => setKnob('fallbackName', event.target.value)}
            />
          </label>

          <label className="admin-field cover-tone">
            <span>Szín</span>
            <input
              type="color"
              value={design.fallbackTone}
              disabled={!canEdit}
              onChange={(event) => setKnob('fallbackTone', event.target.value)}
            />
          </label>

          <div className="admin-field">
            <span>Default kép</span>
            <CoverUpload
              value={fallbackUrl}
              disabled={!canEdit}
              onChange={changeFallback}
            />
          </div>
        </div>
      </section>

      <section className="cover-block">
        <h2>Sorozatok</h2>
        <p className="editor-hint">
          A sorozat default képe felülírja a rajzot. Ha nincs feltöltve, a rajz színe ez a szín
          lesz. A sorozatok nevét a Versenynaptár menüpontban tudod átírni.
        </p>

        <table className="list-table cover-table">
          <thead>
            <tr>
              <th>Sorozat</th>
              <th>Szín</th>
              <th>Default kép</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <span className="cover-tone-cell">
                    <input
                      type="color"
                      value={row.cover_tone || seriesTone(row.slug) || design.fallbackTone}
                      disabled={!canEdit}
                      onChange={(event) => setRow(row.id, { cover_tone: event.target.value })}
                    />

                    {row.cover_tone && canEdit && (
                      <button
                        type="button"
                        className="cover-clear"
                        onClick={() => setRow(row.id, { cover_tone: null })}
                      >
                        Alapértelmezett
                      </button>
                    )}
                  </span>
                </td>
                <td>
                  <CoverUpload
                    value={row.cover_url}
                    disabled={!canEdit}
                    onChange={(next) => changeRowCover(row, next)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {failure && <p className="admin-error">{failure}</p>}

      {canEdit ? (
        <div className="cover-save">
          <button type="button" className="admin-button" onClick={save} disabled={busy || !dirty}>
            {busy ? 'Mentés…' : 'Mentés'}
          </button>

          {notice && <span className="cover-notice">{notice}</span>}
          {dirty && !busy && <span className="cover-notice">Van mentetlen módosítás.</span>}
        </div>
      ) : (
        <p className="admin-readonly">Ezt a részt csak szerkesztői joggal lehet módosítani.</p>
      )}
    </div>
  )
}
