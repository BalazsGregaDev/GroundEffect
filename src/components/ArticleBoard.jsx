import SectionTitle from './SectionTitle.jsx'
import { formatCount, relativeTime } from '../lib/format.js'
import './ArticleBoard.css'

export default function ArticleBoard({ articles }) {
  return (
    <section className="board" id="cikkek">
      <SectionTitle linkLabel="Összes cikk" linkHref="#cikkek">
        Cikkek
      </SectionTitle>

      <div className="board-head">
        <span>#</span>
        <span>Cikk</span>
        <span>Olvasási idő</span>
        <span>Megtekintés</span>
      </div>

      {articles.map((article, index) => (
        <a
          className={index === 0 ? 'row row--top' : 'row'}
          href={`#${article.id}`}
          key={article.id}
        >
          <span className="pos">{index + 1}</span>
          <div>
            <h3>{article.title}</h3>
            <span className="cat">
              {article.category} · {relativeTime(article.publishedAt)}
            </span>
          </div>
          <span className="read">
            {article.readingMinutes} perc<small>olvasási idő</small>
          </span>
          <span className="views">{formatCount(article.views)}</span>
        </a>
      ))}
    </section>
  )
}
