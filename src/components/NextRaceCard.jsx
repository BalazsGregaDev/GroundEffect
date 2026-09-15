import { Link } from 'react-router-dom'
import SeriesCover from './SeriesCover.jsx'
import { raceCountdown, racePlace } from '../lib/raceClock.js'

function ArticleCard({ article, series }) {
  if (!article) {
    return <span className="rcal-article rcal-article--empty">Ehhez még nincs cikk.</span>
  }

  return (
    <Link className="rcal-article" to={`/cikkek/${article.slug}`}>
      <span className="rcal-cover">
        {article.cover_url ? (
          <img
            src={article.cover_url}
            alt=""
            loading="lazy"
            style={{ objectPosition: article.cover_focus ?? '50% 50%' }}
          />
        ) : (
          <SeriesCover slug={series.slug} name={series.name} />
        )}
      </span>
      <span className="rcal-article-title">{article.title}</span>
    </Link>
  )
}

export default function NextRaceCard({ series, now }) {
  return (
    <article className="rcal-card">
      <h3 className="rcal-card-title">Következő futam</h3>

      <div className="rcal-grid">
        {series.map((item) => (
          <div className="rcal-col" key={item.id}>
            <span className="rcal-series">{item.name}</span>

            <div className="rcal-next">
              {item.race ? (
                <>
                  <span className="rcal-race">{item.race.name}</span>
                  <span className="rcal-where">{racePlace(item.race)}</span>
                  <span className="rcal-clock">{raceCountdown(item.race.starts_at, now)}</span>
                </>
              ) : (
                <span className="rcal-none">Nincs kiírt futam.</span>
              )}
            </div>

            <ArticleCard article={item.article} series={item} />
          </div>
        ))}
      </div>
    </article>
  )
}
