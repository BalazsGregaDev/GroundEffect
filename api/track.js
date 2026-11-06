export const config = { runtime: 'edge' }

const bots = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor/i
const maxEvents = 20
const maxBody = 8000

function slug(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 && !/[\s/?#]/.test(value)
    ? value
    : null
}

function whole(value, min, max) {
  const number = Math.round(Number(value))

  return Number.isFinite(number) ? Math.min(Math.max(number, min), max) : null
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const eventRules = {
  video: { name: /^[\w-]{6,20}$/, labels: ['latest', 'grid', 'search'] },
  out: { name: /^[a-z0-9.-]{1,100}$/, labels: null },
  coupon: { name: /^.{1,60}$/u, labels: [''] },
  popup: { name: uuid, labels: ['shown', 'closed', 'clicked'] },
  poll: { name: uuid, labels: ['shown', 'opened', 'voted', 'finished', 'suggested'] },
  section: { name: /^[a-z0-9-]{1,40}$/, labels: ['nav', 'menu'] },
  home: { name: /^(view|25|50|75|100)$/, labels: [''] },
  share: { name: /^[^\s/?#]{1,200}$/, labels: ['facebook', 'copy', 'native'] },
  notfound: { name: /^\/[^\s]{0,119}$/, labels: [''] },
}

const devices = ['mobile', 'tablet', 'desktop']

function plain(value, max) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : ''
}

function clean(event) {
  if (!event || typeof event !== 'object') {
    return null
  }

  switch (event.type) {
    case 'view':
      return slug(event.slug) && { type: 'view', slug: event.slug }

    case 'time': {
      const seconds = whole(event.seconds, 0, 3600)

      return slug(event.slug) && seconds > 0 && { type: 'time', slug: event.slug, seconds }
    }

    case 'depth':
      return (
        slug(event.slug) &&
        [25, 50, 75, 100].includes(event.value) && { type: 'depth', slug: event.slug, value: event.value }
      )

    case 'rec':
      return (
        slug(event.slug) &&
        slug(event.to) &&
        ['latest', 'related'].includes(event.slot) && {
          type: 'rec',
          slug: event.slug,
          to: event.to,
          slot: event.slot,
        }
      )

    case 'visit': {
      const ref = plain(event.ref, 80).toLowerCase()

      return {
        type: 'visit',
        device: devices.includes(event.device) ? event.device : null,
        ref: /^[a-z0-9.-]+$/.test(ref) ? ref : '',
      }
    }

    case 'event': {
      const rule = eventRules[event.category]
      const name = plain(event.name, 120)
      const label = plain(event.label, 40)

      if (!rule || !rule.name.test(name) || (rule.labels && !rule.labels.includes(label))) {
        return null
      }

      return { type: 'event', category: event.category, name, label }
    }

    case 'search': {
      const q = typeof event.q === 'string' ? event.q.trim().toLowerCase().slice(0, 60) : ''
      const n = whole(event.n, 0, 1000)

      return (
        q.length >= 3 &&
        n !== null &&
        ['home', 'archive'].includes(event.scope) && { type: 'search', q, n, scope: event.scope }
      )
    }

    default:
      return null
  }
}

function done(status = 204) {
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } })
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'POST' } })
  }

  const site = request.headers.get('sec-fetch-site')

  if ((site && site !== 'same-origin') || bots.test(request.headers.get('user-agent') ?? '')) {
    return done()
  }

  const raw = await request.text()

  if (raw.length > maxBody) {
    return done(413)
  }

  let body

  try {
    body = JSON.parse(raw)
  } catch {
    return done(400)
  }

  const events = (Array.isArray(body?.events) ? body.events : [])
    .slice(0, maxEvents)
    .map(clean)
    .filter(Boolean)

  if (events.length === 0) {
    return done()
  }

  const key = process.env.VITE_SUPABASE_ANON_KEY
  const payload = { p_events: events }

  if (events.some((event) => event.type === 'visit')) {
    const address =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      ''

    if (address) {
      payload.p_client = `${address} ${(request.headers.get('user-agent') ?? '').slice(0, 300)}`
    }
  }

  try {
    await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/track_events`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    return done()
  }

  return done()
}
