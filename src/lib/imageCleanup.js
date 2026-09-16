const source = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi

export function bodyImages(html) {
  const found = new Set()

  for (const match of String(html ?? '').matchAll(source)) {
    if (match[1].includes('/upload/')) {
      found.add(match[1])
    }
  }

  return [...found]
}

export function droppedImages(before, after) {
  const kept = new Set(bodyImages(after))

  return bodyImages(before).filter((url) => !kept.has(url))
}
