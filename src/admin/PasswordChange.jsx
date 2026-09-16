import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'
import './PasswordChange.css'

const minimum = 8

export default function PasswordChange() {
  const { session, signOut, refreshProfile } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const tooShort = password.length > 0 && password.length < minimum
  const mismatch = confirm.length > 0 && password !== confirm
  const ready = password.length >= minimum && password === confirm

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setBusy(false)
      setError(`A jelszó módosítása nem sikerült: ${updateError.message}`)
      return
    }

    const { error: flagError } = await supabase.rpc('complete_password_change')

    if (flagError) {
      setBusy(false)
      setError(`A jelszó megváltozott, de a jelölés törlése nem sikerült: ${flagError.message}`)
      return
    }

    await refreshProfile()
    setBusy(false)
  }

  return (
    <div className="pwchange">
      <h1>Válassz új jelszót</h1>

      <p className="pwchange-lead">
        A(z) <strong>{session.user.email}</strong> fiókhoz ideiglenes jelszó tartozik. Amíg
        nem cserélted le, az admin felület többi része nem érhető el.
      </p>

      <form onSubmit={submit}>
        <label className="admin-field">
          <span>Új jelszó</span>
          <input
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label className="admin-field">
          <span>Új jelszó még egyszer</span>
          <input
            type="password"
            value={confirm}
            autoComplete="new-password"
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>

        {tooShort && <p className="pwchange-hint">Legalább {minimum} karakter kell.</p>}
        {mismatch && <p className="pwchange-hint">A két jelszó nem egyezik.</p>}
        {error && <p className="admin-error">{error}</p>}

        <div className="pwchange-actions">
          <button type="submit" className="admin-button" disabled={!ready || busy}>
            {busy ? 'Mentés…' : 'Jelszó mentése'}
          </button>

          <button type="button" className="pwchange-out" onClick={signOut}>
            Kijelentkezés
          </button>
        </div>
      </form>
    </div>
  )
}
