import SectionTitle from './SectionTitle.jsx'
import ArticleRows from './ArticleRows.jsx'
import { usePublishedArticles } from '../hooks/usePublishedArticles.js'
import '../styles/skeleton.css'
import './ArticleBoard.css'

export default function ArticleBoard() {
  const { articles, loading, error } = usePublishedArticles(4)

  return (
    <section className="board" id="cikkek">
      <SectionTitle linkLabel="Összes cikk" linkTo="/cikkek">
        Cikkek
      </SectionTitle>

      {loading && (
        <div className="board-skeleton" aria-hidden="true">
          {[0, 1, 2, 3].map((row) => (
            <span className="skel board-skel-row" key={row} />
          ))}
        </div>
      )}

      {error && <p className="board-message">A cikkeket most nem sikerült betölteni.</p>}

      {!loading && !error && articles.length === 0 && (
        <p className="board-message">Még nincs publikált cikk.</p>
      )}

      {articles.length > 0 && <ArticleRows articles={articles} />}
    </section>
  )
}
