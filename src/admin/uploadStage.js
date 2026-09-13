export function uploadLabel(stage, idle) {
  if (stage === 'compress') {
    return 'Tömörítés…'
  }

  if (stage === 'upload') {
    return 'Feltöltés…'
  }

  return idle
}
