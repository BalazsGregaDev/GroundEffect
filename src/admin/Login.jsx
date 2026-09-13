import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth.js'
import logo from '../assets/logo-kor.jpg'
import './admin.css'
import './Login.css'

export default function Login() {
  const { session, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (session) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const result = await signIn(email, password)
    setBusy(false)

    if (result.error) {
      setError(
        result.error.message === 'Invalid login credentials'
          ? 'Hibás e-mail vagy jelszó.'
          : result.error.message,
      )
    }
  }

  return (
    <div className="login">
      <form className="login-box" onSubmit={handleSubmit}>
        <img src={logo} width="52" height="52" alt="" />
        <h1>Admin belépés</h1>

        <label className="admin-field">
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="admin-field">
          <span>Jelszó</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="admin-error">{error}</p>}

        <button type="submit" className="admin-button" disabled={busy}>
          {busy ? 'Belépés…' : 'Belépés'}
        </button>
      </form>
    </div>
  )
}
