import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useArticles } from './useArticles.js'
import { useAuth } from './useAuth.js'
import { statuses, statusLabel } from './statuses.js'
import { formatCount, relativeTime } from '../lib/format.js'
import { featuredArticleLimit } from '../data/site.js'
import TagManager from './TagManager.jsx'
import './ArticleList.css'

const filters = [{ value: 'all', label: 'Mind' }, ...statuses]

export default function ArticleList() {
  const { canEdit } = useAuth()
  const [params, setParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const [managingTags, setManagingTags] = useState(false)
  const [search, setSearch] = useState('')
  const [failure, setFailure] = useState(null)

  const status = params.get('allapot') ?? 'all'
  const { articles, loading, error, reload } = useArticles({ status, search })

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  function open(article) {
    window.open(`/admin/cikkek/${article.id}`, '_blank', 'noopener')
  }

  async function toggleFeatured(article) {
    setFailure(null)

    if (!article.featured) {
      const { count } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('featured', true)

      if ((count ?? 0) >= featuredArticleLimit) {
        setFailure(
          `Egyszerre legfeljebb ${featuredArticleLimit} cikk lehet kiemelt. ` +
            'Előbb vedd ki valamelyiket.',
        )
        return
      }
    }

    const { error: updateError } = await supabase
      .from('articles')
      .update({ featured: !article.featured })
      .eq('id', article.id)

    if (updateError) {
      setFailure(`A kiemelés módosítása nem sikerült: ${updateError.message}`)
      return
    }

    await reload()
  }

  return (
    <div>
      <div className="list-head">
        <h1>Cikkek</h1>
        {canEdit && (
          <div className="list-head-actions">
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => setManagingTags(true)}
            >
              Tagek kezelése
            </button>

            <Link to="/admin/cikkek/uj" className="admin-button">
              Új cikk
            </Link>
          </div>
        )}
      </div>

      {managingTags && <TagManager onClose={() => setManagingTags(false)} />}

      <div className="list-controls">
        <div className="list-filters">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={filter.value === status ? 'list-filter is-active' : 'list-filter'}
              onClick={() => setParams(filter.value === 'all' ? {} : { allapot: filter.value })}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="admin-field list-search">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Keresés címben+alcímben"
          />
        </label>
      </div>

      {error && <p className="admin-error">Nem sikerült betölteni a cikkeket: {error.message}</p>}

      {failure && <p className="admin-error">{failure}</p>}

      {loading && <p className="list-empty">Betöltés…</p>}

      {!loading && articles.length === 0 && (
        <p className="list-empty">Nincs a szűrőnek megfelelő cikk.</p>
      )}

      {articles.length > 0 && (
        <table className="list-table article-table">
          <thead>
            <tr>
              <th>Cím</th>
              <th>Kategória</th>
              <th>Állapot</th>
              <th>Megtekintés</th>
              <th>Módosítva</th>
              <th className="article-featured-col">Kiemelt</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id}>
                <td className="article-open" onClick={() => open(article)}>
                  <Link
                    to={`/admin/cikkek/${article.id}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {article.title}
                  </Link>
                </td>
                <td className="article-open" onClick={() => open(article)}>
                  {article.categories?.name ?? '–'}
                </td>
                <td className="article-open" onClick={() => open(article)}>
                  <span className={`admin-status admin-status--${article.status}`}>
                    {statusLabel(article.status)}
                  </span>
                </td>
                <td className="article-open list-number" onClick={() => open(article)}>
                  {formatCount(article.views)}
                </td>
                <td className="article-open list-number" onClick={() => open(article)}>
                  {relativeTime(article.updated_at)}
                </td>
                <td className="article-featured-col">
                  <label className="article-featured">
                    <input
                      type="checkbox"
                      checked={article.featured}
                      disabled={!canEdit}
                      onChange={() => toggleFeatured(article)}
                    />
                    <span>Kiemelt</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
