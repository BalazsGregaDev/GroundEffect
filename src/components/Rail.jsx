import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRailStatus } from '../hooks/useRailStatus.js'
import { isClosed, isLive } from '../lib/poll.js'
import { seriesShortNames, socialLinks } from '../data/site.js'
import logo from '../assets/logo-kor.jpg'
import './Rail.css'

const tick = 30000

function pollMeta(poll, now) {
  if (!isLive(poll, now)) {
    return null
  }

  return isClosed(poll, now) ? 'Lezárult' : 'aktív'
}

function raceMeta(race) {
  if (!race) {
    return null
  }

  return `${seriesShortNames[race.series.slug] ?? race.series.name}:${race.name}`
}

function navItems(pollState, nextRace) {
  return [
    { label: 'Videók', href: '#videok' },
    { label: 'Cikkek', href: '#cikkek', meta: 'friss' },
    pollState && { label: 'Szavazás', href: '#szavazas', meta: pollState },
    { label: 'Versenynaptár', href: '#naptar', meta: nextRace },
    { label: 'Merch', href: '#merch', meta: 'Bolt' },
    { label: 'Közösség', href: '#kozosseg' },
  ].filter(Boolean)
}

export default function Rail() {
  const { poll, race } = useRailStatus()
  const [now, setNow] = useState(() => Date.now())
  const hasPoll = Boolean(poll)

  useEffect(() => {
    if (!hasPoll) {
      return
    }

    const timer = setInterval(() => setNow(Date.now()), tick)

    return () => clearInterval(timer)
  }, [hasPoll])

  return (
    <aside className="rail">
      <Link className="brand" to="/">
        <img className="brand-logo" src={logo} width="48" height="48" alt="" />
        <span>Ground Effect</span>
      </Link>

      <div>
        <h1 className="rail-statement">
          Minden,
          <br />
          ami <em>motorsport.</em>
        </h1>
        <p className="rail-sub">
          Kibeszélők, elemzések és podcastok minden versenyhétvége után.
        </p>
      </div>

      <div>
        <nav>
          <ul>
            {navItems(pollMeta(poll, now), raceMeta(race)).map((item) => (
              <li key={item.href}>
                <Link to={`/${item.href}`}>
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
    </aside>
  )
}
