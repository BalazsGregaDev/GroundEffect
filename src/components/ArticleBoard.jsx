import { Link } from 'react-router-dom'
import SectionTitle from './SectionTitle.jsx'
import { usePublishedArticles } from '../hooks/usePublishedArticles.js'
import { relativeTime } from '../lib/format.js'
import './ArticleBoard.css'

export default function ArticleBoard() {
  const { articles, loading, error } = usePublishedArticles(4)

  return (
    <section className="board" id="cikkek">
      <SectionTitle linkLabel="Összes cikk" linkHref="#cikkek">
        Cikkek
      </SectionTitle>

      {loading && <p className="board-message">Cikkek betöltése…</p>}

      {error && <p className="board-message">A cikkeket most nem sikerült betölteni.</p>}

      {!loading && !error && articles.length === 0 && (
        <p className="board-message">Még nincs publikált cikk.</p>
      )}

      {articles.length > 0 && (
        <>
          <div className="board-head">
            <span>#</span>
            <span>Cikk</span>
            <span>Olvasási idő</span>
          </div>

          {articles.map((article, index) => (
            <Link
              className={index === 0 ? 'row row--top' : 'row'}
              to={`/cikkek/${article.slug}`}
              key={article.id}
            >
              <span className="pos">{index + 1}</span>
              <div>
                <h3>{article.title}</h3>
                <span className="cat">
                  {article.categories?.name ?? 'Egyéb'} · {relativeTime(article.published_at)}
                </span>
              </div>
              <span className="read">
                {article.reading_minutes ?? '–'} perc<small>olvasási idő</small>
              </span>
            </Link>
          ))}
        </>
      )}
    </section>
  )
}
