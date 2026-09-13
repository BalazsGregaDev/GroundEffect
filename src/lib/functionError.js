export async function functionErrorMessage(error, fallback) {
  const response = error.context

  if (typeof response?.json !== 'function') {
    return error.message || fallback
  }

  const detail = await response.json().catch(() => null)

  return detail?.error ?? fallback
}
