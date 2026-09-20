import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import SitePopup from './components/SitePopup.jsx'
import HashScroll from './components/HashScroll.jsx'
import { publicRoutes } from './routes/publicRoutes.jsx'
import ArticleLayout from './layouts/ArticleLayout.jsx'
import { adminNav } from './admin/adminNav.js'

const Article = lazy(() => import('./pages/Article.jsx'))
const AdminRoot = lazy(() => import('./admin/AdminRoot.jsx'))
const AdminArea = lazy(() => import('./admin/AdminArea.jsx'))
const Login = lazy(() => import('./admin/Login.jsx'))
const Dashboard = lazy(() => import('./admin/Dashboard.jsx'))
const ArticleList = lazy(() => import('./admin/ArticleList.jsx'))
const ArticleEditor = lazy(() => import('./admin/ArticleEditor.jsx'))
const VideoList = lazy(() => import('./admin/VideoList.jsx'))
const FacebookPostList = lazy(() => import('./admin/FacebookPostList.jsx'))
const PollList = lazy(() => import('./admin/PollList.jsx'))
const PollEditor = lazy(() => import('./admin/PollEditor.jsx'))
const RaceList = lazy(() => import('./admin/RaceList.jsx'))
const RaceEditor = lazy(() => import('./admin/RaceEditor.jsx'))
const CoverSettings = lazy(() => import('./admin/CoverSettings.jsx'))
const MerchList = lazy(() => import('./admin/MerchList.jsx'))
const PopupList = lazy(() => import('./admin/PopupList.jsx'))
const AdminUsers = lazy(() => import('./admin/AdminUsers.jsx'))
const Placeholder = lazy(() => import('./admin/Placeholder.jsx'))

export default function App() {
  return (
    <>
      <HashScroll />
      <SitePopup />

      <Routes>
        <Route element={<PublicLayout />}>
          {publicRoutes.map((route) =>
            route.path === '/' ? (
              <Route key={route.path} index element={route.element} />
            ) : (
              <Route key={route.path} path={route.path.slice(1)} element={route.element} />
            ),
          )}
        </Route>

        <Route path="cikkek/:slug" element={<ArticleLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<p className="admin-boot">Betöltés…</p>}>
                <Article />
              </Suspense>
            }
          />
        </Route>

        <Route
          path="/admin"
          element={
            <Suspense fallback={<p className="admin-boot">Betöltés…</p>}>
              <AdminRoot />
            </Suspense>
          }
        >
          <Route path="belepes" element={<Login />} />

          <Route element={<AdminArea />}>
            <Route index element={<Dashboard />} />
            <Route path="cikkek" element={<ArticleList />} />
            <Route path="cikkek/uj" element={<ArticleEditor />} />
            <Route path="cikkek/:id" element={<ArticleEditor />} />
            <Route path="videok" element={<VideoList />} />
            <Route path="facebook" element={<FacebookPostList />} />
            <Route path="szavazas" element={<PollList />} />
            <Route path="szavazas/uj" element={<PollEditor />} />
            <Route path="szavazas/:id" element={<PollEditor />} />
            <Route path="naptar" element={<RaceList />} />
            <Route path="naptar/uj" element={<RaceEditor />} />
            <Route path="naptar/:id" element={<RaceEditor />} />
            <Route path="boritokepek" element={<CoverSettings />} />
            <Route path="merch" element={<MerchList />} />
            <Route path="popup" element={<PopupList />} />
            <Route path="felhasznalok" element={<AdminUsers />} />

            {adminNav
              .filter((item) => item.pending)
              .map((item) => (
                <Route
                  key={item.path}
                  path={item.path.slice('/admin/'.length)}
                  element={<Placeholder title={item.label} />}
                />
              ))}
          </Route>
        </Route>
      </Routes>
    </>
  )
}
