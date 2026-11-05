import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import ToggleSwitch from '../components/ToggleSwitch.jsx'
import { useAuth } from './useAuth.js'
import { useAdminRoles } from './useAdminRoles.js'
import { adminAreas, byStrength, normalizePermissions, withinReach } from './permissions.js'
import './RoleEditor.css'

function sameRole(left, right) {
  return (
    left.name === right.name &&
    left.read_only === right.read_only &&
    [...left.permissions].sort().join() === [...right.permissions].sort().join()
  )
}

function editableCopy(item) {
  return { ...item, permissions: normalizePermissions(item.permissions) }
}

export default function RoleEditor() {
  const { role, permissions, readOnly, canWrite, isSuperadmin } = useAuth()
  const { roles, loading, error: loadError, reload } = useAdminRoles()
  const [rows, setRows] = useState([])
  const [usage, setUsage] = useState({})
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const canManage = canWrite('users.roles')
  const access = { role, permissions, readOnly }

  const loadUsage = useCallback(async () => {
    const { data } = await supabase.rpc('admin_role_usage')

    setUsage(Object.fromEntries((data ?? []).map((row) => [row.role, Number(row.users)])))
  }, [])

  useEffect(() => {
    setRows(roles.map(editableCopy))
  }, [roles])

  useEffect(() => {
    loadUsage()
  }, [loadUsage])

  const saved = new Map(roles.map((item) => [item.key, item]))
  const changed = rows.filter((row) => row.isNew || row.removed || !sameRole(row, saved.get(row.key)))

  function editable(row) {
    return (
      canManage &&
      (row.isNew || (!row.locked && row.key !== role && withinReach(access, saved.get(row.key))))
    )
  }

  function grantable(permission) {
    return isSuperadmin || permissions.includes(permission)
  }

  function updateRow(key, changes) {
    setNotice(null)
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)))
  }

  function toggle(row, permission, on) {
    const next = on
      ? [...row.permissions, permission]
      : row.permissions.filter((item) => item !== permission && !item.startsWith(`${permission}.`))

    updateRow(row.key, { permissions: normalizePermissions(next) })
  }

  function addRole(event) {
    event.preventDefault()

    const name = newName.trim()

    if (!name) {
      return
    }

    setNotice(null)
    setRows((current) => [
      ...current,
      { key: `uj-${Date.now()}`, name, permissions: [], read_only: false, locked: false, isNew: true },
    ])
    setNewName('')
  }

  function removeRow(row) {
    if (row.isNew) {
      setRows((current) => current.filter((item) => item.key !== row.key))
      return
    }

    updateRow(row.key, { removed: !row.removed })
  }

  function validate() {
    const names = rows.filter((row) => !row.removed).map((row) => row.name.trim().toLowerCase())

    if (names.some((name) => !name)) {
      return 'Minden szerepkörnek legyen neve.'
    }

    if (new Set(names).size !== names.length) {
      return 'Két szerepkörnek nem lehet ugyanaz a neve.'
    }

    return null
  }

  async function save() {
    const problem = validate()

    if (problem) {
      setError(problem)
      return
    }

    setSaving(true)
    setError(null)
    setNotice(null)

    const failures = []

    for (const row of changed) {
      const payload = {
        name: row.name.trim(),
        permissions: row.permissions,
        read_only: row.read_only,
      }

      const request = row.removed
        ? supabase.from('admin_roles').delete().eq('key', row.key).select('key')
        : row.isNew
          ? supabase.from('admin_roles').insert(payload).select('key')
          : supabase.from('admin_roles').update(payload).eq('key', row.key).select('key')

      const { data, error: rowError } = await request

      if (rowError || !data?.length) {
        failures.push(`${row.name}: ${rowError?.message ?? 'ezt a szerepkört nem módosíthatod'}`)
      }
    }

    await Promise.all([reload(), loadUsage()])
    setSaving(false)

    if (failures.length > 0) {
      setError(failures.join(' · '))
    } else {
      setNotice('Mentve. A sorrend a jogok száma szerint frissült.')
    }
  }

  if (loading) {
    return <p className="admin-readonly">Betöltés…</p>
  }

  const ordered = [
    ...rows.filter((row) => !row.isNew).sort((left, right) => byStrength(saved.get(left.key), saved.get(right.key))),
    ...rows.filter((row) => row.isNew),
  ]

  return (
    <div className="roles">
      <div className="list-head">
        <div>
          <Link to="/admin/felhasznalok" className="editor-back">
            Vissza a felhasználókhoz
          </Link>
          <h1>Szerepkörök</h1>
        </div>

        {canManage && (
          <div className="list-head-actions">
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => {
                setRows(roles.map(editableCopy))
                setError(null)
              }}
              disabled={saving || changed.length === 0}
            >
              Elvetés
            </button>
            <button
              type="button"
              className="admin-button"
              onClick={save}
              disabled={saving || changed.length === 0}
            >
              {saving ? 'Mentés…' : 'Mentés'}
            </button>
          </div>
        )}
      </div>

      <p className="admin-readonly">
        Soronként egy szerepkör, oszloponként a menüpontok. A sorrend a bekapcsolt jogok száma
        szerint áll be: feljebb az, akinek több funkció érhető el. A Hibajegy mindenkinek
        elérhető, ezért nincs kapcsolója. Csak olyan jogot adhatsz tovább, ami neked is megvan,
        és a saját szerepkörödet nem szerkesztheted.
      </p>

      {loadError && <p className="admin-error">A szerepkörök betöltése nem sikerült.</p>}
      {error && <p className="admin-error">{error}</p>}
      {notice && <p className="roles-notice">{notice}</p>}

      <div className="roles-wrap">
        <table className="roles-table">
          <thead>
            <tr>
              <th rowSpan={2} className="roles-name-col">
                Szerepkör
              </th>
              {adminAreas.map((area) => (
                <th key={area.key} colSpan={area.extra ? 2 : 1} rowSpan={area.extra ? 1 : 2}>
                  {area.label}
                </th>
              ))}
              {isSuperadmin && <th rowSpan={2}>Csak olvasás</th>}
              <th rowSpan={2}>Felhasználók</th>
              <th rowSpan={2} aria-label="Műveletek" />
            </tr>
            <tr>
              {adminAreas
                .filter((area) => area.extra)
                .flatMap((area) => [
                  <th key={area.key} className="roles-sub">
                    {area.baseLabel}
                  </th>,
                  <th key={area.extra.key} className="roles-sub">
                    {area.extra.label}
                  </th>,
                ])}
            </tr>
          </thead>

          <tbody>
            {ordered.map((row) => {
              const open = editable(row)
              const users = usage[row.key] ?? 0
              const classes = ['roles-row']

              if (row.removed) {
                classes.push('is-removed')
              }

              if (row.isNew) {
                classes.push('is-new')
              }

              return (
                <tr key={row.key} className={classes.join(' ')}>
                  <th scope="row" className="roles-name-col">
                    {open && !row.removed ? (
                      <input
                        type="text"
                        value={row.name}
                        onChange={(event) => updateRow(row.key, { name: event.target.value })}
                        aria-label="Szerepkör neve"
                      />
                    ) : (
                      <span>{row.name}</span>
                    )}
                    {row.locked && <small>rögzített, minden joga megvan</small>}
                    {row.key === role && !row.locked && <small>a te szerepköröd</small>}
                  </th>

                  {adminAreas.flatMap((area) => {
                    const keys = area.extra ? [area.key, area.extra.key] : [area.key]

                    return keys.map((permission) => {
                      const parentOff =
                        permission.includes('.') && !row.permissions.includes(area.key)

                      return (
                        <td key={permission} className="roles-cell">
                          <ToggleSwitch
                            checked={row.locked || row.permissions.includes(permission)}
                            onChange={(on) => toggle(row, permission, on)}
                            disabled={!open || row.removed || !grantable(permission) || parentOff}
                            label={`${row.name}: ${area.label}${permission.includes('.') ? ` – ${area.extra.label}` : ''}`}
                          />
                        </td>
                      )
                    })
                  })}

                  {isSuperadmin && (
                    <td className="roles-cell">
                      <ToggleSwitch
                        checked={row.read_only}
                        onChange={(on) => updateRow(row.key, { read_only: on })}
                        disabled={!open || row.removed || row.locked}
                        label={`${row.name}: csak olvasás`}
                      />
                    </td>
                  )}

                  <td className="roles-count">{row.isNew ? '–' : users}</td>

                  <td className="roles-actions">
                    {open && (row.isNew || users === 0) && (
                      <button type="button" className="roles-remove" onClick={() => removeRow(row)}>
                        {row.removed ? 'Visszaállítás' : 'Törlés'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {canManage && (
        <form className="roles-add" onSubmit={addRole}>
          <label className="admin-field">
            <span>Új szerepkör neve</span>
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="pl. Főszerkesztő"
            />
          </label>

          <button type="submit" className="admin-button admin-button--ghost" disabled={!newName.trim()}>
            Hozzáadás
          </button>
        </form>
      )}
    </div>
  )
}
