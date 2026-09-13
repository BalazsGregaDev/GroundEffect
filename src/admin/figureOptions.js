export const ratios = [
  { value: '16-9', label: '16:9' },
  { value: '4-3', label: '4:3' },
]

export const orientations = [
  { value: 'fekvo', label: 'Fektetett' },
  { value: 'allo', label: 'Álló' },
]

export const sizes = [
  { value: 'kicsi', label: 'Kicsi', width: 35 },
  { value: 'kozepes', label: 'Közepes', width: 50 },
  { value: 'nagy', label: 'Nagy', width: 75 },
  { value: 'teljes', label: 'Teljes szélesség', width: 100 },
]

export const focusPoints = [
  { value: 'auto', label: 'Automatikus' },
  { value: 'center', label: 'Középre' },
  { value: 'north', label: 'Felső rész' },
  { value: 'south', label: 'Alsó rész' },
  { value: 'west', label: 'Bal oldal' },
  { value: 'east', label: 'Jobb oldal' },
]

export const defaultFigure = {
  ratio: '16-9',
  orientation: 'fekvo',
  size: 'kozepes',
  caption: '',
  wrap: false,
}

export function aspectRatio(ratio, orientation) {
  const [wide, tall] = ratio.split('-')

  return orientation === 'allo' ? `${tall} / ${wide}` : `${wide} / ${tall}`
}

export function sizeWidth(size) {
  return sizes.find((option) => option.value === size).width
}
