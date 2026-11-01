import VoteArrow from './VoteArrow.jsx'
import { sharePercent } from '../lib/poll.js'

export function OptionName({ option }) {
  const [first, ...rest] = option.cells.map((cell) => cell.value ?? '').filter(Boolean)

  return (
    <span className="poll-opt-name">
      {first ?? '—'}
      {rest.length > 0 && <span className="poll-opt-extra"> · {rest.join(' · ')}</span>}
    </span>
  )
}

export function ShareBar({ question, options, option }) {
  return (
    <span className="poll-bar">
      <span
        className="poll-bar-fill"
        style={{ width: `${sharePercent(question, options, option)}%` }}
      />
    </span>
  )
}

export function Score({ question, option, options, view }) {
  if (view === 'percent') {
    return <span className="poll-score">{sharePercent(question, options, option)}%</span>
  }

  if (question.vote_style === 'simple') {
    return <span className="poll-score">{option.up_votes}</span>
  }

  return (
    <span className="poll-score">
      <VoteArrow direction="up" />
      <span>{option.up_votes}</span>
      <VoteArrow direction="down" />
      <span>{option.down_votes}</span>
    </span>
  )
}
