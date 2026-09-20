export const sections = [
  { key: 'latest', label: 'Legfrissebb adás' },
  { key: 'featured', label: 'Kiemelt cikkek' },
  { key: 'videos', label: 'Korábbi adások', nav: { label: 'Videók', href: '#videok' } },
  { key: 'calendar', label: 'Versenynaptár', nav: { label: 'Versenynaptár', href: '#naptar' } },
  { key: 'articles', label: 'Cikkek', nav: { label: 'Cikkek', href: '#cikkek' } },
  { key: 'poll', label: 'Szavazás', nav: { label: 'Szavazás', href: '#szavazas' } },
  { key: 'merch', label: 'Merch', nav: { label: 'Merch', href: '#merch' } },
  { key: 'facebook', label: 'Facebook' },
  { key: 'community', label: 'Közösség', nav: { label: 'Közösség', href: '#kozosseg' } },
  { key: 'discounts', label: 'Kedvezménykódok' },
]

export const keptWhileSearching = ['community', 'discounts']

export function mergeSections(stored) {
  const known = new Map(sections.map((section) => [section.key, section]))
  const seen = new Set()
  const merged = []

  for (const entry of Array.isArray(stored) ? stored : []) {
    const section = known.get(entry?.key)

    if (section && !seen.has(section.key)) {
      seen.add(section.key)
      merged.push({ ...section, visible: entry.visible !== false })
    }
  }

  for (const section of sections) {
    if (!seen.has(section.key)) {
      merged.push({ ...section, visible: true })
    }
  }

  return merged
}

export function storedSections(list) {
  return list.map((section) => ({ key: section.key, visible: section.visible }))
}
