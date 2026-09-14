const voterKey = 'ge_poll_voter'
const votesKey = 'ge_poll_votes'

export function voterId() {
  try {
    const stored = localStorage.getItem(voterKey)

    if (stored) {
      return stored
    }

    const next = crypto.randomUUID()
    localStorage.setItem(voterKey, next)

    return next
  } catch {
    return null
  }
}

export function readVotes() {
  try {
    return JSON.parse(localStorage.getItem(votesKey) ?? '{}')
  } catch {
    return {}
  }
}

export function writeVote(optionId, direction) {
  const votes = readVotes()

  if (direction) {
    votes[optionId] = direction
  } else {
    delete votes[optionId]
  }

  try {
    localStorage.setItem(votesKey, JSON.stringify(votes))
  } catch {
    return votes
  }

  return votes
}

export function readPreference(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function writePreference(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    return
  }
}
