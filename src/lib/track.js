import { supabase } from './supabase.js'

const endpoint = '/api/track'
const flushDelay = 2000
const batchSize = 20

const supported =
  import.meta.env.PROD && typeof window !== 'undefined' && !navigator.webdriver

let queue = []
let timer = null
let visitor = null
const collectors = new Set()

function send(events) {
  const body = JSON.stringify({ events })

  if (navigator.sendBeacon?.(endpoint, new Blob([body], { type: 'text/plain' }))) {
    return
  }

  fetch(endpoint, {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'Content-Type': 'text/plain' },
  }).catch(() => {})
}

function flush() {
  clearTimeout(timer)
  timer = null

  if (visitor !== true || queue.length === 0) {
    return
  }

  const events = queue
  queue = []

  for (let index = 0; index < events.length; index += batchSize) {
    send(events.slice(index, index + batchSize))
  }
}

function schedule() {
  if (!timer) {
    timer = setTimeout(flush, flushDelay)
  }
}

function leave() {
  for (const collect of collectors) {
    collect()
  }

  if (visitor === null) {
    queue = []
  }

  flush()
}

if (supported) {
  supabase.auth.onAuthStateChange((_event, session) => {
    visitor = !session

    if (visitor) {
      schedule()
    } else {
      queue = []
    }
  })

  window.addEventListener('pagehide', leave)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      leave()
    }
  })
}

export function track(event) {
  if (!supported || visitor === false) {
    return
  }

  queue.push(event)

  if (visitor) {
    schedule()
  }
}

export function onLeave(collect) {
  collectors.add(collect)

  return () => collectors.delete(collect)
}
