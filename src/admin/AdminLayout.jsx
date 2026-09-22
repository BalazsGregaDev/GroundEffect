import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import MenuToggle from '../components/MenuToggle.jsx'
import { adminNav } from './adminNav.js'
import { useAuth } from './useAuth.js'
import { roleLabel } from './roles.js'
import logo from '../assets/logo-kor.jpg'
import './admin.css'
import './AdminLayout.css'

export default function AdminLayout() {
  const { session, role, signOut } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const items = adminNav.filter((item) => !item.superadminOnly || role === 'superadmin')

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) {
      return
    }

    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={open ? 'admin admin--open' : 'admin'}>
      <aside className="admin-rail">
        <div className="admin-bar">
          <div className="admin-brand">
            <img src={logo} width="36" height="36" alt="" />
            <span>Ground Effect</span>
          </div>

          <MenuToggle
            open={open}
            controls="admin-panel"
            onToggle={() => setOpen((current) => !current)}
          />
        </div>

        <div className="admin-panel" id="admin-panel">
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
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
