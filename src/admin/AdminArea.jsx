import RequireAuth from './RequireAuth.jsx'
import AdminLayout from './AdminLayout.jsx'

export default function AdminArea() {
  return (
    <RequireAuth>
      <AdminLayout />
    </RequireAuth>
  )
}
