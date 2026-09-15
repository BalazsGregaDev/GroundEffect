import { useEffect, useState } from 'react'
import Panel from './Panel.jsx'
import { useNextRace } from '../hooks/useNextRace.js'
import './NextRacePanel.css'

function remainingUntil(startsAt) {
  const diff = Math.max(0, new Date(startsAt).getTime() - Date.now())
  const seconds = Math.floor(diff / 1000)

  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  }
}

function pad(value) {
  return String(value).padStart(2, '0')
}

export default function NextRacePanel() {
  const { session, loading } = useNextRace()
  const [left, setLeft] = useState(null)

  useEffect(() => {
    if (!session) {
      return
    }

    setLeft(remainingUntil(session.starts_at))
    const timer = setInterval(() => setLeft(remainingUntil(session.starts_at)), 1000)

    return () => clearInterval(timer)
  }, [session])

  if (loading) {
    return null
  }

  if (!session) {
    return (
      <Panel title="Következő futam">
        <p className="next-empty">A naptár még nincs feltöltve.</p>
      </Panel>
    )
  }

  const place = session.races.location || session.races.circuit

  return (
    <Panel title="Következő futam">
      <p className="next">{session.races.name}</p>
      <p className="next-meta">
        {session.races.race_series.name}
        {place && ` · ${place}`}
        {` · ${session.label}`}
      </p>
      {left && (
        <p className="clock">
          {left.days} : {pad(left.hours)} : {pad(left.minutes)} : {pad(left.seconds)}
        </p>
      )}
      <small>nap · óra · perc · másodperc</small>
    </Panel>
  )
}
