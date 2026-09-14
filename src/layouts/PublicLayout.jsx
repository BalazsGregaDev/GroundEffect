import { Outlet } from 'react-router-dom'
import Rail from '../components/Rail.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import PollWarning from '../components/PollWarning.jsx'
import ActivePollProvider from '../components/ActivePollProvider.jsx'
import './PublicLayout.css'

export default function PublicLayout() {
  return (
    <ActivePollProvider>
      <div className="shell">
        <Rail />
        <main className="feed">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
      <PollWarning />
    </ActivePollProvider>
  )
}
