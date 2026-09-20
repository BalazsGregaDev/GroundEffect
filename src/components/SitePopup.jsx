import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { pageMatches, privatePrefixes } from '../lib/popupPages.js'
import PopupCard from './PopupCard.jsx'
import './SitePopup.css'

function seenKey(popup) {
  return `ge_popup_${popup.id}_${popup.version}`
}

function isSeen(popup) {
  try {
    return localStorage.getItem(seenKey(popup)) === '1'
  } catch {
    return false
  }
}

function pick(popups, path, dismissed) {
  if (privatePrefixes.some((prefix) => path.startsWith(prefix))) {
    return null
  }

  return (
    popups.find(
      (popup) =>
        !dismissed[popup.id] &&
        pageMatches(popup, path) &&
        !(popup.trigger_kind === 'first_visit' && isSeen(popup)),
    ) ?? null
  )
}

export default function SitePopup() {
  const { pathname } = useLocation()
  const [popups, setPopups] = useState([])
  const [dismissed, setDismissed] = useState({})
  const [shown, setShown] = useState(false)

  useEffect(() => {
    supabase
      .from('site_popups')
      .select('id, trigger_kind, pages, eyebrow, title1, title2, body, button, link, version')
      .eq('enabled', true)
      .order('sort_order')
      .then(({ data }) => setPopups(data ?? []))
  }, [])

  useEffect(() => {
    setDismissed({})
  }, [pathname])

  const current = pick(popups, pathname, dismissed)

  useEffect(() => {
    if (!current) {
      setShown(false)
      return
    }

    const timer = setTimeout(() => setShown(true), 20)
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [current?.id])

  useEffect(() => {
    if (!current) {
      return
    }

    function onKey(event) {
      if (event.key === 'Escape') {
        close()
      }
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  })

  if (!current) {
    return null
  }

  function close() {
    if (current.trigger_kind === 'first_visit') {
      try {
        localStorage.setItem(seenKey(current), '1')
      } catch {
        setShown(false)
      }
    }

    setShown(false)
    const id = current.id
    setTimeout(() => setDismissed((all) => ({ ...all, [id]: true })), 240)
  }

  return (
    <div
      className={shown ? 'popup-backdrop is-shown' : 'popup-backdrop'}
      onClick={close}
      role="presentation"
    >
      <PopupCard popup={current} onClose={close} shown={shown} />
    </div>
  )
}
