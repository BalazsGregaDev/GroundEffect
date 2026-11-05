import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import SitePopup from './components/SitePopup.jsx'
import HashScroll from './components/HashScroll.jsx'
import ScrollTop from './components/ScrollTop.jsx'
import { publicRoutes } from './routes/publicRoutes.jsx'
import ArticleLayout from './layouts/ArticleLayout.jsx'
import { adminNav } from './admin/adminNav.js'
import Gate from './admin/Gate.jsx'

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
const SectionList = lazy(() => import('./admin/SectionList.jsx'))
const PopupList = lazy(() => import('./admin/PopupList.jsx'))
const AdminUsers = lazy(() => import('./admin/AdminUsers.jsx'))
const RoleEditor = lazy(() => import('./admin/RoleEditor.jsx'))
const Placeholder = lazy(() => import('./admin/Placeholder.jsx'))

function guarded(permission, element) {
  return <Gate permission={permission}>{element}</Gate>
}

export default function App() {
  return (
    <>
      <HashScroll />
      <ScrollTop />
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
            <Route path="cikkek" element={guarded('articles', <ArticleList />)} />
            <Route path="cikkek/uj" element={guarded('articles', <ArticleEditor />)} />
            <Route path="cikkek/:id" element={guarded('articles', <ArticleEditor />)} />
            <Route path="videok" element={guarded('videos', <VideoList />)} />
            <Route path="facebook" element={guarded('facebook', <FacebookPostList />)} />
            <Route path="szavazas" element={guarded('polls', <PollList />)} />
            <Route path="szavazas/uj" element={guarded('polls.edit', <PollEditor />)} />
            <Route path="szavazas/:id" element={guarded('polls', <PollEditor />)} />
            <Route path="naptar" element={guarded('calendar', <RaceList />)} />
            <Route path="naptar/uj" element={guarded('calendar', <RaceEditor />)} />
            <Route path="naptar/:id" element={guarded('calendar', <RaceEditor />)} />
            <Route path="boritokepek" element={guarded('covers', <CoverSettings />)} />
            <Route path="merch" element={guarded('merch', <MerchList />)} />
            <Route path="szekciok" element={guarded('sections', <SectionList />)} />
            <Route path="popup" element={guarded('popups', <PopupList />)} />
            <Route path="felhasznalok" element={guarded('users', <AdminUsers />)} />
            <Route path="felhasznalok/szerepkorok" element={guarded('users.roles', <RoleEditor />)} />

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
