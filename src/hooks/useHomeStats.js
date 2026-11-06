import { useEffect } from 'react'
import { trackEvent } from '../lib/track.js'

const milestones = [25, 50, 75, 100]

export function useHomeStats() {
  useEffect(() => {
    trackEvent('home', 'view')

    const reached = new Set()

    function measure() {
      const height = document.documentElement.scrollHeight
      const progress = height > 0 ? ((window.scrollY + window.innerHeight) / height) * 100 : 0

      for (const value of milestones) {
        if (progress >= (value === 100 ? 98 : value) && !reached.has(value)) {
          reached.add(value)
          trackEvent('home', String(value))
        }
      }

      if (reached.size === milestones.length) {
        window.removeEventListener('scroll', measure)
      }
    }

    window.addEventListener('scroll', measure, { passive: true })

    return () => window.removeEventListener('scroll', measure)
  }, [])
}
