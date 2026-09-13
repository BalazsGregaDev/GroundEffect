import { useEffect, useState } from 'react'
import { relativeTime } from '../lib/format.js'
import { featuredArticleLimit } from '../data/site.js'
import './FeaturedDialog.css'

export default function FeaturedDialog({ articles, onPick, onCancel }) {
  const [choice, setChoice] = useState(articles[0].id)

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div className="featured-backdrop" onMouseDown={onCancel}>
      <div className="featured-panel" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Már {articles.length} kiemelt cikk van</h2>

        <p className="featured-lead">
          Egyszerre legfeljebb {featuredArticleLimit} cikk lehet kiemelt. Válaszd ki, melyikről
          kerüljön le a kiemelt állapot.
        </p>

        <div className="featured-options">
          {articles.map((article) => (
            <label className="featured-option" key={article.id}>
              <input
                type="radio"
                name="featured-drop"
                value={article.id}
                checked={choice === article.id}
                onChange={() => setChoice(article.id)}
              />
              <span>
                <strong>{article.title}</strong>
                <small>
                  {article.published_at ? relativeTime(article.published_at) : 'nincs dátum'}
                </small>
              </span>
            </label>
          ))}
        </div>

        <div className="featured-actions">
          <button type="button" className="admin-button" onClick={() => onPick(choice)}>
            Csere és mentés
          </button>
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={onCancel}
          >
            Mégsem
          </button>
        </div>
      </div>
    </div>
  )
}
