import { Navigate } from 'react-router-dom'
import PasswordChange from './PasswordChange.jsx'
import { useAuth } from './useAuth.js'
import './admin.css'

function NoAccess() {
  const { session, roleError, signOut } = useAuth()

  return (
    <div className="admin-notice">
      <h1>Nincs admin jogosultság</h1>

      {roleError ? (
        <p>
          A szerepkör lekérdezése hibára futott: <strong>{roleError.message}</strong>
        </p>
      ) : (
        <p>
          A(z) <strong>{session.user.email}</strong> címhez nem tartozik sor az
          admin_users táblában, ezért a belépés megtörtént, de admin jog nincs hozzá.
        </p>
      )}

      <button type="button" className="admin-button" onClick={signOut}>
        Kijelentkezés
      </button>
    </div>
  )
}

export default function RequireAuth({ children }) {
  const { loading, session, role, mustChangePassword } = useAuth()

  if (loading) {
    return <div className="admin-notice">Betöltés…</div>
  }

  if (!session) {
    return <Navigate to="/admin/belepes" replace />
  }

  if (!role) {
    return <NoAccess />
  }

  if (mustChangePassword) {
    return <PasswordChange />
  }

  return children
}
