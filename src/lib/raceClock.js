export function untilParts(startsAt, now) {
  const seconds = Math.max(0, Math.floor((new Date(startsAt).getTime() - now) / 1000))

  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  }
}

function pad(value) {
  return String(value).padStart(2, '0')
}

export function raceCountdown(startsAt, now) {
  const left = untilParts(startsAt, now)
  const clock = `${pad(left.hours)}:${pad(left.minutes)}:${pad(left.seconds)}`

  return left.days > 0 ? `${left.days} nap ${clock}` : clock
}

export function isPast(startsAt, now) {
  return new Date(startsAt).getTime() <= now
}

export function nextSessionIndex(sessions, now) {
  return sessions.findIndex((session) => !isPast(session.starts_at, now))
}

export function racePlace(race) {
  return race.circuit || race.location || race.name
}

const hungarianTime = new Intl.DateTimeFormat('hu-HU', {
  timeZone: 'Europe/Budapest',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function raceMoment(startsAt) {
  return startsAt ? hungarianTime.format(new Date(startsAt)) : null
}
