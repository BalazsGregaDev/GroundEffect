import {
  isPast,
  nextSessionIndex,
  raceCountdown,
  raceMoment,
  racePlace,
} from '../lib/raceClock.js'

export default function NextSessionsCard({ series, now, chosen, onChoose }) {
  const active = series.find((item) => item.id === chosen) ?? series[0]
  const race = active?.race ?? null
  const sessions = race?.race_sessions ?? []
  const upcoming = nextSessionIndex(sessions, now)

  return (
    <div className="rcal-tabbed">
      <div className="rcal-tabs" role="tablist">
        {series.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === active?.id}
            className={item.id === active?.id ? 'rcal-tab is-active' : 'rcal-tab'}
            onClick={() => onChoose(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <article className="rcal-card rcal-card--tabbed">
        <h3 className="rcal-card-title">Következő esemény</h3>

        {race ? (
          <>
            <p className="rcal-place">{racePlace(race)}</p>
            <p className="rcal-race-name">{race.name}</p>

            <ul className="rcal-sessions">
              {sessions.map((session, index) => {
                const done = isPast(session.starts_at, now)
                const names = ['rcal-session']

                if (done) {
                  names.push('is-past')
                }

                if (index === upcoming) {
                  names.push('is-next')
                }

                return (
                  <li className={names.join(' ')} key={session.id}>
                    <span className="rcal-session-label">
                      {session.label}
                      <span className="rcal-session-when">{raceMoment(session.starts_at)}</span>
                    </span>
                    <span className="rcal-session-clock">
                      {done ? 'Vége' : raceCountdown(session.starts_at, now)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="rcal-none">Ehhez a sorozathoz nincs kiírt futam.</p>
        )}
      </article>
    </div>
  )
}
