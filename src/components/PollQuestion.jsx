import { useState } from 'react'
import VoteArrow from './VoteArrow.jsx'
import { columnNames, optionLabel, rankedOptions, sharePercent } from '../lib/poll.js'

function VoteButton({ direction, option, mine, onVote }) {
  const active = mine === direction

  return (
    <button
      type="button"
      className={`poll-vbtn poll-vbtn--${direction}${active ? ' is-mine' : ''}`}
      onClick={() => onVote(option, direction)}
      aria-label={`${optionLabel(option)} ${direction === 'up' ? 'felfelé' : 'lefelé'}`}
      aria-pressed={active}
    >
      <VoteArrow direction={direction} />
    </button>
  )
}

function SimpleVote({ option, mine, onVote }) {
  return (
    <button
      type="button"
      className={mine === 'up' ? 'poll-simple-vote is-mine' : 'poll-simple-vote'}
      onClick={() => onVote(option, 'up')}
      aria-label={`Szavazat erre: ${optionLabel(option)}`}
      aria-pressed={mine === 'up'}
    >
      Szavazok
    </button>
  )
}

function score(question, option, options, view) {
  if (view === 'percent') {
    return `${sharePercent(question, options, option)}%`
  }

  return question.vote_style === 'simple'
    ? `↑${option.up_votes}`
    : `↑${option.up_votes} ↓${option.down_votes}`
}

export default function PollQuestion({ question, closed, view, myVotes, onVote, onSuggest }) {
  const [draft, setDraft] = useState([])
  const [state, setState] = useState('idle')

  const options = rankedOptions(question, question.poll_options, closed)
  const names = columnNames(question)
  const updown = question.vote_style !== 'simple'

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
                        {!closed && updown && (
                          <VoteButton
                            direction="up"
                            option={option}
                            mine={myVotes[option.id]}
                            onVote={onVote}
                          />
                        )}

                        <span className="poll-bar">
                          <span
                            className="poll-bar-fill"
                            style={{ width: `${sharePercent(question, options, option)}%` }}
                          />
                        </span>
                        <span className="poll-score">{score(question, option, options, view)}</span>

                        {!closed && updown && (
                          <VoteButton
                            direction="down"
                            option={option}
                            mine={myVotes[option.id]}
                            onVote={onVote}
                          />
                        )}

                        {!closed && !updown && (
                          <SimpleVote
                            option={option}
                            mine={myVotes[option.id]}
                            onVote={onVote}
                          />
                        )}
                      </div>
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
