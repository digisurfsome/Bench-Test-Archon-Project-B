import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Team Task Manager</h1>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/tasks" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Tasks</Link>
            <Link to="/teams" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Teams</Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Dashboard</Link>
            <span className="text-gray-400 text-sm">{user?.name}</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
          </div>
          <button
            className="md:hidden text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            &#9776;
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden mt-3 flex flex-col gap-3 px-2 pb-2">
            <Link to="/tasks" className="text-gray-700 text-sm" onClick={() => setMobileOpen(false)}>Tasks</Link>
            <Link to="/teams" className="text-gray-700 text-sm" onClick={() => setMobileOpen(false)}>Teams</Link>
            <Link to="/dashboard" className="text-gray-700 text-sm" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            <button onClick={handleLogout} className="text-sm text-red-600 text-left">Logout</button>
          </div>
        )}
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
