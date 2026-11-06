export const number = new Intl.NumberFormat('hu-HU')

export function duration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '–'
  }

  const rounded = Math.round(seconds)
  const minutes = Math.floor(rounded / 60)
  const rest = String(rounded % 60).padStart(2, '0')

  return `${minutes}:${rest}`
}

export function share(part, whole) {
  if (!whole) {
    return '–'
  }

  return `${Math.round((part / whole) * 100)}%`
}

export function pivot(events, category) {
  const rows = new Map()

  for (const event of events) {
    if (event.category !== category) {
      continue
    }

    const row = rows.get(event.name) ?? { name: event.name, title: event.title, total: 0, labels: {} }
    const count = Number(event.count)

    row.total += count
    row.labels[event.label] = (row.labels[event.label] ?? 0) + count
    rows.set(event.name, row)
  }

  return [...rows.values()].sort((left, right) => right.total - left.total)
}

export function breakdown(labels, names) {
  return Object.entries(labels)
    .sort((left, right) => right[1] - left[1])
    .map(([key, value]) => `${names[key] ?? (key || 'egyéb')} ${number.format(value)}`)
    .join(' · ')
}
