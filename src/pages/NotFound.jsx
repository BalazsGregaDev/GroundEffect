import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { trackEvent } from '../lib/track.js'
import './NotFound.css'

export function useNotFound(path) {
  useEffect(() => {
    trackEvent('notfound', path.slice(0, 120))
  }, [path])
}

export default function NotFound() {
  const { pathname } = useLocation()

  useNotFound(pathname)

  return (
    <div className="notfound">
      <h1>Ez az oldal nem található</h1>
      <p>Lehet, hogy elírás van a címben, vagy az oldal már nem létezik.</p>
      <Link to="/">Vissza a főoldalra</Link>
    </div>
  )
}
