import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { useRaceSeries } from './useRaceSeries.js'
import ToggleSwitch from '../components/ToggleSwitch.jsx'
import { dateTimeBounds } from './dateInput.js'
import {
  emptyRace,
  emptySession,
  fromLocalInput,
  fromRow,
  kindLabel,
  problems,
  raceColumns,
  sessionKinds,
  toRow,
} from './raceShape.js'
import './RaceList.css'
import './RaceEditor.css'

export default function RaceEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const { series } = useRaceSeries()

  const [race, setRace] = useState(id ? null : emptyRace())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true

    supabase
      .from('races')
      .select(raceColumns)
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (!active) {
          return
        }

        if (loadError) {
          setError(`Ez a futam nem érhető el: ${loadError.message}`)
          return
        }

        if (!data) {
          setError('Ez a futam már nem létezik.')
          return
        }

        setRace(fromRow(data))
      })

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (race && !race.series_id && series.length > 0) {
      setRace((current) => ({ ...current, series_id: series[0].id }))
    }
  }, [race, series])

  if (error && !race) {
    return (
      <div className="raced">
        <Link to="/admin/naptar" className="editor-back">
          Vissza a naptárhoz
        </Link>
        <p className="admin-error">{error}</p>
      </div>
    )
  }

  if (!race) {
    return <p className="admin-readonly">Betöltés…</p>
  }

  const synced = Boolean(race.synced_at)

  function update(field, value) {
    setRace((current) => ({ ...current, [field]: value }))
  }

  function updateSession(index, changes) {
    setRace((current) => ({
      ...current,
      race_sessions: current.race_sessions.map((session, position) =>
        position === index ? { ...session, ...changes } : session,
      ),
    }))
  }

  function changeKind(index, kind) {
    const session = race.race_sessions[index]
    const wasDefault = session.label === kindLabel(session.kind)

    updateSession(index, { kind, label: wasDefault ? kindLabel(kind) : session.label })
  }

  function addSession() {
    setRace((current) => ({
      ...current,
      race_sessions: [...current.race_sessions, emptySession()],
    }))
  }

  function removeSession(index) {
    setRace((current) => ({
      ...current,
      race_sessions: current.race_sessions.filter((_, position) => position !== index),
    }))
  }

  async function save() {
    const found = problems(race)

    if (found.length > 0) {
      setError(found.join(' '))
      return
    }

    setSaving(true)
    setError(null)

    const row = toRow(race)
    let raceId = race.id

    if (raceId) {
      const { error: updateError } = await supabase.from('races').update(row).eq('id', raceId)

      if (updateError) {
        setSaving(false)
        setError(`A mentés nem sikerült: ${updateError.message}`)
        return
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('races')
        .insert(row)
        .select('id')
        .single()

      if (insertError) {
        setSaving(false)
        setError(`A mentés nem sikerült: ${insertError.message}`)
        return
      }

      raceId = data.id
    }

    const { error: clearError } = await supabase
      .from('race_sessions')
      .delete()
      .eq('race_id', raceId)

    if (clearError) {
      setSaving(false)
      setError(`Az események mentése nem sikerült: ${clearError.message}`)
      return
    }

    const { error: sessionError } = await supabase.from('race_sessions').insert(
      race.race_sessions.map((session) => ({
        race_id: raceId,
        kind: session.kind,
        label: session.label.trim(),
        starts_at: fromLocalInput(session.starts_at),
      })),
    )

    setSaving(false)

    if (sessionError) {
      setError(`Az események mentése nem sikerült: ${sessionError.message}`)
      return
    }

    navigate('/admin/naptar')
  }

  async function remove() {
    setSaving(true)
    const { error: deleteError } = await supabase.from('races').delete().eq('id', race.id)
    setSaving(false)

    if (deleteError) {
      setError(`A törlés nem sikerült: ${deleteError.message}`)
      return
    }

    navigate('/admin/naptar')
  }

  return (
    <div className="raced">
      <div className="list-head">
        <div>
          <Link to="/admin/naptar" className="editor-back">
            Vissza a naptárhoz
          </Link>
          <h1>{race.id ? race.name || '(név nélkül)' : 'Új futam'}</h1>
        </div>

        {canEdit && (
          <div className="list-head-actions">
            <button type="button" className="admin-button" onClick={save} disabled={saving}>
              {saving ? 'Mentés…' : 'Mentés'}
            </button>
          </div>
        )}
      </div>

      {!canEdit && <p className="admin-readonly">Demó szerepkörrel csak olvasni tudod.</p>}

      {synced && (
        <p className="admin-readonly">
          Ezt a futamot a napi szinkron tölti. Amit itt átírsz, azt a következő szinkron
          felülírhatja.
        </p>
      )}

      {error && <p className="admin-error">{error}</p>}

      <div className="raced-group">
        <h2>Alapadatok</h2>

        <div className="raced-fields">
          <label className="admin-field">
            <span>Sorozat</span>
            <select
              value={race.series_id}
              onChange={(event) => update('series_id', event.target.value)}
              disabled={!canEdit}
            >
              {series.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>Szezon</span>
            <input
              type="number"
              value={race.season}
              onChange={(event) => update('season', event.target.value)}
              disabled={!canEdit}
            />
          </label>

          <label className="admin-field">
            <span>Kör (üresen hagyható)</span>
            <input
              type="number"
              value={race.round}
              onChange={(event) => update('round', event.target.value)}
              disabled={!canEdit}
            />
          </label>
        </div>

        <label className="admin-field">
          <span>A futam neve</span>
          <input
            type="text"
            value={race.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Pl. Magyar Nagydíj"
            disabled={!canEdit}
          />
        </label>

        <div className="raced-fields">
          <label className="admin-field">
            <span>Helyszín</span>
            <input
              type="text"
              value={race.location}
              onChange={(event) => update('location', event.target.value)}
              placeholder="Pl. Mogyoród"
              disabled={!canEdit}
            />
          </label>

          <label className="admin-field">
            <span>Pálya</span>
            <input
              type="text"
              value={race.circuit}
              onChange={(event) => update('circuit', event.target.value)}
              placeholder="Pl. Hungaroring"
              disabled={!canEdit}
            />
          </label>

          <label className="admin-field">
            <span>Ország</span>
            <input
              type="text"
              value={race.country}
              onChange={(event) => update('country', event.target.value)}
              placeholder="Pl. Magyarország"
              disabled={!canEdit}
            />
          </label>
        </div>

        <div className="raced-fields">
          <label className="admin-field">
            <span>Szélesség</span>
            <input
              type="number"
              step="any"
              value={race.latitude}
              onChange={(event) => update('latitude', event.target.value)}
              placeholder="47.5789"
              disabled={!canEdit}
            />
          </label>

          <label className="admin-field">
            <span>Hosszúság</span>
            <input
              type="number"
              step="any"
              value={race.longitude}
              onChange={(event) => update('longitude', event.target.value)}
              placeholder="19.2486"
              disabled={!canEdit}
            />
          </label>
        </div>

        <label className="admin-field">
          <span>Megjegyzés</span>
          <textarea
            rows="2"
            value={race.note}
            onChange={(event) => update('note', event.target.value)}
            disabled={!canEdit}
          />
        </label>

        <div className="raced-switch">
          <ToggleSwitch
            checked={race.tbc}
            onChange={(next) => update('tbc', next)}
            label="Nem végleges időpont"
            disabled={!canEdit}
          />
          <span>Nem végleges időpont</span>
        </div>
      </div>

      <div className="raced-group">
        <h2>Események</h2>

        <p className="editor-hint">
          Annyi eseményt veszel fel, amennyit a hétvége tartalmaz. A főoldali visszaszámláló
          a legkorábbi „Futam" típusú eseményt használja.
        </p>

        {race.race_sessions.length === 0 ? (
          <p className="list-empty">Még nincs esemény.</p>
        ) : (
          <div className="raced-sessions">
            {race.race_sessions.map((session, index) => (
              <div className="raced-session" key={index}>
                <label className="admin-field">
                  <span>Típus</span>
                  <select
                    value={session.kind}
                    onChange={(event) => changeKind(index, event.target.value)}
                    disabled={!canEdit}
                  >
                    {sessionKinds.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-field">
                  <span>Felirat</span>
                  <input
                    type="text"
                    value={session.label}
                    onChange={(event) => updateSession(index, { label: event.target.value })}
                    placeholder="Pl. 1. szakasz"
                    disabled={!canEdit}
                  />
                </label>

                <label className="admin-field">
                  <span>Időpont</span>
                  <input
                    type="datetime-local"
                    value={session.starts_at}
                    onChange={(event) => updateSession(index, { starts_at: event.target.value })}
                    disabled={!canEdit}
                    {...dateTimeBounds}
                  />
                </label>

                {canEdit && (
                  <button
                    type="button"
                    className="raced-remove"
                    onClick={() => removeSession(index)}
                    aria-label={`${session.label || 'Esemény'} törlése`}
                  >
                    Törlés
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <button type="button" className="admin-button admin-button--ghost" onClick={addSession}>
            + Esemény hozzáadása
          </button>
        )}
      </div>

      {canEdit && race.id && (
        <div className="raced-danger">
          {confirmDelete ? (
            <>
              <button type="button" className="raced-delete" onClick={remove} disabled={saving}>
                Igen, töröld
              </button>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Mégsem
              </button>
            </>
          ) : (
            <button type="button" className="raced-delete" onClick={() => setConfirmDelete(true)}>
              Futam törlése
            </button>
          )}
        </div>
      )}
    </div>
  )
}
