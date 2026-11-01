import VoteArrow from './VoteArrow.jsx'
import PollSuggest from './PollSuggest.jsx'
import { OptionName, Score, ShareBar } from './PollParts.jsx'
import { columnNames, optionLabel, rankedOptions } from '../lib/poll.js'

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

export default function PollQuestion({ question, position, view, myVotes, onVote, onSuggest }) {
  const options = rankedOptions(question, question.poll_options, false)
  const names = columnNames(question)
  const updown = question.vote_style !== 'simple'

  return (
    <article className="poll-question">
      {position && <p className="poll-step-count">{position}</p>}
      {question.title && <h3>{question.title}</h3>}

      {options.length === 0 ? (
        <p className="poll-empty">Ehhez a kérdéshez még nincs opció.</p>
      ) : (
        <>
          <div className="poll-opt-head">
            <span>{names.filter(Boolean).join(' · ')}</span>
            {question.has_votes && <span>Szavazat</span>}
          </div>

          <ul className="poll-opts">
            {options.map((option) => (
              <li className="poll-opt" key={option.id}>
                <OptionName option={option} />

                {question.has_votes && (
                  <div className="poll-opt-row">
                    <ShareBar question={question} options={options} option={option} />
                    <Score question={question} option={option} options={options} view={view} />

                    {updown ? (
                      <>
                        <VoteButton direction="up" option={option} mine={myVotes[option.id]} onVote={onVote} />
                        <VoteButton direction="down" option={option} mine={myVotes[option.id]} onVote={onVote} />
                      </>
                    ) : (
                      <SimpleVote option={option} mine={myVotes[option.id]} onVote={onVote} />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {question.allow_suggestions && (
        <PollSuggest key={question.id} question={question} names={names} onSuggest={onSuggest} />
      )}
    </article>
  )
}
