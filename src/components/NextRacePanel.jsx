import { useEffect, useState } from 'react'
import Panel from './Panel.jsx'
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

export default function NextRacePanel({ race }) {
  const [left, setLeft] = useState(() => remainingUntil(race.startsAt))

  useEffect(() => {
    const timer = setInterval(() => setLeft(remainingUntil(race.startsAt)), 1000)
    return () => clearInterval(timer)
  }, [race.startsAt])

  return (
    <Panel title="Következő futam">
      <p className="next">{race.name}</p>
      <p className="clock">
        {left.days} : {pad(left.hours)} : {pad(left.minutes)} : {pad(left.seconds)}
      </p>
      <small>nap · óra · perc · másodperc</small>
    </Panel>
  )
}
