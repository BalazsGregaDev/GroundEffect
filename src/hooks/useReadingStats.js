import { useEffect } from 'react'
import { onLeave, track } from '../lib/track.js'

const idleAfter = 30000
const maxSeconds = 3600
const warmup = 5
const milestones = [25, 50, 75, 100]
const activity = ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel']

export function useReadingStats(slug, bodyRef) {
  useEffect(() => {
    if (!slug) {
      return
    }

    track({ type: 'view', slug })

    let pending = 0
    let total = 0
    let lastActive = Date.now()
    const reached = new Set()

    function measure() {
      const body = bodyRef.current

      if (!body || total < warmup || reached.size === milestones.length) {
        return
      }

      const rect = body.getBoundingClientRect()
      const progress = rect.height > 0 ? ((window.innerHeight - rect.top) / rect.height) * 100 : 0

      for (const value of milestones) {
        if (progress >= value && !reached.has(value)) {
          reached.add(value)
          track({ type: 'depth', slug, value })
        }
      }
    }

    function collect() {
      if (pending > 0) {
        track({ type: 'time', slug, seconds: pending })
        pending = 0
      }
    }

    function active() {
      lastActive = Date.now()
    }

    function scrolled() {
      active()
      measure()
    }

    const ticker = setInterval(() => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastActive < idleAfter &&
        total < maxSeconds
      ) {
        pending += 1
        total += 1
        measure()
      }
    }, 1000)

    function visibility() {
      if (document.visibilityState === 'visible') {
        active()
      }
    }

    for (const name of activity) {
      window.addEventListener(name, name === 'scroll' ? scrolled : active, { passive: true })
    }

    document.addEventListener('visibilitychange', visibility)
    const release = onLeave(collect)

    return () => {
      clearInterval(ticker)
      collect()
      release()
      document.removeEventListener('visibilitychange', visibility)

      for (const name of activity) {
        window.removeEventListener(name, name === 'scroll' ? scrolled : active)
      }
    }
  }, [slug, bodyRef])
}
