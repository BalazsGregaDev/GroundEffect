import { Outlet, useLocation } from 'react-router-dom'
import Rail from '../components/Rail.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import PollWarning from '../components/PollWarning.jsx'
import ActivePollProvider from '../components/ActivePollProvider.jsx'
import SearchProvider from '../components/SearchProvider.jsx'
import { useSearch } from '../hooks/useSearch.js'
import './PublicLayout.css'

function Feed() {
  const { phase } = useSearch()
  const { pathname } = useLocation()
  const home = pathname === '/'

  const classes = [
    'feed',
    home && phase !== 'idle' && 'feed--searching',
    home && phase === 'fading' && 'feed--fading',
  ].filter(Boolean)

  return (
    <main className={classes.join(' ')}>
      <Outlet />
    </main>
  )
}

export default function PublicLayout() {
  return (
    <ActivePollProvider>
      <SearchProvider>
        <div className="shell">
          <Rail />
          <Feed />
        </div>
        <SiteFooter />
        <PollWarning />
      </SearchProvider>
    </ActivePollProvider>
  )
}
