import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const attempts = 20
const gap = 100

export default function HashScroll() {
  const { hash, key } = useLocation()

  useEffect(() => {
    if (!hash) {
      return
    }

    const id = decodeURIComponent(hash.slice(1))
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let left = attempts
    let timer = null

    function reach() {
      const target = document.getElementById(id)

      if (target) {
        target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
        return
      }

      left -= 1

      if (left > 0) {
        timer = setTimeout(reach, gap)
      }
    }

    reach()

    return () => clearTimeout(timer)
  }, [hash, key])

  return null
}
