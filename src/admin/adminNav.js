export const adminNav = [
  { path: '/admin', label: 'Áttekintés', end: true },
  { path: '/admin/cikkek', label: 'Cikkek' },
  { path: '/admin/videok', label: 'Videók', pending: true },
  { path: '/admin/naptar', label: 'Versenynaptár', pending: true },
  { path: '/admin/szekciok', label: 'Szekciók', pending: true },
  { path: '/admin/szavazas', label: 'Szavazás', pending: true },
  { path: '/admin/popup', label: 'Popup üzenetek', pending: true },
  { path: '/admin/felhasznalok', label: 'Felhasználók', superadminOnly: true },
]
