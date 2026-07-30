// Firebase client for the admin panel. Same project as the customer app — an
// admin is simply a Firebase user whose uid is listed in the API's ADMIN_UIDS.
//
// These VITE_* values are PUBLIC by design (they ship in the bundle, exactly as
// they do in the storefront). They identify the project; they do not grant
// anything. Authorisation happens server-side against the allowlist.
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

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// The API session lives in an httpOnly cookie, so Firebase's own persisted
// login is only needed long enough to mint it. Session-scoped persistence keeps
// a closed tab from leaving a resumable admin identity in localStorage.
setPersistence(auth, browserSessionPersistence).catch(() => {
  /* non-fatal: falls back to the default persistence */
})

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
