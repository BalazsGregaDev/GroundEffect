import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import PollPie from '../components/PollPie.jsx'
import ChoiceSwitch from '../components/ChoiceSwitch.jsx'
import { fromRow, pollColumns, toExport } from './pollShape.js'
import { exporters } from '../lib/pollExport.js'
import { rankedOptions, sharePercent } from '../lib/poll.js'
import { pieSlices } from './pollPie.js'
import '../components/PollSection.css'
import './PollStats.css'

const maxCompared = 4

function asQuestion(question) {
  return {
    vote_style: question.vote_style,
    has_votes: question.has_votes,
    live_sort: true,
    poll_options: question.options,
  }
}

export default function PollStats() {
  const [available, setAvailable] = useState([])
  const [chosen, setChosen] = useState([])
  const [view, setView] = useState('percent')
  const [mode, setMode] = useState('list')

  useEffect(() => {
    supabase
      .from('polls')
      .select('id, title')
      .order('created_at', { ascending: false })
      .then(({ data }) => setAvailable(data ?? []))
  }, [])

  async function add(id) {
    if (!id || chosen.length >= maxCompared) {
      return
    }

    const { data } = await supabase.from('polls').select(pollColumns).eq('id', id).single()

    if (data) {
      setChosen((current) => [...current, fromRow(data)])
    }
  }

  function remove(id) {
    setChosen((current) => current.filter((poll) => poll.id !== id))
  }

  const options = available.filter((poll) => !chosen.some((item) => item.id === poll.id))

  return (
    <div className="pollstats">
      <h2>Statisztika és összehasonlítás</h2>

      <p className="editor-hint">
        Legfeljebb {maxCompared} szavazást tehetsz egymás mellé. A letöltés a kiválasztottakat
        tartalmazza.
      </p>

      <div className="pollstats-controls">
        <select value="" onChange={(event) => add(event.target.value)} disabled={chosen.length >= maxCompared}>
          <option value="">
            {chosen.length >= maxCompared ? 'Elérted a négyet' : 'Szavazás hozzáadása…'}
          </option>
          {options.map((poll) => (
            <option key={poll.id} value={poll.id}>
              {poll.title || '(cím nélkül)'}
            </option>
          ))}
        </select>

        {chosen.length > 0 && (
          <>
            <ChoiceSwitch
              value={view}
              left={{ value: 'count', label: 'Darabszám' }}
              right={{ value: 'percent', label: 'Százalék' }}
              onChange={setView}
              label="Százalékos megjelenítés"
            />

            <ChoiceSwitch
              value={mode}
              left={{ value: 'list', label: 'Lista' }}
              right={{ value: 'pie', label: 'Kördiagram' }}
              onChange={setMode}
              label="Kördiagram nézet"
            />

            {exporters.map((item) => (
              <button
                key={item.label}
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => item.run(chosen.map(toExport))}
              >
                {item.label}
              </button>
            ))}
          </>
        )}
      </div>

      {chosen.length === 0 ? (
        <p className="list-empty">Nincs kiválasztott szavazás.</p>
      ) : (
        <div className="pollstats-grid">
          {chosen.map((poll) => (
            <article className="pollstats-card" key={poll.id}>
              <div className="pollstats-head">
                <span>{poll.title || '(cím nélkül)'}</span>
                <button type="button" onClick={() => remove(poll.id)} aria-label="Eltávolítás">
                  ×
                </button>
              </div>

              {poll.questions.map((question) => {
                const shaped = asQuestion(question)
                const rows = rankedOptions(shaped, question.options, true)
                const slices = pieSlices(shaped, true)

                return (
                  <div className="pollstats-question" key={question.id}>
                    <h4>{question.title || '(kérdés cím nélkül)'}</h4>

                    {mode === 'pie' && question.has_votes ? (
                      <div className="poll-pie-wrap">
                        <PollPie slices={slices} view={view} size={180} />
                        <ul className="poll-legend">
                          {slices.map((slice) => (
                            <li key={slice.key}>
                              <span className="poll-swatch" style={{ background: slice.color }} />
                              <span className="poll-legend-name">{slice.label}</span>
                              <span className="poll-legend-value">
                                {view === 'percent' && slice.option
                                  ? `${sharePercent(shaped, rows, slice.option)}%`
                                  : slice.value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="poll-table-wrap">
                        <table className="poll-table">
                          <thead>
                            <tr>
                              {question.columns.map((column, index) => (
                                <th key={index}>{column.name}</th>
                              ))}
                              {question.has_votes && <th className="poll-result-col">Eredmény</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((option) => (
                              <tr key={option.id}>
                                {question.columns.map((_, index) => (
                                  <td key={index}>{option.cells[index]?.value ?? ''}</td>
                                ))}
                                {question.has_votes && (
                                  <td className="poll-result-col">
                                    <span className="poll-score">
                                      {view === 'percent'
                                        ? `${sharePercent(shaped, rows, option)}%`
                                        : question.vote_style === 'simple'
                                          ? `▲${option.up_votes}`
                                          : `▲${option.up_votes} ▼${option.down_votes}`}
                                    </span>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {rows.length === 0 && <p className="list-empty">Ehhez nincs opció.</p>}
                  </div>
                )
              })}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
