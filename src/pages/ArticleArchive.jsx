import { Link } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle.jsx'
import { useArticleArchive } from '../hooks/useArticleArchive.js'
import { relativeTime } from '../lib/format.js'
import './ArticleArchive.css'

const pageSize = 20

export default function ArticleArchive() {
  const { articles, loading, error, done, loadMore } = useArticleArchive(pageSize)

  return (
    <section className="archive">
      <SectionTitle linkLabel="Vissza a főoldalra" linkTo="/">
        Összes cikk
      </SectionTitle>

      {error && <p className="archive-message">A cikkeket most nem sikerült betölteni.</p>}

      {!loading && !error && articles.length === 0 && (
        <p className="archive-message">Még nincs publikált cikk.</p>
      )}

      <div className="archive-list">
        {articles.map((article) => (
          <Link className="archive-item" to={`/cikkek/${article.slug}`} key={article.id}>
            <span className="archive-meta">
              {article.categories?.name ?? 'Egyéb'} · {relativeTime(article.published_at)}
            </span>
            <h3>{article.title}</h3>
            {article.lead && <p>{article.lead}</p>}
            <span className="archive-read">
              {article.reading_minutes ? `${article.reading_minutes} perc olvasás` : 'Olvasás'}
            </span>
          </Link>
        ))}
      </div>

      {loading && <p className="archive-message">Cikkek betöltése…</p>}

      {!loading && !done && articles.length > 0 && (
        <button type="button" className="archive-more" onClick={loadMore}>
          Több cikk
        </button>
      )}
    </section>
  )
}
