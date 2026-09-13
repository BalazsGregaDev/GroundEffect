export const statuses = [
  { value: 'draft', label: 'Piszkozat' },
  { value: 'review', label: 'Jóváhagyásra vár' },
  { value: 'published', label: 'Publikált' },
]

export function statusLabel(value) {
  return statuses.find((status) => status.value === value).label
}
