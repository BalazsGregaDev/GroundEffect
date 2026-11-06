import { useState } from 'react'
import { trackEvent } from '../lib/track.js'
import './ShareBar.css'

export default function ShareBar({ slug, title }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/cikkek/${slug}`
  const native = typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      trackEvent('share', slug, 'copy')
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  async function share() {
    try {
      await navigator.share({ title, url })
      trackEvent('share', slug, 'native')
    } catch {
      return
    }
  }

  return (
    <div className="share" data-track="off">
      <span className="share-label">Megosztás</span>

      <a
        className="share-button"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackEvent('share', slug, 'facebook')}
      >
        Facebook
      </a>

      <button type="button" className="share-button" onClick={copy}>
        {copied ? 'Másolva' : 'Link másolása'}
      </button>

      {native && (
        <button type="button" className="share-button" onClick={share}>
          Továbbküldés
        </button>
      )}
    </div>
  )
}
