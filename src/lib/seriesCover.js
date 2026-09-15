import { chartColors } from './palette.js'

const [amber, pink, green, violet, coral, blue, orange, teal] = chartColors

const tones = new Map([
  ['f1', coral],
  ['f2', violet],
  ['f3', teal],
  ['motogp', orange],
  ['indycar', blue],
  ['groundeffect', amber],
])

const spare = [amber, pink, green]

const fallbackName = 'GroundEffect'

export const inset = 24

const stripeStart = 240
const room = stripeStart - inset
const advance = 0.72
const maxSize = 38
const minSize = 20

export function seriesTone(slug) {
  const known = tones.get(slug)

  if (known) {
    return known
  }

  let sum = 0

  for (const char of slug ?? '') {
    sum = (sum * 31 + char.codePointAt(0)) % 9973
  }

  return spare[sum % spare.length]
}

function wrap(text) {
  if (text.length * advance * minSize <= room) {
    return [text]
  }

  const words = text.split(' ')

  if (words.length < 2) {
    return [text]
  }

  let best = null

  for (let cut = 1; cut < words.length; cut += 1) {
    const rows = [words.slice(0, cut).join(' '), words.slice(cut).join(' ')]
    const longest = Math.max(rows[0].length, rows[1].length)

    if (!best || longest < best.longest) {
      best = { rows, longest }
    }
  }

  return best.rows
}

export function coverText(name) {
  const rows = wrap(((name ?? '').trim() || fallbackName).toUpperCase())
  const longest = Math.max(...rows.map((row) => row.length))

  return { rows, size: Math.min(maxSize, Math.max(12, room / (longest * advance))) }
}
