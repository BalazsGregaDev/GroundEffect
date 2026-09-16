import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { adminRoles } from './roles.js'
import { functionErrorMessage } from '../lib/functionError.js'
import './AdminUsers.css'

export default function AdminUsers() {
  const { session, isSuperadmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('admin')
  const [newPassword, setNewPassword] = useState('')
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState(null)

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

    setAdding(true)
    setError(null)
    setNotice(null)

    const { error: functionError } = await supabase.functions.invoke('create-admin-user', {
      body: { email, password: newPassword, role: newRole },
    })

    setAdding(false)

    if (functionError) {
      setError({ message: await functionErrorMessage(functionError, 'A felvétel nem sikerült.') })
      return
    }

    setNewEmail('')
    setNewPassword('')
    setNotice(`${email} felvéve. Az első belépésnél kötelező lesz jelszót cserélnie.`)
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
        A felvétellel egyszerre készül el a belépéshez használható fiók és a szerepkör.
        Az itt megadott jelszó ideiglenes: az illető első belépésekor a rendszer a
        jelszócserét kéri, és addig semmi mást nem enged. Ha a címhez már tartozik fiók,
        a felvétel nem megy át — annak a szerepkörét a lenti listában állítsd.
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

        <label className="admin-field">
          <span>Ideiglenes jelszó</span>
          <input
            type="text"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="off"
            minLength={8}
            required
          />
        </label>

        <button type="submit" className="admin-button" disabled={adding}>
          {adding ? 'Felvétel…' : 'Felvétel'}
        </button>
      </form>

      {notice && <p className="admin-readonly">{notice}</p>}

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
