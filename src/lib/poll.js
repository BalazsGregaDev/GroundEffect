import { maxSlices, sliceColor } from '../components/PollPie.jsx'

export function columnNames(question) {
  return question.columns.map((column) => column.name ?? '')
}

export function optionLabel(option) {
  return (
    option.cells
      .map((cell) => cell.value ?? '')
      .filter(Boolean)
      .join(' – ') || '—'
  )
}

export function scoreOf(question, option) {
  return question.vote_style === 'simple'
    ? option.up_votes
    : option.up_votes - option.down_votes
}

export function totalScore(question, options) {
  return options.reduce((sum, option) => sum + Math.max(0, scoreOf(question, option)), 0)
}

export function sharePercent(question, options, option) {
  const total = totalScore(question, options)

  return total === 0 ? 0 : Math.round((Math.max(0, scoreOf(question, option)) / total) * 100)
}

export function canReorder(question) {
  return question.has_votes && question.vote_style === 'updown'
}

export function rankedOptions(question, options, closed) {
  if (!canReorder(question) || !(question.live_sort || closed)) {
    return options
  }

  return [...options].sort((left, right) => scoreOf(question, right) - scoreOf(question, left))
}

export const restColor = '#8a8a8a'

export function pieSlices(question, closed) {
  const source = question.poll_options
  const colors = new Map(source.map((option, index) => [option.id, sliceColor(index)]))
  const ordered = rankedOptions(question, source, closed)

  const toSlice = (option) => ({
    key: option.id,
    label: optionLabel(option),
    value: Math.max(0, scoreOf(question, option)),
    color: colors.get(option.id),
    option,
  })

  if (ordered.length <= maxSlices) {
    return ordered.map(toSlice)
  }

  const rest = ordered.slice(maxSlices - 1)

  return [
    ...ordered.slice(0, maxSlices - 1).map(toSlice),
    {
      key: 'rest',
      label: `Egyéb (${rest.length})`,
      value: rest.reduce((sum, option) => sum + Math.max(0, scoreOf(question, option)), 0),
      color: restColor,
      option: null,
    },
  ]
}

export function isClosed(poll, now) {
  return poll.status === 'closed' || (poll.closes_at && new Date(poll.closes_at).getTime() <= now)
}

export function hasStarted(poll, now) {
  return !poll.starts_at || new Date(poll.starts_at).getTime() <= now
}

export function closedMoment(poll) {
  const stamp = poll.closed_at ?? poll.closes_at

  return stamp ? new Date(stamp).getTime() : null
}

export function isExpired(poll, now) {
  if (!isClosed(poll, now) || poll.hide_after_hours === 0) {
    return false
  }

  const moment = closedMoment(poll)

  return moment !== null && now >= moment + poll.hide_after_hours * 3600000
}

export function countdown(ms) {
  if (ms <= 0) {
    return 'lezárult'
  }

  const seconds = Math.floor(ms / 1000)
  const days = Math.floor(seconds / 86400)
  const pad = (value) => String(value).padStart(2, '0')
  const clock = `${pad(Math.floor((seconds % 86400) / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`

  return days > 0 ? `${days} nap ${clock}` : clock
}
