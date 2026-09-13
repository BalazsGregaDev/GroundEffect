const counts = new Intl.NumberFormat('hu-HU', { useGrouping: 'always' })

export function formatCount(value) {
  return counts.format(value)
}

const units = [
  { label: 'éve', ms: 365 * 24 * 60 * 60 * 1000 },
  { label: 'hónapja', ms: 30 * 24 * 60 * 60 * 1000 },
  { label: 'napja', ms: 24 * 60 * 60 * 1000 },
  { label: 'órája', ms: 60 * 60 * 1000 },
  { label: 'perce', ms: 60 * 1000 },
]

export function relativeTime(isoDate) {
  const elapsed = Date.now() - new Date(isoDate).getTime()
  const unit = units.find((candidate) => elapsed >= candidate.ms)

  if (!unit) {
    return 'most'
  }

  return `${Math.floor(elapsed / unit.ms)} ${unit.label}`
}
