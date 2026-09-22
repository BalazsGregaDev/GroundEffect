import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const attempts = 20
const gap = 100
const settleTicks = 20
const settleGap = 120
const tolerance = 2
const steadyNeeded = 3

export default function HashScroll() {
  const { hash, key } = useLocation()

  useEffect(() => {
    if (!hash) {
      return
    }

    const id = decodeURIComponent(hash.slice(1))
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let left = attempts
    let ticks = settleTicks
    let steady = 0
    let timer = null
    let stopped = false

    function stop() {
      stopped = true
      clearTimeout(timer)
    }

    function drift(target) {
      const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0

      return target.getBoundingClientRect().top - margin
    }

    function settle() {
      if (stopped) {
        return
      }

      const target = document.getElementById(id)

      if (!target) {
        return
      }

      const distance = drift(target)

      if (Math.abs(distance) <= tolerance) {
        steady += 1
      } else {
        steady = 0
        window.scrollBy({ top: distance, behavior: 'auto' })
      }

      ticks -= 1

      if (ticks > 0 && steady < steadyNeeded) {
        timer = setTimeout(settle, settleGap)
      }
    }

    function reach() {
      const target = document.getElementById(id)

      if (target) {
        target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
        timer = setTimeout(settle, smooth ? 500 : settleGap)
        return
      }

      left -= 1

      if (left > 0) {
        timer = setTimeout(reach, gap)
      }
    }

    reach()

    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    window.addEventListener('keydown', stop)

    return () => {
      stop()
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('keydown', stop)
    }
  }, [hash, key])

  return null
}
