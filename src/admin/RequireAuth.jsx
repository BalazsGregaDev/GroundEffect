import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth.js'
import './admin.css'

function NoAccess() {
  const { session, signOut } = useAuth()

  return (
    <div className="admin-notice">
      <h1>Nincs admin jogosultság</h1>
      <p>
        A(z) <strong>{session.user.email}</strong> címhez nem tartozik admin szerepkör.
        Kérd meg a superadmint, hogy vegyen fel.
      </p>
      <button type="button" className="admin-button" onClick={signOut}>
        Kijelentkezés
      </button>
    </div>
  )
}

export default function RequireAuth({ children }) {
  const { loading, session, role } = useAuth()

  if (loading) {
    return <div className="admin-notice">Betöltés…</div>
  }

  if (!session) {
    return <Navigate to="/admin/belepes" replace />
  }

  if (!role) {
    return <NoAccess />
  }

  return children
}
