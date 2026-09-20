import { Suspense, lazy } from 'react'
import Home from '../pages/Home.jsx'

const ArticleArchive = lazy(() => import('../pages/ArticleArchive.jsx'))
const MerchPage = lazy(() => import('../pages/MerchPage.jsx'))

function suspended(Page) {
  return (
    <Suspense fallback={<p className="admin-boot">Betöltés…</p>}>
      <Page />
    </Suspense>
  )
}

export const publicRoutes = [
  { path: '/', label: 'Főoldal', element: <Home /> },
  { path: '/cikkek', label: 'Cikkek', element: suspended(ArticleArchive) },
  { path: '/merch', label: 'Merch', element: suspended(MerchPage) },
]

export const publicPatterns = [{ path: '/cikkek/*', label: 'Cikkoldalak (mind)' }]

export const popupTargets = [
  ...publicRoutes.map(({ path, label }) => ({ path, label })),
  ...publicPatterns,
]

export function targetLabel(path) {
  return popupTargets.find((target) => target.path === path)?.label ?? path
}
