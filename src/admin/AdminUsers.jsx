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
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('admin')

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

  async function addUser(event) {
    event.preventDefault()

    const email = newEmail.trim()

    if (!email) {
      return
    }

    const { error } = await supabase
      .from('admin_users')
      .upsert({ email, role: newRole }, { onConflict: 'email' })

    if (error) {
      setError(error)
      return
    }

    setNewEmail('')
    setError(null)
    load()
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
        Itt a szerepkört osztod ki, nem a belépést. A Supabase-fiókot továbbra is a
        Supabase Auth felületén kell létrehozni. Ha előre felveszed valakit e-mail cím
        alapján, a fiók elkészültekor rögtön a megadott szerepkörrel lép be; ha előbb
        készül el a fiók, demó szerepkörrel jelenik meg itt, és utána állíthatod át.
      </p>

      <form className="users-add" onSubmit={addUser}>
        <label className="admin-field">
          <span>Új admin e-mail címe</span>
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="szerkeszto@groundeffect.hu"
            required
          />
        </label>

        <label className="admin-field">
          <span>Szerepkör</span>
          <select value={newRole} onChange={(event) => setNewRole(event.target.value)}>
            {adminRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="admin-button">
          Felvétel
        </button>
      </form>

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
