import { useState } from 'react'
import PollPie from './PollPie.jsx'
import { columnNames, optionLabel, pieSlices, rankedOptions, sharePercent } from '../lib/poll.js'

function VoteButtons({ question, option, mine, onVote }) {
  const simple = question.vote_style === 'simple'

  return (
    <span className="poll-vote">
      <button
        type="button"
        className={mine === 'up' ? 'poll-vbtn is-up' : 'poll-vbtn'}
        onClick={() => onVote(option, 'up')}
        aria-label={`${optionLabel(option)} ${simple ? 'szavazat' : 'fel'}`}
        aria-pressed={mine === 'up'}
      >
        ▲
      </button>

      {!simple && (
        <button
          type="button"
          className={mine === 'down' ? 'poll-vbtn is-down' : 'poll-vbtn'}
          onClick={() => onVote(option, 'down')}
          aria-label={`${optionLabel(option)} le`}
          aria-pressed={mine === 'down'}
        >
          ▼
        </button>
      )}
    </span>
  )
}

function score(question, option, options, view) {
  if (view === 'percent') {
    return `${sharePercent(question, options, option)}%`
  }

  return question.vote_style === 'simple'
    ? `▲${option.up_votes}`
    : `▲${option.up_votes} ▼${option.down_votes}`
}

export default function PollQuestion({ question, closed, view, mode, myVotes, onVote, onSuggest }) {
  const [draft, setDraft] = useState([])
  const [state, setState] = useState('idle')

  const options = rankedOptions(question, question.poll_options, closed)
  const names = columnNames(question)
  const showPie = mode === 'pie' && question.has_votes
  const slices = showPie ? pieSlices(question, closed) : []

  async function submit() {
    setState('sending')
    const result = await onSuggest(question, names.map((_, index) => ({ value: (draft[index] ?? '').trim() })))

    if (result === 'ok') {
      setDraft([])
    }

    setState(result)
  }

  return (
    <article className="poll-question">
      {question.title && <h3>{question.title}</h3>}

      {options.length === 0 ? (
        <p className="poll-empty">Ehhez a kérdéshez még nincs opció.</p>
      ) : showPie ? (
        <div className="poll-pie-wrap">
          <PollPie slices={slices} view={view} />

          <ul className="poll-legend">
            {slices.map((slice) => (
              <li key={slice.key}>
                <span className="poll-swatch" style={{ background: slice.color }} />
                <span className="poll-legend-name">{slice.label}</span>
                <span className="poll-legend-value">
                  {slice.option ? score(question, slice.option, options, view) : slice.value}
                </span>
                {!closed && slice.option && (
                  <VoteButtons
                    question={question}
                    option={slice.option}
                    mine={myVotes[slice.option.id]}
                    onVote={onVote}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="poll-table-wrap">
          <table className="poll-table">
            <thead>
              <tr>
                {names.map((name, index) => (
                  <th key={index}>{name}</th>
                ))}
                {question.has_votes && (
                  <th className="poll-result-col">{closed ? 'Eredmény' : 'Szavazat'}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {options.map((option) => (
                <tr key={option.id}>
                  {names.map((_, index) => (
                    <td key={index}>{option.cells[index]?.value ?? ''}</td>
                  ))}
                  {question.has_votes && (
                    <td className="poll-result-col">
                      <div className="poll-result">
                        <span className="poll-score">{score(question, option, options, view)}</span>
                        {!closed && (
                          <VoteButtons
                            question={question}
                            option={option}
                            mine={myVotes[option.id]}
                            onVote={onVote}
                          />
                        )}
                      </div>
                      {question.has_votes && view === 'percent' && (
                        <span className="poll-bar">
                          <span
                            className="poll-bar-fill"
                            style={{ width: `${sharePercent(question, options, option)}%` }}
                          />
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {question.allow_suggestions && !closed && (
        <div className="poll-suggest">
          <span className="poll-suggest-title">Javasolj új opciót</span>

          <div className="poll-suggest-fields">
            {names.map((name, index) => (
              <input
                key={index}
                type="text"
                value={draft[index] ?? ''}
                onChange={(event) =>
                  setDraft((current) => {
                    const next = [...current]
                    next[index] = event.target.value
                    return next
                  })
                }
                placeholder={name || `Oszlop ${index + 1}`}
              />
            ))}

            <button
              type="button"
              onClick={submit}
              disabled={state === 'sending' || !draft.some((value) => (value ?? '').trim())}
            >
              {state === 'sending' ? 'Küldés…' : 'Javaslom'}
            </button>
          </div>

          {state === 'ok' && (
            <p className="poll-suggest-msg">Köszönjük, a javaslat jóváhagyásra vár.</p>
          )}
          {state === 'full' && (
            <p className="poll-suggest-msg is-error">Egyelőre túl sok javaslat vár jóváhagyásra.</p>
          )}
          {state === 'error' && (
            <p className="poll-suggest-msg is-error">A javaslatot nem sikerült elküldeni.</p>
          )}
          {state === 'closed' && (
            <p className="poll-suggest-msg is-error">A szavazás időközben lezárult.</p>
          )}
        </div>
      )}
    </article>
  )
}
