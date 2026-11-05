import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import { useAdminRoles } from './useAdminRoles.js'
import { withinReach } from './permissions.js'
import { functionErrorMessage } from '../lib/functionError.js'
import './AdminUsers.css'

export default function AdminUsers() {
  const { session, role, permissions, readOnly, can, canWrite, isSuperadmin } = useAuth()
  const { roles } = useAdminRoles()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState(null)
  const [resets, setResets] = useState({})
  const [resetting, setResetting] = useState(null)

  const canManage = canWrite('users')
  const access = { role, permissions, readOnly }
  const assignable = roles.filter(
    (item) => (item.key !== 'superadmin' || isSuperadmin) && withinReach(access, item),
  )
  const chosenRole = assignable.some((item) => item.key === newRole)
    ? newRole
    : (assignable.at(-1)?.key ?? '')

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

  function roleName(key) {
    return roles.find((item) => item.key === key)?.name ?? '—'
  }

  async function addUser(event) {
    event.preventDefault()

    const email = newEmail.trim()

    if (!email || !chosenRole) {
      return
    }

    setAdding(true)
    setError(null)
    setNotice(null)

    const { error: functionError } = await supabase.functions.invoke('create-admin-user', {
      body: { email, password: newPassword, role: chosenRole },
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

  async function changeRole(email, nextRole) {
    const { error } = await supabase.from('admin_users').update({ role: nextRole }).eq('email', email)

    if (error) {
      setError(error)
      return
    }

    load()
  }

  async function resetPassword(email) {
    const password = resets[email] ?? ''

    setResetting(email)
    setError(null)
    setNotice(null)

    const { error: functionError } = await supabase.functions.invoke('reset-admin-password', {
      body: { email, password },
    })

    setResetting(null)

    if (functionError) {
      setError({
        message: await functionErrorMessage(functionError, 'A jelszó visszaállítása nem sikerült.'),
      })
      return
    }

    setResets((current) => ({ ...current, [email]: '' }))
    setNotice(
      `${email} jelszava visszaállítva. A következő belépéskor új jelszót kell beállítania, addig semmi mást nem ér el.`,
    )
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
      <div className="list-head">
        <h1>Felhasználók</h1>

        {can('users.roles') && (
          <Link to="/admin/felhasznalok/szerepkorok" className="admin-button admin-button--ghost">
            Szerepkörök szerkesztése
          </Link>
        )}
      </div>

      {canManage && (
        <>
          <p className="admin-readonly">
            A felvétellel egyszerre készül el a belépéshez használható fiók és a szerepkör.
            Az itt megadott jelszó ideiglenes: az illető első belépésekor a rendszer a
            jelszócserét kéri, és addig semmi mást nem enged. Ha a címhez már tartozik fiók,
            a felvétel nem megy át — annak a szerepkörét a lenti listában állítsd. Csak olyan
            szerepkört adhatsz, amelynek minden joga a tiédben is megvan. Elfelejtett jelszónál
            a listában adj meg egy új ideiglenes jelszót (legalább 8 karakter): a következő
            belépéskor ugyanúgy kötelező lesz lecserélni.
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
              <select value={chosenRole} onChange={(event) => setNewRole(event.target.value)}>
                {assignable.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name}
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

            <button type="submit" className="admin-button" disabled={adding || !chosenRole}>
              {adding ? 'Felvétel…' : 'Felvétel'}
            </button>
          </form>
        </>
      )}

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
              const manageable =
                canManage && !isSelf && assignable.some((item) => item.key === user.role)
              const options = manageable
                ? assignable
                : [{ key: user.role, name: roleName(user.role) }]

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
                      disabled={!manageable}
                    >
                      {options.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {manageable && (
                      <div className="users-actions">
                        <div className="users-reset">
                          <input
                            type="text"
                            value={resets[user.email] ?? ''}
                            onChange={(event) =>
                              setResets((current) => ({ ...current, [user.email]: event.target.value }))
                            }
                            aria-label={`${user.email} új ideiglenes jelszava`}
                            autoComplete="off"
                            minLength={8}
                          />
                          <button
                            type="button"
                            className="admin-button admin-button--ghost"
                            onClick={() => resetPassword(user.email)}
                            disabled={resetting !== null || (resets[user.email] ?? '').length < 8}
                          >
                            {resetting === user.email ? 'Visszaállítás…' : 'Jelszó visszaállítása'}
                          </button>
                        </div>

                        <button type="button" className="users-revoke" onClick={() => revoke(user.email)}>
                          Hozzáférés visszavonása
                        </button>
                      </div>
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
