import { chartColors } from './palette.js'

const [amber, pink, green, violet, coral, blue, orange, teal] = chartColors

const tones = new Map([
  ['f1', coral],
  ['f2', violet],
  ['f3', teal],
  ['motogp', orange],
  ['indycar', blue],
])

const spare = [amber, pink, green]

export const coverWidth = 320
export const coverHeight = 180

export const defaultDesign = {
  tint: 38,
  stripeCount: 3,
  stripeWidth: 11,
  stripeGap: 25,
  stripeLean: 44,
  stripeOpacity: 34,
  stripeStart: 240,
  ruleHeight: 6,
  textInset: 24,
  maxFont: 38,
  fallbackName: 'GroundEffect',
  fallbackTone: amber,
}

const advance = 0.72
const minFont = 20

export function mergeDesign(stored) {
  return { ...defaultDesign, ...stored }
}

export function seriesTone(slug) {
  if (!slug) {
    return null
  }

  const known = tones.get(slug)

  if (known) {
    return known
  }

  let sum = 0

  for (const char of slug) {
    sum = (sum * 31 + char.codePointAt(0)) % 9973
  }

  return spare[sum % spare.length]
}

export function stripePoints(design) {
  const shapes = []

  for (let index = 0; index < design.stripeCount; index += 1) {
    const base = design.stripeStart + index * design.stripeGap
    const top = base + design.stripeLean

    shapes.push(
      `${base},${coverHeight} ${top},0 ${top + design.stripeWidth},0 ` +
        `${base + design.stripeWidth},${coverHeight}`,
    )
  }

  return shapes
}

function room(design) {
  return Math.max(40, design.stripeStart - design.textInset)
}

function wrap(text, design) {
  if (text.length * advance * minFont <= room(design)) {
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

export function coverText(name, design) {
  const label = ((name ?? '').trim() || design.fallbackName).toUpperCase()
  const rows = wrap(label, design)
  const longest = Math.max(...rows.map((row) => row.length))

  return {
    rows,
    size: Math.min(design.maxFont, Math.max(12, room(design) / (longest * advance))),
  }
}
