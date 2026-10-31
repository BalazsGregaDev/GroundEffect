import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { logEvent } from './adminLog.js'

const writeMethods = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])
const labelLength = 60

function shorten(text) {
  return text.replace(/\s+/g, ' ').trim().slice(0, labelLength)
}

function fieldName(element) {
  const label = element.closest('label')

  if (!label) {
    return shorten(element.getAttribute('aria-label') ?? element.name ?? '')
  }

  return shorten((label.querySelector('span') ?? label).textContent)
}

function describeTarget(url) {
  const parsed = new URL(url, window.location.origin)
  const path = parsed.pathname

  if (path.includes('/rest/v1/rpc/')) {
    return `rpc ${path.split('/rest/v1/rpc/')[1]}`
  }

  if (path.includes('/rest/v1/')) {
    parsed.searchParams.delete('select')

    const query = decodeURIComponent(parsed.searchParams.toString())
    const table = path.split('/rest/v1/')[1]

    return query ? `${table} ${query}` : table
  }

  if (path.includes('/functions/v1/')) {
    return `függvény ${path.split('/functions/v1/')[1]}`
  }

  if (path.includes('/auth/v1/')) {
    return `auth ${path.split('/auth/v1/')[1]}`
  }

  return `${parsed.host}${path}`
}

function isQuiet(method, target, ok) {
  if (!ok) {
    return false
  }

  if (!writeMethods.has(method)) {
    return true
  }

  return target.startsWith('rpc ') || target.startsWith('auth ')
}

function trackRequests() {
  const original = window.fetch

  window.fetch = async (input, init) => {
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
    const target = describeTarget(input instanceof Request ? input.url : String(input))
    const started = performance.now()

    try {
      const response = await original.call(window, input, init)

      if (!isQuiet(method, target, response.ok)) {
        const took = Math.round(performance.now() - started)

        logEvent(
          response.ok ? 'request' : 'error',
          `${method} ${target} → ${response.status} (${took} ms)`,
        )
      }

      return response
    } catch (error) {
      logEvent('error', `${method} ${target} → hálózati hiba: ${error.message}`)
      throw error
    }
  }

  return () => {
    window.fetch = original
  }
}

function trackInteractions() {
  function onClick(event) {
    const element = event.target.closest('button, a, [role="tab"], summary')

    if (!element || element.closest('[data-log="off"]')) {
      return
    }

    const label = shorten(element.getAttribute('aria-label') ?? element.textContent)

    if (label) {
      logEvent('click', label)
    }
  }

  function onChange(event) {
    const element = event.target

    if (element.closest('[data-log="off"]')) {
      return
    }

    if (element.tagName === 'SELECT') {
      logEvent('change', `${fieldName(element)}: ${shorten(element.selectedOptions[0]?.textContent ?? '')}`)
    } else if (element.type === 'checkbox') {
      logEvent('change', `${fieldName(element)}: ${element.checked ? 'be' : 'ki'}`)
    }
  }

  document.addEventListener('click', onClick, true)
  document.addEventListener('change', onChange, true)

  return () => {
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('change', onChange, true)
  }
}

function trackErrors() {
  function onError(event) {
    const place = event.filename ? ` (${event.filename.split('/').pop()}:${event.lineno})` : ''

    logEvent('error', `${event.message}${place}`)
  }

  function onRejection(event) {
    logEvent('error', `Kezeletlen hiba: ${event.reason?.message ?? String(event.reason)}`)
  }

  const shown = new WeakMap()

  const observer = new MutationObserver(() => {
    for (const node of document.querySelectorAll('.admin-error')) {
      const text = node.textContent.trim()

      if (text && shown.get(node) !== text) {
        shown.set(node, text)
        logEvent('error', `Hibaüzenet: ${text}`)
      }
    }
  })

  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })

  return () => {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
    observer.disconnect()
  }
}

export function useAdminLog() {
  const { pathname } = useLocation()

  useEffect(() => {
    const stops = [trackRequests(), trackInteractions(), trackErrors()]

    return () => stops.forEach((stop) => stop())
  }, [])

  useEffect(() => {
    logEvent('page', pathname)
  }, [pathname])
}
