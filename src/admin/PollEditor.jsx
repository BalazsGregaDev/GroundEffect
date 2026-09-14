import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import ToggleSwitch from './ToggleSwitch.jsx'
import { emptyPoll, emptyQuestion, fromRow, pollColumns, toExport } from './pollShape.js'
import { exporters } from '../lib/pollExport.js'
import './PollEditor.css'

function fromLocalInput(value) {
  return value ? new Date(value).toISOString() : null
}

export default function PollEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()

  const [poll, setPoll] = useState(id ? null : emptyPoll)
  const [removedQuestions, setRemovedQuestions] = useState([])
  const [removedOptions, setRemovedOptions] = useState([])
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true

    supabase
      .from('polls')
      .select(pollColumns)
      .eq('id', id)
      .single()
      .then(({ data, error: loadError }) => {
        if (!active) {
          return
        }

        if (loadError) {
          setError('Ez a szavazás nem érhető el.')
        } else {
          setPoll(fromRow(data))
        }

        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return <p className="admin-readonly">Betöltés…</p>
  }

  if (!poll) {
    return <p className="admin-error">{error}</p>
  }

  const readOnly = !canEdit

  function update(field, value) {
    setPoll((current) => ({ ...current, [field]: value }))
  }

  function updateQuestion(index, changes) {
    setPoll((current) => ({
      ...current,
      questions: current.questions.map((question, position) =>
        position === index ? { ...question, ...changes } : question,
      ),
    }))
  }

  function addQuestion() {
    setPoll((current) => ({ ...current, questions: [...current.questions, emptyQuestion()] }))
  }

  function removeQuestion(index) {
    setPoll((current) => {
      const question = current.questions[index]

      if (question.id) {
        setRemovedQuestions((ids) => [...ids, question.id])
      }

      return { ...current, questions: current.questions.filter((_, p) => p !== index) }
    })
  }

  function moveQuestion(index, offset) {
    setPoll((current) => {
      const target = index + offset

      if (target < 0 || target >= current.questions.length) {
        return current
      }

      const questions = [...current.questions]
      ;[questions[index], questions[target]] = [questions[target], questions[index]]

      return { ...current, questions }
    })
  }

  function addColumn(index) {
    const question = poll.questions[index]

    updateQuestion(index, {
      columns: [...question.columns, { name: '' }],
      options: question.options.map((option) => ({
        ...option,
        cells: [...option.cells, { value: '' }],
      })),
    })
  }

  function removeColumn(index, columnIndex) {
    const question = poll.questions[index]

    updateQuestion(index, {
      columns: question.columns.filter((_, p) => p !== columnIndex),
      options: question.options.map((option) => ({
        ...option,
        cells: option.cells.filter((_, p) => p !== columnIndex),
      })),
    })
  }

  function addOption(index) {
    const question = poll.questions[index]

    updateQuestion(index, {
      options: [
        ...question.options,
        { id: null, cells: question.columns.map(() => ({ value: '' })), up_votes: 0, down_votes: 0 },
      ],
    })
  }

  function removeOption(index, optionIndex) {
    const question = poll.questions[index]
    const option = question.options[optionIndex]

    if (option.id) {
      setRemovedOptions((ids) => [...ids, option.id])
    }

    updateQuestion(index, { options: question.options.filter((_, p) => p !== optionIndex) })
  }

  function moveOption(index, optionIndex, offset) {
    const question = poll.questions[index]
    const target = optionIndex + offset

    if (target < 0 || target >= question.options.length) {
      return
    }

    const options = [...question.options]
    ;[options[optionIndex], options[target]] = [options[target], options[optionIndex]]

    updateQuestion(index, { options })
  }

  async function save() {
    setSaving(true)
    setError(null)

    try {
      const payload = {
        title: poll.title.trim(),
        status: poll.status,
        active: poll.active,
        starts_at: fromLocalInput(poll.starts_at),
        closes_at: fromLocalInput(poll.closes_at),
        warn_before_min: Number(poll.warn_before_min) || 0,
        test_mode: poll.test_mode,
        default_view: poll.default_view,
      }

      let pollId = poll.id

      if (pollId) {
        const { error: updateError } = await supabase.from('polls').update(payload).eq('id', pollId)

        if (updateError) {
          setError(`Mentés sikertelen: ${updateError.message}`)
          return
        }
      } else {
        const { data, error: insertError } = await supabase
          .from('polls')
          .insert(payload)
          .select('id')
          .single()

        if (insertError) {
          setError(`Mentés sikertelen: ${insertError.message}`)
          return
        }

        pollId = data.id
      }

      if (removedOptions.length > 0) {
        await supabase.from('poll_options').delete().in('id', removedOptions)
      }

      if (removedQuestions.length > 0) {
        await supabase.from('poll_questions').delete().in('id', removedQuestions)
      }

      for (const [index, question] of poll.questions.entries()) {
        const questionPayload = {
          poll_id: pollId,
          title: question.title.trim(),
          columns: question.columns,
          has_votes: question.has_votes,
          vote_style: question.vote_style,
          allow_suggestions: question.allow_suggestions,
          live_sort: question.live_sort,
          sort_order: index,
        }

        let questionId = question.id

        if (questionId) {
          await supabase.from('poll_questions').update(questionPayload).eq('id', questionId)
        } else {
          const { data } = await supabase
            .from('poll_questions')
            .insert(questionPayload)
            .select('id')
            .single()

          questionId = data.id
        }

        for (const [position, option] of question.options.entries()) {
          if (option.id) {
            await supabase
              .from('poll_options')
              .update({ cells: option.cells, sort_order: position })
              .eq('id', option.id)
          } else {
            await supabase
              .from('poll_options')
              .insert({ question_id: questionId, cells: option.cells, sort_order: position })
          }
        }
      }

      navigate('/admin/szavazas')
    } catch (failure) {
      setError(`Mentés sikertelen: ${failure.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    await supabase.from('polls').delete().eq('id', poll.id)
    navigate('/admin/szavazas')
  }

  const expired = poll.closes_at && new Date(poll.closes_at).getTime() < Date.now()

  return (
    <div className="polled">
      <div className="list-head">
        <div>
          <Link to="/admin/szavazas" className="editor-back">
            Vissza a listához
          </Link>
          <h1>{id ? 'Szavazás szerkesztése' : 'Új szavazás'}</h1>
        </div>

        {canEdit && (
          <div className="list-head-actions">
            <button type="button" className="admin-button" onClick={save} disabled={saving}>
              {saving ? 'Mentés…' : 'Mentés'}
            </button>
          </div>
        )}
      </div>

      {readOnly && <p className="admin-readonly">Demó szerepkörrel csak olvasni tudod.</p>}

      {error && <p className="admin-error">{error}</p>}

      {poll.id && (
        <div className="polled-tools">
          <span>Letöltés:</span>
          {exporters.map((item) => (
            <button
              key={item.label}
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => item.run([toExport(poll)])}
            >
              {item.label}
            </button>
          ))}

          {canEdit && !confirmDelete && (
            <button
              type="button"
              className="polled-danger"
              onClick={() => setConfirmDelete(true)}
            >
              Szavazás törlése
            </button>
          )}

          {confirmDelete && (
            <>
              <button type="button" className="polled-danger" onClick={remove}>
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
          )}
        </div>
      )}

      <div className="polled-group">
        <h2>Beállítások</h2>

        <label className="admin-field">
          <span>A szavazás címe (esemény)</span>
          <input
            type="text"
            value={poll.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="Pl. Magyar Nagydíj"
            disabled={readOnly}
          />
        </label>

        <div className="polled-switch">
          <ToggleSwitch
            checked={poll.active}
            onChange={(next) => update('active', next)}
            label="Megjelenítés a főoldalon"
            disabled={readOnly}
          />
          <span>Megjelenik a főoldalon</span>
        </div>

        <p className="editor-hint">Egyszerre egy szavazás lehet a főoldalon.</p>

        <div className="polled-switch">
          <ToggleSwitch
            checked={poll.test_mode}
            onChange={(next) => update('test_mode', next)}
            label="Teszt mód"
            disabled={readOnly}
          />
          <span>Teszt mód</span>
        </div>

        {poll.test_mode && (
          <p className="editor-hint">
            Teszt módban egy böngészőből korlátlanul lehet szavazni, és a szavazatok nem
            visszavonhatók. Élesben kapcsold ki.
          </p>
        )}

        <div className="polled-fields">
          <label className="admin-field">
            <span>Kezdés</span>
            <input
              type="datetime-local"
              value={poll.starts_at}
              onChange={(event) => update('starts_at', event.target.value)}
              disabled={readOnly}
            />
          </label>

          <label className="admin-field">
            <span>Lezárás</span>
            <input
              type="datetime-local"
              value={poll.closes_at}
              onChange={(event) => update('closes_at', event.target.value)}
              disabled={readOnly}
            />
          </label>

          <label className="admin-field">
            <span>Figyelmeztető popup (perc, 0 = nincs)</span>
            <input
              type="number"
              min="0"
              value={poll.warn_before_min}
              onChange={(event) => update('warn_before_min', event.target.value)}
              disabled={readOnly}
            />
          </label>

          <label className="admin-field">
            <span>Alapértelmezett nézet</span>
            <select
              value={poll.default_view}
              onChange={(event) => update('default_view', event.target.value)}
              disabled={readOnly}
            >
              <option value="percent">Százalék</option>
              <option value="count">Darabszám</option>
            </select>
          </label>
        </div>

        {expired ? (
          <p className="editor-hint">
            A lezárási időpont elmúlt, a szavazás lezárult. Újranyitáshoz töröld vagy told ki a
            lezárás időpontját.
          </p>
        ) : (
          <div className="polled-switch">
            <ToggleSwitch
              checked={poll.status === 'open'}
              onChange={(next) => update('status', next ? 'open' : 'closed')}
              label="A szavazás nyitva van"
              disabled={readOnly}
            />
            <span>{poll.status === 'open' ? 'Nyitott' : 'Lezárva'}</span>
          </div>
        )}
      </div>

      {poll.questions.map((question, index) => (
        <div className="polled-group" key={index}>
          <div className="polled-group-head">
            <h2>{index + 1}. kérdés</h2>

            {canEdit && (
              <div className="polled-rowbtns">
                <button type="button" onClick={() => moveQuestion(index, -1)} disabled={index === 0}>
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(index, 1)}
                  disabled={index === poll.questions.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  disabled={poll.questions.length === 1}
                >
                  Törlés
                </button>
              </div>
            )}
          </div>

          <label className="admin-field">
            <span>Kérdés szövege</span>
            <input
              type="text"
              value={question.title}
              onChange={(event) => updateQuestion(index, { title: event.target.value })}
              placeholder="Pl. Ki volt a hétvége pilótája?"
              disabled={readOnly}
            />
          </label>

          <div className="polled-switch">
            <ToggleSwitch
              checked={question.has_votes}
              onChange={(next) => updateQuestion(index, { has_votes: next })}
              label="Lehet rá szavazni"
              disabled={readOnly}
            />
            <span>Lehet rá szavazni</span>
          </div>

          {question.has_votes && (
            <>
              <label className="admin-field">
                <span>Szavazás módja</span>
                <select
                  value={question.vote_style}
                  onChange={(event) =>
                    updateQuestion(index, {
                      vote_style: event.target.value,
                      live_sort: event.target.value === 'updown' ? question.live_sort : true,
                    })
                  }
                  disabled={readOnly}
                >
                  <option value="updown">Fel és le (▲ / ▼)</option>
                  <option value="simple">Egyszerű (csak ▲)</option>
                </select>
              </label>

              <div className="polled-switch">
                <ToggleSwitch
                  checked={question.live_sort}
                  onChange={(next) => updateQuestion(index, { live_sort: next })}
                  label="Élő rangsor"
                  disabled={readOnly}
                />
                <span>Élő rangsor</span>
              </div>
            </>
          )}

          <div className="polled-switch">
            <ToggleSwitch
              checked={question.allow_suggestions}
              onChange={(next) => updateQuestion(index, { allow_suggestions: next })}
              label="Látogatói javaslatok"
              disabled={readOnly}
            />
            <span>Látogatók javasolhatnak opciót</span>
          </div>

          <div className="polled-sub">
            <div className="polled-group-head">
              <h3>Oszlopok</h3>
              {canEdit && (
                <button type="button" className="polled-add" onClick={() => addColumn(index)}>
                  + Oszlop
                </button>
              )}
            </div>

            {question.columns.map((column, columnIndex) => (
              <div className="polled-line" key={columnIndex}>
                <input
                  type="text"
                  value={column.name}
                  onChange={(event) =>
                    updateQuestion(index, {
                      columns: question.columns.map((item, p) =>
                        p === columnIndex ? { name: event.target.value } : item,
                      ),
                    })
                  }
                  placeholder={`Oszlop ${columnIndex + 1}`}
                  disabled={readOnly}
                />
                {canEdit && question.columns.length > 1 && (
                  <button type="button" onClick={() => removeColumn(index, columnIndex)}>
                    Törlés
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="polled-sub">
            <div className="polled-group-head">
              <h3>Opciók</h3>
              {canEdit && (
                <button type="button" className="polled-add" onClick={() => addOption(index)}>
                  + Opció
                </button>
              )}
            </div>

            {question.options.length === 0 && <p className="list-empty">Még nincs opció.</p>}

            {question.options.map((option, optionIndex) => (
              <div className="polled-option" key={optionIndex}>
                <div className="polled-group-head">
                  <strong>
                    {optionIndex + 1}.
                    {question.has_votes && (
                      <span className="polled-votes">
                        ▲ {option.up_votes} ▼ {option.down_votes}
                      </span>
                    )}
                  </strong>

                  {canEdit && (
                    <div className="polled-rowbtns">
                      <button
                        type="button"
                        onClick={() => moveOption(index, optionIndex, -1)}
                        disabled={optionIndex === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOption(index, optionIndex, 1)}
                        disabled={optionIndex === question.options.length - 1}
                      >
                        ↓
                      </button>
                      <button type="button" onClick={() => removeOption(index, optionIndex)}>
                        Törlés
                      </button>
                    </div>
                  )}
                </div>

                <div className="polled-line">
                  {question.columns.map((column, columnIndex) => (
                    <input
                      key={columnIndex}
                      type="text"
                      value={option.cells[columnIndex]?.value ?? ''}
                      onChange={(event) =>
                        updateQuestion(index, {
                          options: question.options.map((item, p) =>
                            p === optionIndex
                              ? {
                                  ...item,
                                  cells: item.cells.map((cell, c) =>
                                    c === columnIndex ? { value: event.target.value } : cell,
                                  ),
                                }
                              : item,
                          ),
                        })
                      }
                      placeholder={column.name || `Oszlop ${columnIndex + 1}`}
                      disabled={readOnly}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {canEdit && (
        <div className="polled-tools">
          <button type="button" className="admin-button admin-button--ghost" onClick={addQuestion}>
            + Kérdés hozzáadása
          </button>
          <button type="button" className="admin-button" onClick={save} disabled={saving}>
            {saving ? 'Mentés…' : 'Mentés'}
          </button>
        </div>
      )}
    </div>
  )
}
