import { NavLink, Outlet } from 'react-router-dom'
import { adminNav } from './adminNav.js'
import { useAuth } from './useAuth.js'
import { roleLabel } from './roles.js'
import logo from '../assets/logo-kor.jpg'
import './admin.css'
import './AdminLayout.css'

export default function AdminLayout() {
  const { session, role, signOut } = useAuth()
  const items = adminNav.filter((item) => !item.superadminOnly || role === 'superadmin')

  return (
    <div className="admin">
      <aside className="admin-rail">
        <div className="admin-brand">
          <img src={logo} width="36" height="36" alt="" />
          <span>Ground Effect</span>
        </div>

        <nav className="admin-nav">
          {items.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end}>
              {item.label}
              {item.pending && <span className="admin-nav-pending">hamarosan</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-user">
          <p className="admin-user-email">{session.user.email}</p>
          <p className="admin-user-role">{roleLabel(role)}</p>
          <button type="button" className="admin-button admin-button--ghost" onClick={signOut}>
            Kijelentkezés
          </button>
          <a href="/">Vissza az oldalra</a>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
