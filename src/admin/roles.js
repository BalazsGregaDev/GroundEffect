export const adminRoles = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'admin', label: 'Szerkesztő' },
  { value: 'demo', label: 'Demó, csak olvasás' },
]

export function roleLabel(value) {
  return adminRoles.find((role) => role.value === value).label
}
