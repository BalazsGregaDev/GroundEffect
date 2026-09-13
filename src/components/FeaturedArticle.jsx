import { Link } from 'react-router-dom'
import { useFeaturedArticle } from '../hooks/useFeaturedArticle.js'
import { relativeTime } from '../lib/format.js'
import './FeaturedArticle.css'

export default function FeaturedArticle() {
  const article = useFeaturedArticle()

  if (!article) {
    return null
  }

  const meta = [
    article.categories?.name,
    relativeTime(article.published_at),
    article.reading_minutes && `${article.reading_minutes} perc olvasás`,
  ].filter(Boolean)

  return (
    <Link className="featured-row" to={`/cikkek/${article.slug}`}>
      <span className="featured-label">Kiemelt</span>
      <span className="featured-title">{article.title}</span>
      <span className="featured-meta">{meta.join(' · ')}</span>
    </Link>
  )
}
