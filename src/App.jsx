import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import Home from './pages/Home.jsx'
import { adminNav } from './admin/adminNav.js'

const Article = lazy(() => import('./pages/Article.jsx'))
const AdminRoot = lazy(() => import('./admin/AdminRoot.jsx'))
const AdminArea = lazy(() => import('./admin/AdminArea.jsx'))
const Login = lazy(() => import('./admin/Login.jsx'))
const Dashboard = lazy(() => import('./admin/Dashboard.jsx'))
const ArticleList = lazy(() => import('./admin/ArticleList.jsx'))
const ArticleEditor = lazy(() => import('./admin/ArticleEditor.jsx'))
const AdminUsers = lazy(() => import('./admin/AdminUsers.jsx'))
const Placeholder = lazy(() => import('./admin/Placeholder.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route
          path="cikkek/:slug"
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
  )
}
