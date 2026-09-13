import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useArticles } from './useArticles.js'
import { useAuth } from './useAuth.js'
import { statuses, statusLabel } from './statuses.js'
import { formatCount, relativeTime } from '../lib/format.js'
import './ArticleList.css'

const filters = [{ value: 'all', label: 'Mind' }, ...statuses]

export default function ArticleList() {
  const { canEdit } = useAuth()
  const [params, setParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const status = params.get('allapot') ?? 'all'
  const { articles, loading, error } = useArticles({ status, search })

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  return (
    <div>
      <div className="list-head">
        <h1>Cikkek</h1>
        {canEdit && (
          <Link to="/admin/cikkek/uj" className="admin-button">
            Új cikk
          </Link>
        )}
      </div>

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
            placeholder="Keresés címben"
          />
        </label>
      </div>

      {error && <p className="admin-error">Nem sikerült betölteni a cikkeket: {error.message}</p>}

      {loading && <p className="list-empty">Betöltés…</p>}

      {!loading && articles.length === 0 && (
        <p className="list-empty">Nincs a szűrőnek megfelelő cikk.</p>
      )}

      {articles.length > 0 && (
        <table className="list-table">
          <thead>
            <tr>
              <th>Cím</th>
              <th>Kategória</th>
              <th>Állapot</th>
              <th>Megtekintés</th>
              <th>Módosítva</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id}>
                <td>
                  <Link to={`/admin/cikkek/${article.id}`}>{article.title}</Link>
                  {article.featured && <span className="list-featured">kiemelt</span>}
                </td>
                <td>{article.categories?.name ?? '–'}</td>
                <td>
                  <span className={`admin-status admin-status--${article.status}`}>
                    {statusLabel(article.status)}
                  </span>
                </td>
                <td className="list-number">{formatCount(article.views)}</td>
                <td className="list-number">{relativeTime(article.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
