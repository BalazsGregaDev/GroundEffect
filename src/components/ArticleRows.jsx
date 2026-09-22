import { Link } from 'react-router-dom'
import { relativeTime } from '../lib/format.js'
import './ArticleRows.css'

export default function ArticleRows({ articles }) {
  return (
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
              <span className="cat-name">{article.category ?? 'Egyéb'}</span> ·{' '}
              {relativeTime(article.published_at)}
            </span>
          </div>
          <span className="read">
            {article.reading_minutes ?? '–'} perc<small>olvasási idő</small>
          </span>
        </Link>
      ))}
    </>
  )
}
