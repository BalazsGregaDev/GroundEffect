import { maxSlices, sliceColor } from '../components/PollPie.jsx'
import { optionLabel, rankedOptions, scoreOf } from '../lib/poll.js'

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
