const storageKey = 'ge_admin_log'
const limit = 200
const messageLength = 300

export const logKinds = {
  page: 'Oldal',
  click: 'Kattintás',
  change: 'Módosítás',
  request: 'Kérés',
  error: 'Hiba',
}

function read() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey))

    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function write(entries) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries))
  } catch {
    return
  }
}

export function logEvent(kind, message) {
  const entry = {
    at: new Date().toISOString(),
    kind,
    message: String(message).replace(/\s+/g, ' ').trim().slice(0, messageLength),
  }

  write([...read(), entry].slice(-limit))
}

export function readLog() {
  return read()
}
