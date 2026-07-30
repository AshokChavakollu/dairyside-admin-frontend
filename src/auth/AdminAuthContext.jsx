// Holds the admin identity for the panel and exposes it to the route guard.
//
// Auth state is resolved ASYNCHRONOUSLY (the API has to be asked), so there are
// three states, not two. The 'loading' one matters: treating "not yet known" as
// "signed out" would bounce an authenticated admin to /login on every refresh.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { fetchMe, login as doLogin, logout as doLogout } from './session'
import { resetSocket } from './adminSocket'

const AdminAuthContext = createContext(null)

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>')
  return ctx
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'authed' | 'anon'

  const refresh = useCallback(async () => {
    const me = await fetchMe()
    setAdmin(me)
    setStatus(me ? 'authed' : 'anon')
    // The live feed only exists for a verified admin. Opening it before we know
    // that would just produce a rejected handshake and a reconnect loop.
    resetSocket({ reconnect: Boolean(me) })
    return me
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const me = await doLogin(email, password)
    setAdmin(me)
    setStatus('authed')
    resetSocket({ reconnect: true }) // re-handshake now that the cookie exists
    return me
  }, [])

  const logout = useCallback(async () => {
    await doLogout()
    setAdmin(null)
    setStatus('anon')
    resetSocket() // close it — no live data to a signed-out browser
  }, [])

  return (
    <AdminAuthContext.Provider value={{ admin, status, login, logout, refresh }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
