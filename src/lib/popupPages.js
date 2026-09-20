export const publicPages = [
  { path: '/', label: 'Főoldal' },
  { path: '/cikkek', label: 'Cikkek' },
  { path: '/cikkek/*', label: 'Cikkoldalak (mind)' },
  { path: '/merch', label: 'Merch' },
]

export const privatePrefixes = ['/admin']

export function pageMatches(popup, path) {
  if (popup.trigger_kind === 'first_visit') {
    return path === '/'
  }

  const pages = Array.isArray(popup.pages) ? popup.pages : []

  return pages.some((page) => {
    if (page.endsWith('/*')) {
      return path.startsWith(page.slice(0, -1))
    }

    return path === page || path === `${page}/`
  })
}

export function pageLabel(path) {
  return publicPages.find((page) => page.path === path)?.label ?? path
}
