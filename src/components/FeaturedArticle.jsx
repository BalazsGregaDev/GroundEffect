import { Link } from 'react-router-dom'
import { useFeaturedArticles } from '../hooks/useFeaturedArticles.js'
import { relativeTime } from '../lib/format.js'
import './FeaturedArticle.css'

function metaLine(article) {
  return [
    article.categories?.name,
    relativeTime(article.published_at),
    article.reading_minutes && `${article.reading_minutes} perc olvasás`,
  ]
    .filter(Boolean)
    .join(' · ')
}

export default function FeaturedArticle() {
  const articles = useFeaturedArticles()

  if (articles.length === 0) {
    return null
  }

  return (
    <div className="featured-stack">
      {articles.map((article) => (
        <Link className="featured-row" to={`/cikkek/${article.slug}`} key={article.id}>
          <span className="featured-label">Kiemelt</span>
          <span className="featured-title">{article.title}</span>
          <span className="featured-meta">{metaLine(article)}</span>
        </Link>
      ))}
    </div>
  )
}
