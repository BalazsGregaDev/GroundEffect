import { Link } from 'react-router-dom'
import { useSidebarArticles } from '../hooks/useSidebarArticles.js'
import { relativeTime } from '../lib/format.js'
import './ArticleSidebar.css'

function ArticleLinks({ title, articles }) {
  if (articles.length === 0) {
    return null
  }

  return (
    <section className="aside-block">
      <h2>{title}</h2>

      <ul>
        {articles.map((article) => (
          <li key={article.id}>
            <Link to={`/cikkek/${article.slug}`}>
              <span className="aside-title">{article.title}</span>
              <span className="aside-meta">
                <span className="aside-cat">{article.categories?.name ?? 'Egyéb'}</span> ·{' '}
                {relativeTime(article.published_at)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function ArticleSidebar({ slug }) {
  const { latest, related } = useSidebarArticles(slug)

  return (
    <aside className="article-aside">
      <ArticleLinks title="Legfrissebb cikkek" articles={latest} />

      {latest.length > 0 && related.length > 0 && <div className="aside-rule" />}

      <ArticleLinks title="Kapcsolódó cikkek" articles={related} />
    </aside>
  )
}
