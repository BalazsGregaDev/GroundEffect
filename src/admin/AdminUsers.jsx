import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { adminRoles } from './roles.js'
import './AdminUsers.css'

export default function AdminUsers() {
  const { session, isSuperadmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('admin_users')
      .select('email, role, display_name, created_at')
      .order('created_at')

    setUsers(data ?? [])
    setError(error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!isSuperadmin) {
    return (
      <div>
        <h1>Felhasználók</h1>
        <p className="admin-readonly">Ezt az oldalt csak superadmin nézheti.</p>
      </div>
    )
  }

  async function changeRole(email, role) {
    const { error } = await supabase.from('admin_users').update({ role }).eq('email', email)

    if (error) {
      setError(error)
      return
    }

    load()
  }

  async function revoke(email) {
    const { error } = await supabase.from('admin_users').delete().eq('email', email)

    if (error) {
      setError(error)
      return
    }

    load()
  }

  return (
    <div>
      <h1>Felhasználók</h1>

      <p className="admin-readonly">
        Aki bekerül a Supabase Authba, automatikusan megjelenik itt demó szerepkörrel.
        A tényleges jogot te adod meg alább. A hozzáférés visszavonása csak az admin jogot
        veszi el, a Supabase-fiók megmarad.
      </p>

      {error && <p className="admin-error">Hiba: {error.message}</p>}

      {loading && <p className="users-empty">Betöltés…</p>}

      {!loading && users.length > 0 && (
        <table className="users-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Szerepkör</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.email.toLowerCase() === session.user.email.toLowerCase()

              return (
                <tr key={user.email}>
                  <td>
                    {user.email}
                    {isSelf && <span className="users-self">te</span>}
                  </td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(event) => changeRole(user.email, event.target.value)}
                      disabled={isSelf}
                    >
                      {adminRoles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {!isSelf && (
                      <button type="button" className="users-revoke" onClick={() => revoke(user.email)}>
                        Hozzáférés visszavonása
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
