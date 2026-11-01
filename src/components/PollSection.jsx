import { useEffect, useRef, useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import PollQuestion from './PollQuestion.jsx'
import PollStepper from './PollStepper.jsx'
import PollSummary from './PollSummary.jsx'
import ChoiceSwitch from './ChoiceSwitch.jsx'
import VoteArrow from './VoteArrow.jsx'
import { supabase } from '../lib/supabase.js'
import { useActivePoll } from '../hooks/useActivePoll.js'
import { countdown, isClosed, isLive } from '../lib/poll.js'
import { readPreference, readVotes, voterId, writePreference, writeVote } from '../lib/pollVoter.js'
import './PollSection.css'

const viewKey = 'ge_poll_view'
const openKey = 'ge_poll_open'

function doneKey(poll) {
  return `ge_poll_done_${poll.id}`
}

export default function PollSection() {
  const { poll, loading, reload } = useActivePoll()
  const [view, setView] = useState(null)
  const [open, setOpen] = useState(() => readPreference(openKey, 'true') !== 'false')
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(null)
  const [myVotes, setMyVotes] = useState(readVotes)
  const [now, setNow] = useState(() => Date.now())
  const [voter] = useState(voterId)
  const sectionRef = useRef(null)
  const moved = useRef(false)

  useEffect(() => {
    if (poll && view === null) {
      setView(readPreference(viewKey, poll.default_view))
    }
  }, [poll, view])

  useEffect(() => {
    if (poll && done === null) {
      setDone(readPreference(doneKey(poll), '0') === '1')
    }
  }, [poll, done])

  useEffect(() => {
    if (!poll || (!poll.closes_at && !poll.starts_at)) {
      return
    }

    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [poll?.closes_at, poll?.starts_at])

  useEffect(() => {
    if (!moved.current) {
      return
    }

    moved.current = false

    const section = sectionRef.current

    if (section && section.getBoundingClientRect().top < 0) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      section.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' })
    }
  }, [step, done])

  if (loading || !isLive(poll, now)) {
    return null
  }

  const closed = isClosed(poll, now)
  const questions = poll.poll_questions
  const withVotes = questions.some((question) => question.has_votes)
  const current = Math.min(step, questions.length - 1)
  const showSummary = closed || done

  function chooseView(next) {
    setView(next)
    writePreference(viewKey, next)
  }

  function toggleOpen() {
    setStep(0)
    setOpen((value) => {
      writePreference(openKey, !value)
      return !value
    })
  }

  function goTo(index) {
    moved.current = true
    setStep(index)
  }

  function finish() {
    moved.current = true
    writePreference(doneKey(poll), '1')
    setDone(true)
  }

  function edit() {
    moved.current = true
    writePreference(doneKey(poll), '0')
    setStep(0)
    setDone(false)
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
    <section className="poll" id="szavazas" ref={sectionRef}>
      <SectionTitle
        action={
          <button
            type="button"
            className="poll-collapse"
            aria-expanded={open}
            aria-label={open ? 'Szavazás összecsukása' : 'Szavazás lenyitása'}
            onClick={toggleOpen}
          >
            <VoteArrow direction={open ? 'up' : 'down'} />
          </button>
        }
      >
        <button
          type="button"
          className="poll-title-toggle"
          aria-expanded={open}
          onClick={toggleOpen}
        >
          {poll.title || 'Szavazás'}
          {closed && <span className="poll-title-closed"> – Lezárult</span>}
        </button>
      </SectionTitle>

      {!open && (
        <ul className="poll-collapsed">
          {questions.map((question, index) => (
            <li key={question.id}>{question.title || `${index + 1}. kérdés`}</li>
          ))}
        </ul>
      )}

      {open && (
        <div className="poll-body">
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
            </div>
          )}

          {showSummary ? (
            <>
              <PollSummary
                questions={questions}
                view={view ?? poll.default_view}
                closed={closed}
                myVotes={myVotes}
              />

              {!closed && (
                <button type="button" className="poll-edit" onClick={edit}>
                  Szavazataim módosítása
                </button>
              )}
            </>
          ) : (
            questions.length > 0 && (
              <>
                <PollQuestion
                  question={questions[current]}
                  position={questions.length > 1 ? `${current + 1} / ${questions.length}` : null}
                  view={view ?? poll.default_view}
                  myVotes={myVotes}
                  onVote={vote}
                  onSuggest={suggest}
                />

                <PollStepper
                  index={current}
                  total={questions.length}
                  onStep={goTo}
                  onFinish={finish}
                />
              </>
            )
          )}
        </div>
      )}
    </section>
  )
}
