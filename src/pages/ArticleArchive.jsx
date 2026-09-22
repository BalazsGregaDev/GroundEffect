import { Link } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle.jsx'
import SeriesCover from '../components/SeriesCover.jsx'
import { coverUrl } from '../lib/cloudinary.js'
import { useArticleArchive } from '../hooks/useArticleArchive.js'
import { useSearch } from '../hooks/useSearch.js'
import { useSearchResults } from '../hooks/useSearchResults.js'
import { isSearching } from '../lib/search.js'
import { relativeTime } from '../lib/format.js'
import './ArticleArchive.css'

const pageSize = 20
const searchLimit = 40

function ArticleThumb({ article }) {
  if (article.cover_url) {
    return (
      <img
        className="archive-cover"
        src={coverUrl(article.cover_url)}
        style={{ objectPosition: article.cover_focus ?? '50% 50%' }}
        alt=""
        loading="lazy"
      />
    )
  }

  return (
    <SeriesCover
      className="archive-cover"
      slug={article.series_slug}
      name={article.series_name ?? article.category}
    />
  )
}

export default function ArticleArchive() {
  const { query } = useSearch()
  const { articles, loading, error, done, loadMore } = useArticleArchive(pageSize)
  const found = useSearchResults(query, { withVideos: false, limit: searchLimit })

  const searching = isSearching(query)
  const list = searching ? found.articles : articles
  const busy = searching ? found.loading : loading

  return (
    <section className="archive">
      <SectionTitle linkLabel="Vissza a főoldalra" linkTo="/">
        {searching ? 'Találatok' : 'Összes cikk'}
      </SectionTitle>

      {error && !searching && (
        <p className="archive-message">A cikkeket most nem sikerült betölteni.</p>
      )}

      {!busy && list.length === 0 && (
        <p className="archive-message">
          {searching ? 'Nincs cikk erre a keresésre.' : 'Még nincs publikált cikk.'}
        </p>
      )}

      <div className="archive-list">
        {list.map((article) => (
          <Link className="archive-item" to={`/cikkek/${article.slug}`} key={article.id}>
            <span className="archive-text">
              <span className="archive-meta">
                <span className="archive-cat">{article.category ?? 'Egyéb'}</span> ·{' '}
                {relativeTime(article.published_at)}
              </span>
              <h3>{article.title}</h3>
              {article.lead && <p>{article.lead}</p>}
              <span className="archive-read">
                {article.reading_minutes ? `${article.reading_minutes} perc olvasás` : 'Olvasás'}
              </span>
            </span>

            <span className="archive-thumb">
              <ArticleThumb article={article} />
            </span>
          </Link>
        ))}
      </div>

      {busy && <p className="archive-message">{searching ? 'Keresés…' : 'Cikkek betöltése…'}</p>}

      {!searching && !loading && !done && articles.length > 0 && (
        <button type="button" className="archive-more" onClick={loadMore}>
          Több cikk
        </button>
      )}
    </section>
  )
}
