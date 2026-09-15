import { useEffect, useState } from 'react'
import SectionTitle from './SectionTitle.jsx'
import NextRaceCard from './NextRaceCard.jsx'
import NextSessionsCard from './NextSessionsCard.jsx'
import { useRaceCalendar } from '../hooks/useRaceCalendar.js'
import './RaceCalendarSection.css'

export default function RaceCalendarSection() {
  const { series, loading } = useRaceCalendar()
  const [now, setNow] = useState(() => Date.now())
  const [chosen, setChosen] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(timer)
  }, [])

  if (loading || series.length === 0) {
    return null
  }

  return (
    <section className="rcal" id="naptar">
      <SectionTitle>Versenynaptár</SectionTitle>

      <NextRaceCard series={series} now={now} />

      <NextSessionsCard
        series={series}
        now={now}
        chosen={chosen ?? series[0].id}
        onChoose={setChosen}
      />
    </section>
  )
}
