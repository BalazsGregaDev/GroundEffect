import { useAuth } from './useAuth.js'

export default function Gate({ permission, children }) {
  const { can } = useAuth()

  if (!can(permission)) {
    return (
      <div>
        <h1>Nincs hozzáférésed</h1>
        <p className="admin-readonly">
          Ehhez a menüponthoz a szerepköröd nem ad hozzáférést. Ha szükséged van rá, kérd a
          Felhasználók kezelőjétől.
        </p>
      </div>
    )
  }

  return children
}
