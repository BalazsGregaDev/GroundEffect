export const minChars = 3
export const searchDebounce = 250

export function searchWords(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

export function isSearching(query) {
  return query.trim().length >= minChars
}
