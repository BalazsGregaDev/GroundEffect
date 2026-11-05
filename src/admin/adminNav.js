import { adminAreas } from './permissions.js'

export const adminNav = [
  { path: '/admin', label: 'Áttekintés', end: true },
  ...adminAreas.map((area) => ({ path: area.path, label: area.label, permission: area.key })),
]
