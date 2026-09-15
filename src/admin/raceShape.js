export const sessionKinds = [
  { value: 'practice', label: 'Szabadedzés' },
  { value: 'qualifying', label: 'Időmérő' },
  { value: 'sprint_qualifying', label: 'Sprint időmérő' },
  { value: 'sprint', label: 'Sprintfutam' },
  { value: 'warmup', label: 'Warm-up' },
  { value: 'race', label: 'Futam' },
  { value: 'other', label: 'Egyéb' },
]

export const raceColumns =
  'id, series_id, season, round, name, location, circuit, country, latitude, longitude, ' +
  'starts_at, tbc, note, synced_at, race_sessions (id, kind, label, starts_at)'

export const seriesColumns = 'id, slug, name, source_key, visible, sort_order, synced_at'

export function kindLabel(value) {
  return sessionKinds.find((kind) => kind.value === value)?.label ?? 'Egyéb'
}

export function emptyRace(seriesId, season) {
  return {
    series_id: seriesId ?? '',
    season: season ?? new Date().getFullYear(),
    round: '',
    name: '',
    location: '',
    circuit: '',
    country: '',
    latitude: '',
    longitude: '',
    note: '',
    tbc: false,
    race_sessions: [],
  }
}

export function emptySession() {
  return { kind: 'race', label: 'Futam', starts_at: '' }
}

export function toLocalInput(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const pad = (number) => String(number).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromLocalInput(value) {
  return value ? new Date(value).toISOString() : null
}

export function fromRow(row) {
  return {
    ...row,
    round: row.round ?? '',
    location: row.location ?? '',
    circuit: row.circuit ?? '',
    country: row.country ?? '',
    latitude: row.latitude ?? '',
    longitude: row.longitude ?? '',
    note: row.note ?? '',
    race_sessions: [...(row.race_sessions ?? [])]
      .sort((left, right) => left.starts_at.localeCompare(right.starts_at))
      .map((session) => ({ ...session, starts_at: toLocalInput(session.starts_at) })),
  }
}

export function toRow(race) {
  const number = (value) => (value === '' || value === null ? null : Number(value))

  return {
    series_id: race.series_id,
    season: Number(race.season),
    round: number(race.round),
    name: race.name.trim(),
    location: race.location.trim() || null,
    circuit: race.circuit.trim() || null,
    country: race.country.trim() || null,
    latitude: number(race.latitude),
    longitude: number(race.longitude),
    note: race.note.trim() || null,
    tbc: race.tbc,
  }
}

export function problems(race) {
  const found = []

  if (!race.series_id) {
    found.push('Válassz sorozatot.')
  }

  if (!race.name.trim()) {
    found.push('A futam neve nem lehet üres.')
  }

  if (!Number.isInteger(Number(race.season)) || Number(race.season) < 1900) {
    found.push('A szezon négyjegyű évszám legyen.')
  }

  if (race.race_sessions.length === 0) {
    found.push('Legalább egy esemény kell.')
  }

  if (race.race_sessions.some((session) => !session.label.trim())) {
    found.push('Minden eseménynek kell felirat.')
  }

  if (race.race_sessions.some((session) => !session.starts_at)) {
    found.push('Minden eseménynek kell időpont.')
  }

  return found
}
