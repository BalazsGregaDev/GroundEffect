import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useActivePoll } from '../hooks/useActivePoll.js'
import { hasStarted, optionLabel, scoreOf } from '../lib/poll.js'
import { readPreference, writePreference } from '../lib/pollVoter.js'
import './PollWarning.css'

const topCount = 3

export default function PollWarning() {
  const { poll } = useActivePoll()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [now, setNow] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!poll?.closes_at || !poll.warn_before_min) {
      return
    }

    if (readPreference(`ge_poll_warned_${poll.id}`, '') === '1') {
      setDismissed(true)
      return
    }

    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [poll?.id, poll?.closes_at, poll?.warn_before_min])

  if (!poll || dismissed || !poll.closes_at || !poll.warn_before_min) {
    return null
  }

  const closesAt = new Date(poll.closes_at).getTime()
  const opensAt = closesAt - poll.warn_before_min * 60000

  if (poll.status === 'closed' || !hasStarted(poll, now) || now < opensAt || now >= closesAt) {
    return null
  }

  function close() {
    writePreference(`ge_poll_warned_${poll.id}`, '1')
    setDismissed(true)
  }

  function goVote() {
    close()

    if (pathname === '/') {
      document.getElementById('szavazas').scrollIntoView({ behavior: 'smooth' })
      return
    }

    navigate('/#szavazas')
  }

  const question = poll.poll_questions.find((item) => item.has_votes && item.poll_options.length > 0)

  const leaders = question
    ? [...question.poll_options]
        .sort((left, right) => scoreOf(question, right) - scoreOf(question, left))
        .slice(0, topCount)
    : []

  return (
    <div className="pollwarn-backdrop" onMouseDown={close} role="dialog" aria-modal="true">
      <div className="pollwarn-panel" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="pollwarn-close" onClick={close} aria-label="Bezárás">
          ×
        </button>

        <span className="pollwarn-eyebrow">Hamarosan zárul</span>
        <h2>{poll.title || 'Szavazás'}</h2>

        {question?.title && <p className="pollwarn-question">{question.title}</p>}

        {leaders.length > 0 && (
          <ol className="pollwarn-list">
            {leaders.map((option, index) => (
              <li key={option.id}>
                <span>
                  {index + 1}. {optionLabel(option)}
                </span>
                <strong>
                  {question.vote_style === 'simple'
                    ? `▲${option.up_votes}`
                    : `▲${option.up_votes} ▼${option.down_votes}`}
                </strong>
              </li>
            ))}
          </ol>
        )}

        <div className="pollwarn-actions">
          <button type="button" className="pollwarn-primary" onClick={goVote}>
            Szavazok
          </button>
          <button type="button" className="pollwarn-ghost" onClick={close}>
            Bezárás
          </button>
        </div>
      </div>
    </div>
  )
}
