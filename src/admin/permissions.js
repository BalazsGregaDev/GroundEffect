export const adminAreas = [
  {
    key: 'articles',
    label: 'Cikkek',
    path: '/admin/cikkek',
    extra: { key: 'articles.publish', label: 'Publikálás' },
  },
  { key: 'videos', label: 'Videók', path: '/admin/videok' },
  { key: 'facebook', label: 'Facebook poszt', path: '/admin/facebook' },
  { key: 'calendar', label: 'Versenynaptár', path: '/admin/naptar' },
  { key: 'covers', label: 'Borítóképek', path: '/admin/boritokepek' },
  { key: 'merch', label: 'Merch', path: '/admin/merch' },
  { key: 'sections', label: 'Szekciók', path: '/admin/szekciok' },
  {
    key: 'polls',
    label: 'Szavazás',
    path: '/admin/szavazas',
    extra: { key: 'polls.edit', label: 'Szerkesztés' },
  },
  { key: 'popups', label: 'Popup üzenetek', path: '/admin/popup' },
  {
    key: 'users',
    label: 'Felhasználók',
    path: '/admin/felhasznalok',
    extra: { key: 'users.roles', label: 'Szerepkörök' },
  },
]

export const permissionKeys = adminAreas.flatMap((area) =>
  area.extra ? [area.key, area.extra.key] : [area.key],
)

export function normalizePermissions(list) {
  const chosen = new Set(list)

  return permissionKeys.filter(
    (key) => chosen.has(key) && (!key.includes('.') || chosen.has(key.split('.')[0])),
  )
}

export function withinReach(access, role) {
  if (access.role === 'superadmin') {
    return true
  }

  return (
    !access.readOnly &&
    !role.read_only &&
    role.permissions.every((permission) => access.permissions.includes(permission))
  )
}

export function byStrength(left, right) {
  if (left.key === 'superadmin' || right.key === 'superadmin') {
    return left.key === 'superadmin' ? -1 : 1
  }

  return right.permissions.length - left.permissions.length || left.name.localeCompare(right.name, 'hu')
}
