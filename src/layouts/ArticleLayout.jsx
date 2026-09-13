import { Outlet, useParams } from 'react-router-dom'
import Rail from '../components/Rail.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import ArticleSidebar from '../components/ArticleSidebar.jsx'
import './PublicLayout.css'
import './ArticleLayout.css'

export default function ArticleLayout() {
  const { slug } = useParams()

  return (
    <>
      <div className="shell shell--with-aside">
        <Rail />

        <main className="feed">
          <Outlet />
        </main>

        <ArticleSidebar slug={slug} />
      </div>

      <SiteFooter />
    </>
  )
}
