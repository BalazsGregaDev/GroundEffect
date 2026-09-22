import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SearchField from './SearchField.jsx'
import MenuToggle from './MenuToggle.jsx'
import { useRailStatus } from '../hooks/useRailStatus.js'
import { useSearch } from '../hooks/useSearch.js'
import { useSiteConfig } from '../lib/siteConfig.js'
import { isClosed, isLive } from '../lib/poll.js'
import { seriesShortNames, socialLinks } from '../data/site.js'
import logo from '../assets/logo-kor.jpg'
import './Rail.css'

const tick = 30000

const searchPaths = ['/', '/cikkek']

function pollMeta(poll, now) {
  return isClosed(poll, now) ? 'Lezárult' : 'aktív'
}

function raceMeta(race) {
  if (!race) {
    return null
  }

  return `${seriesShortNames[race.series.slug] ?? race.series.name}:${race.name}`
}

function metaFor(key, poll, race, now) {
  if (key === 'poll') {
    return pollMeta(poll, now)
  }

  if (key === 'calendar') {
    return raceMeta(race)
  }

  if (key === 'articles') {
    return 'friss'
  }

  if (key === 'merch') {
    return 'Bolt'
  }

  return null
}

function navItems(sections, poll, race, now) {
  const live = isLive(poll, now)

  return sections
    .filter((section) => section.nav && section.visible && (section.key !== 'poll' || live))
    .map((section) => ({
      key: section.key,
      ...section.nav,
      meta: metaFor(section.key, poll, race, now),
    }))
}

export default function Rail() {
  const { poll, race } = useRailStatus()
  const { sections } = useSiteConfig()
  const { setQuery, phase } = useSearch()
  const { pathname } = useLocation()
  const [now, setNow] = useState(() => Date.now())
  const [open, setOpen] = useState(false)
  const hasPoll = Boolean(poll)

  useEffect(() => {
    if (!hasPoll) {
      return
    }

    const timer = setInterval(() => setNow(Date.now()), tick)

    return () => clearInterval(timer)
  }, [hasPoll])

  useEffect(() => {
    if (!open) {
      return
    }

    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function leave() {
    setQuery('')
    setOpen(false)
  }

  const searchable = searchPaths.includes(pathname)
  const classes = [
    'rail',
    open && 'rail--open',
    searchable && phase !== 'idle' && 'rail--searching',
    searchable && phase === 'fading' && 'rail--fading',
  ].filter(Boolean)

  return (
    <aside className={classes.join(' ')}>
      <div className="rail-bar">
        <Link className="brand" to="/" onClick={leave}>
          <img className="brand-logo" src={logo} width="48" height="48" alt="" />
          <span>Ground Effect</span>
        </Link>

        <MenuToggle
          open={open}
          controls="rail-panel"
          onToggle={() => setOpen((current) => !current)}
        />
      </div>

      <div className="rail-intro">
        <h1 className="rail-statement">
          Minden,
          <br />
          ami <em>motorsport.</em>
        </h1>
        <p className="rail-sub">
          Kibeszélők, elemzések és podcastok minden versenyhétvége után.
        </p>
      </div>

      <div className="rail-main">
        {searchable && <SearchField />}

        <div className="rail-panel" id="rail-panel">
          <nav>
            <ul>
              {navItems(sections, poll, race, now).map((item) => (
                <li key={item.key}>
                  <Link to={`/${item.href}`} onClick={leave}>
                    {item.label}
                    {item.meta && <span className="nav-meta">{item.meta}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="rail-foot">
            {socialLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
