import { Outlet } from 'react-router-dom'
import Rail from '../components/Rail.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import './PublicLayout.css'

export default function PublicLayout() {
  return (
    <>
      <div className="shell">
        <Rail />
        <main className="feed">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </>
  )
}
