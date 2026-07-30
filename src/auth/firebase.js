// Firebase client for the admin panel. Same project as the customer app — an
// admin is simply a Firebase user whose uid is listed in the API's ADMIN_UIDS.
//
// These VITE_* values are PUBLIC by design (they ship in the bundle, exactly as
// they do in the storefront). They identify the project; they do not grant
// anything. Authorisation happens server-side against the allowlist.
//
// Initialisation is LAZY and deliberately so. Calling initializeApp() at module
// scope means a deployment missing VITE_FIREBASE_* throws while main.jsx is
// still being imported — before React mounts — which renders the whole panel as
// a blank page with no clue as to why. Nothing here runs until someone actually
// tries to sign in, so a misconfigured build degrades to a readable error on the
// login form instead of a dead screen. (And when the API is in open mode, the
// panel stays fully usable without Firebase at all.)
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

export const FIREBASE_NOT_CONFIGURED =
  'Sign-in is unavailable: this deployment is missing its Firebase settings ' +
  '(VITE_FIREBASE_* environment variables). Set them on the hosting project and redeploy.'

let authInstance = null

/**
 * The Firebase Auth instance, created on first use.
 * @throws {Error} with a human-readable message when the build has no config
 */
export function getFirebaseAuth() {
  if (!isFirebaseConfigured) throw new Error(FIREBASE_NOT_CONFIGURED)
  if (authInstance) return authInstance

  authInstance = getAuth(initializeApp(firebaseConfig))
  // The API session lives in an httpOnly cookie, so Firebase's own persisted
  // login is only needed long enough to mint it. Session-scoped persistence
  // keeps a closed tab from leaving a resumable admin identity in localStorage.
  setPersistence(authInstance, browserSessionPersistence).catch(() => {
    /* non-fatal: falls back to the default persistence */
  })
  return authInstance
}
