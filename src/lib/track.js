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

function privatePage() {
  return window.location.pathname.startsWith('/admin')
}

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

function device() {
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const shortSide = Math.min(window.screen.width, window.screen.height)

  if (coarse && shortSide < 600) {
    return 'mobile'
  }

  if (coarse && shortSide < 1100) {
    return 'tablet'
  }

  return 'desktop'
}

function referrer() {
  try {
    const { hostname } = new URL(document.referrer)

    return hostname === window.location.hostname ? '' : hostname.replace(/^(www|m|l|lm|mobile)\./, '')
  } catch {
    return ''
  }
}

function outbound(event) {
  const link = event.target.closest?.('a[href]')

  if (!link || privatePage() || link.closest('[data-track="off"]')) {
    return
  }

  let url

  try {
    url = new URL(link.href, window.location.href)
  } catch {
    return
  }

  if (!url.protocol.startsWith('http') || url.hostname === window.location.hostname) {
    return
  }

  const label = link.closest('[data-track]')?.dataset.track ?? ''

  trackEvent('out', url.hostname.replace(/^www\./, ''), label)
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
  document.addEventListener('click', outbound, true)
  document.addEventListener('auxclick', outbound, true)

  if (!privatePage()) {
    queue.push({ type: 'visit', device: device(), ref: referrer() })
  }
}

export function track(event) {
  if (!supported || visitor === false || privatePage()) {
    return
  }

  queue.push(event)

  if (visitor) {
    schedule()
  }
}

export function trackEvent(category, name, label = '') {
  if (name) {
    track({ type: 'event', category, name: String(name), label })
  }
}

export function onLeave(collect) {
  collectors.add(collect)

  return () => collectors.delete(collect)
}
