// Live operational feed for the panel. One shared Socket.IO connection.
//
// The connection carries the admin session cookie and the server REJECTS an
// unverified handshake — so unlike the storefront's socket there is no
// anonymous mode to fall back to. A failed connection simply means no live
// feed; every screen still works from its normal REST fetch.
import { io } from 'socket.io-client'

// Socket connects to the API ORIGIN, not the /v1 path.
function apiOrigin() {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/v1'
  return base.replace(/\/v1\/?$/, '')
}

let socket = null
const handlers = new Map() // event -> Set<fn>

function bind(s) {
  handlers.forEach((set, name) => set.forEach((fn) => s.on(name, fn)))
}

export function getSocket() {
  if (socket) return socket
  socket = io(apiOrigin(), {
    path: '/socket.io',
    withCredentials: true, // carries ds_admin_session into the handshake
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  })
  bind(socket)
  return socket
}

/** Register a feed handler. Survives reconnects and resets. */
export function onEvent(name, fn) {
  if (!handlers.has(name)) handlers.set(name, new Set())
  handlers.get(name).add(fn)
  if (socket) socket.on(name, fn)
  return () => {
    handlers.get(name)?.delete(fn)
    if (socket) socket.off(name, fn)
  }
}

/**
 * Drop the connection (on logout) or remake it (on login). Identity is fixed at
 * handshake time, so a socket opened while signed out can never become
 * authorised — and one left open after logout would keep streaming operational
 * data to a signed-out browser.
 */
export function resetSocket({ reconnect = false } = {}) {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  if (reconnect) getSocket()
}
