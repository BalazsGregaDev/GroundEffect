export const adminNav = [
  { path: '/admin', label: 'Áttekintés', end: true },
  { path: '/admin/cikkek', label: 'Cikkek' },
  { path: '/admin/videok', label: 'Videók' },
  { path: '/admin/facebook', label: 'Facebook poszt' },
  { path: '/admin/naptar', label: 'Versenynaptár', pending: true },
  { path: '/admin/szekciok', label: 'Szekciók', pending: true },
  { path: '/admin/szavazas', label: 'Szavazás' },
  { path: '/admin/popup', label: 'Popup üzenetek', pending: true },
  { path: '/admin/felhasznalok', label: 'Felhasználók', superadminOnly: true },
]
