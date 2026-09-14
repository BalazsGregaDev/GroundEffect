import { useState } from 'react'
import { Link } from 'react-router-dom'
import PollPie from '../components/PollPie.jsx'
import ChoiceSwitch from '../components/ChoiceSwitch.jsx'
import { rankedOptions, sharePercent } from '../lib/poll.js'
import { pieSlices } from './pollPie.js'
import { exporters } from '../lib/pollExport.js'
import { hideAfterHours, toExport } from './pollShape.js'
import '../components/PollSection.css'
import './PollEditor.css'

function shaped(question) {
  return {
    vote_style: question.vote_style,
    has_votes: question.has_votes,
    live_sort: question.live_sort,
    poll_options: question.options,
  }
}

function stamp(value) {
  return value ? new Date(value).toLocaleString('hu-HU') : '—'
}

export default function PollResults({ poll, expired, canEdit, busy, onReopen, onDelete }) {
  const [view, setView] = useState('percent')
  const [mode, setMode] = useState('list')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const facts = [
    ['Cím', poll.title || '—'],
    ['Kezdés', stamp(poll.starts_at)],
    ['Lezárási időpont', stamp(poll.closes_at)],
    ['Lezárult', stamp(poll.closed_at ?? poll.closes_at)],
    ['Főoldalon', poll.active ? 'igen' : 'nem'],
    [
      'Eredmény eltűnése',
      hideAfterHours(poll) === 0 ? 'nem tűnik el magától' : `${hideAfterHours(poll)} óra után`,
    ],
  ]

  return (
    <div className="polled">
      <div className="list-head">
        <div>
          <Link to="/admin/szavazas" className="editor-back">
            Vissza a listához
          </Link>
          <h1>{poll.title || '(cím nélkül)'}</h1>
        </div>
      </div>

      <p className="admin-readonly">
        Ez a szavazás lezárult, ezért csak az eredménye látható. Szerkeszteni újranyitás után lehet.
      </p>

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

        {canEdit && (
          <button type="button" className="admin-button" onClick={onReopen} disabled={busy}>
            Újranyitás
          </button>
        )}

        {canEdit && !confirmDelete && (
          <button type="button" className="polled-danger" onClick={() => setConfirmDelete(true)}>
            Törlés
          </button>
        )}

        {confirmDelete && (
          <>
            <button type="button" className="polled-danger" onClick={onDelete} disabled={busy}>
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

      {canEdit && expired && (
        <p className="editor-hint">
          Az újranyitás a lezárási időpontot is törli, különben azonnal újra lezárulna.
        </p>
      )}

      <div className="polled-group">
        <h2>Adatok</h2>
        <dl className="polled-facts">
          {facts.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="polled-viewswitch">
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
      </div>

      {poll.questions.map((question) => {
        const source = shaped(question)
        const rows = rankedOptions(source, question.options, true)
        const slices = pieSlices(source, true)

        return (
          <details className="polled-result" key={question.id} open>
            <summary>
              <span>{question.title || '(kérdés cím nélkül)'}</span>
              <small>{question.options.length} opció</small>
            </summary>

            {question.options.length === 0 ? (
              <p className="list-empty">Ehhez a kérdéshez nincs opció.</p>
            ) : mode === 'pie' && question.has_votes ? (
              <div className="poll-pie-wrap">
                <PollPie slices={slices} view={view} size={200} />
                <ul className="poll-legend">
                  {slices.map((slice) => (
                    <li key={slice.key}>
                      <span className="poll-swatch" style={{ background: slice.color }} />
                      <span className="poll-legend-name">{slice.label}</span>
                      <span className="poll-legend-value">
                        {view === 'percent' && slice.option
                          ? `${sharePercent(source, rows, slice.option)}%`
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
                                ? `${sharePercent(source, rows, option)}%`
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
          </details>
        )
      })}
    </div>
  )
}
