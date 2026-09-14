import { useEffect, useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import PollQuestion from './PollQuestion.jsx'
import ChoiceSwitch from './ChoiceSwitch.jsx'
import { supabase } from '../lib/supabase.js'
import { useActivePoll } from '../hooks/useActivePoll.js'
import {
  countdown,
  hasStarted,
  humanDuration,
  isClosed,
  isExpired,
  remainingVisible,
} from '../lib/poll.js'
import { readPreference, readVotes, voterId, writePreference, writeVote } from '../lib/pollVoter.js'
import './PollSection.css'

const viewKey = 'ge_poll_view'
const modeKey = 'ge_poll_mode'

export default function PollSection() {
  const { poll, loading, reload } = useActivePoll()
  const [view, setView] = useState(null)
  const [mode, setMode] = useState(() => readPreference(modeKey, 'list'))
  const [myVotes, setMyVotes] = useState(readVotes)
  const [now, setNow] = useState(() => Date.now())
  const [voter] = useState(voterId)

  useEffect(() => {
    if (poll && view === null) {
      setView(readPreference(viewKey, poll.default_view))
    }
  }, [poll, view])

  useEffect(() => {
    if (!poll || (!poll.closes_at && !poll.starts_at)) {
      return
    }

    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [poll?.closes_at, poll?.starts_at])

  if (loading || !poll || !hasStarted(poll, now) || isExpired(poll, now)) {
    return null
  }

  const closed = isClosed(poll, now)
  const remaining = remainingVisible(poll, now)
  const withVotes = poll.poll_questions.some((question) => question.has_votes)

  function chooseView(next) {
    setView(next)
    writePreference(viewKey, next)
  }

  function chooseMode(next) {
    setMode(next)
    writePreference(modeKey, next)
  }

  async function vote(option, direction) {
    if (closed || !voter) {
      return
    }

    const { data } = await supabase.rpc('cast_vote', {
      p_option: option.id,
      p_voter: voter,
      p_dir: direction,
    })

    if (!data || data.status === 'error') {
      return
    }

    if (data.status === 'closed') {
      reload()
      return
    }

    if (!poll.test_mode) {
      setMyVotes(writeVote(option.id, myVotes[option.id] === direction ? null : direction))
    }
  }

  async function suggest(question, cells) {
    const { data } = await supabase.rpc('suggest_option', {
      p_question: question.id,
      p_cells: cells,
    })

    return data?.status ?? 'error'
  }

  return (
    <section className="poll" id="szavazas">
      <SectionTitle>{poll.title || 'Szavazás'}</SectionTitle>

      {!closed && poll.closes_at && (
        <p className="poll-countdown">
          A szavazás zárul: <strong>{countdown(new Date(poll.closes_at).getTime() - now)}</strong>
        </p>
      )}

      {withVotes && (
        <div className="poll-toggles">
          <ChoiceSwitch
            value={view ?? poll.default_view}
            left={{ value: 'count', label: 'Darabszám' }}
            right={{ value: 'percent', label: 'Százalék' }}
            onChange={chooseView}
            label="Százalékos megjelenítés"
          />

          <ChoiceSwitch
            value={mode}
            left={{ value: 'list', label: 'Lista' }}
            right={{ value: 'pie', label: 'Kördiagram' }}
            onChange={chooseMode}
            label="Kördiagram nézet"
          />
        </div>
      )}

      {poll.poll_questions.map((question) => (
        <PollQuestion
          key={question.id}
          question={question}
          closed={closed}
          view={view ?? poll.default_view}
          mode={mode}
          myVotes={myVotes}
          onVote={vote}
          onSuggest={suggest}
        />
      ))}

      {closed && (
        <p className="poll-closed">
          A szavazás lezárult.
          {remaining !== null && ` Az eredmény még ${humanDuration(remaining)} látható itt.`}
        </p>
      )}
    </section>
  )
}
