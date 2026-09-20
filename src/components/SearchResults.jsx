import SectionTitle from './SectionTitle.jsx'
import VideoCards from './VideoCards.jsx'
import ArticleRows from './ArticleRows.jsx'
import { useSearch } from '../hooks/useSearch.js'
import { useSearchResults } from '../hooks/useSearchResults.js'
import './SearchResults.css'

export default function SearchResults() {
  const { query } = useSearch()
  const { videos, articles, loading } = useSearchResults(query)

  return (
    <section className="search-results">
      <SectionTitle>Videók</SectionTitle>

      {videos.length > 0 ? (
        <VideoCards videos={videos} />
      ) : (
        <p className="search-empty">
          {loading ? 'Keresés…' : 'Egy videó címében sincs benne, amit keresel.'}
        </p>
      )}

      <SectionTitle>Cikkek</SectionTitle>

      {articles.length > 0 ? (
        <ArticleRows articles={articles} />
      ) : (
        <p className="search-empty">{loading ? 'Keresés…' : 'Nincs találat a cikkek között.'}</p>
      )}
    </section>
  )
}
