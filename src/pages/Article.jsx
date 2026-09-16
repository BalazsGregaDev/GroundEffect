import { Link, useParams } from 'react-router-dom'
import SeriesCover from '../components/SeriesCover.jsx'
import { useArticle } from '../hooks/useArticle.js'
import { sanitizeHtml } from '../lib/richText.js'
import { coverUrl } from '../lib/cloudinary.js'
import { relativeTime } from '../lib/format.js'
import '../styles/figure.css'
import './Article.css'

export default function Article() {
  const { slug } = useParams()
  const { article, loading } = useArticle(slug)

  if (loading) {
    return <p className="article-message">Betöltés…</p>
  }

  if (!article) {
    return (
      <div className="article-message">
        <h1>Ez a cikk nem található</h1>
        <p>Lehet, hogy még nincs publikálva, vagy megváltozott a webcíme.</p>
        <Link to="/">Vissza a főoldalra</Link>
      </div>
    )
  }

  const tags = article.article_tags.map((row) => row.tags)
  const series =
    tags.find((tag) => tag.id === article.primary_series_tag_id) ??
    tags.find((tag) => tag.kind === 'series')
  const meta = [
    relativeTime(article.published_at),
    article.reading_minutes && `${article.reading_minutes} perc olvasás`,
  ].filter(Boolean)

  return (
    <article className="article">
      <Link to="/" className="article-back">
        Vissza a főoldalra
      </Link>

      {article.cover_url ? (
        <img
          className="article-cover"
          src={coverUrl(article.cover_url)}
          style={{ objectPosition: article.cover_focus }}
          alt=""
        />
      ) : (
        <SeriesCover className="article-cover" slug={series?.slug} name={series?.name} />
      )}

      {article.categories && <p className="article-category">{article.categories.name}</p>}

      <h1>{article.title}</h1>

      <p className="article-meta">{meta.join(' · ')}</p>

      {article.lead && <p className="article-lead">{article.lead}</p>}

      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.body) }}
      />

      {tags.length > 0 && (
        <div className="article-tags">
          {tags.map((tag) => (
            <span key={tag.id}>{tag.name}</span>
          ))}
        </div>
      )}
    </article>
  )
}
