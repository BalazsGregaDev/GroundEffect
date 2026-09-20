import { useSearch } from '../hooks/useSearch.js'
import { minChars } from '../lib/search.js'
import './SearchField.css'

const label = 'Keresés'

export default function SearchField() {
  const { query, setQuery } = useSearch()
  const typed = query.trim().length

  return (
    <div className="rail-search">
      <input
        type="search"
        className="rail-search-input"
        value={query}
        placeholder={label}
        aria-label={label}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setQuery('')
          }
        }}
      />

      {query && (
        <button
          type="button"
          className="rail-search-clear"
          aria-label="Keresés törlése"
          onClick={() => setQuery('')}
        >
          ×
        </button>
      )}

      {typed > 0 && typed < minChars && (
        <p className="rail-search-hint">Legalább {minChars} karakter kell a kereséshez.</p>
      )}
    </div>
  )
}
