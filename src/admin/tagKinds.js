export const tagKinds = [
  { value: 'driver', label: 'Pilóta' },
  { value: 'team', label: 'Csapat' },
  { value: 'principal', label: 'Csapatfőnök' },
  { value: 'circuit', label: 'Pálya' },
  { value: 'country', label: 'Ország' },
  { value: 'series', label: 'Versenysorozat' },
  { value: 'other', label: 'Egyéb' },
]

export function kindLabel(kind) {
  return tagKinds.find((item) => item.value === kind)?.label ?? 'Egyéb'
}
