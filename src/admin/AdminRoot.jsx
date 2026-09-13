import { Outlet } from 'react-router-dom'
import AuthProvider from './AuthProvider.jsx'

export default function AdminRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
