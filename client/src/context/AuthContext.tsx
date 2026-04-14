import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '../lib/types'
import * as api from '../lib/api'

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      api.getMe()
        .then(u => setUser(u))
        .catch((err) => {
          // Only clear token on auth errors (401/403). Network/5xx errors should
          // preserve the token so the user isn't logged out by transient failures.
          const isAuthError = err instanceof Error && (err.message.includes('401') || err.message.includes('403'))
          if (isAuthError) {
            localStorage.removeItem('token')
            setToken(null)
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email: string, password: string) {
    const result = await api.login({ email, password })
    localStorage.setItem('token', result.token)
    setToken(result.token)
    setUser(result.user)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
