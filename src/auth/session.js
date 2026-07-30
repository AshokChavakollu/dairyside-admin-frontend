// Admin session.
//
// Replaces the previous static-credentials gate, which compared against an email
// and password hardcoded in this file — values that shipped inside the deployed
// JS bundle and protected nothing, since the API itself was open.
//
// Now: Firebase verifies WHO you are, the admin API decides WHETHER you may
// administer (uid must be in its ADMIN_UIDS allowlist), and the resulting
// session lives in an httpOnly cookie this code cannot read. Authorisation is
// therefore not something the browser can assert — it is re-checked server-side
// on every request.
import axios from 'axios'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from './firebase'
import apiClient from '../api/apiClient'

// A bare client for the "am I signed in?" probe. apiClient's interceptor logs
// every rejection to the console, and a 401 here is the NORMAL answer for a
// signed-out visitor — not something to shout about on the login screen.
const probe = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/v1',
  timeout: 15000,
  withCredentials: true,
})

/**
 * Sign in. Firebase authenticates the credentials, then the API decides whether
 * this account is an admin and issues the session cookie.
 * @returns {Promise<{uid,email,name}>} the authorised admin
 * @throws {{message: string}} on bad credentials OR on a valid non-admin account
 */
export async function login(email, password) {
  let cred
  try {
    cred = await signInWithEmailAndPassword(auth, String(email).trim(), password)
  } catch {
    // Firebase distinguishes "no such user" from "wrong password"; we do not —
    // that difference tells an attacker which addresses have accounts.
    throw { message: 'Incorrect email or password' }
  }

  try {
    const body = await apiClient.post('/admin/auth/login', {
      idToken: await cred.user.getIdToken(),
    })
    return body?.data
  } catch (err) {
    // A real Firebase user who is not on the allowlist must not be left signed
    // in to Firebase — otherwise the panel holds a live identity for someone the
    // API will reject on every call.
    await signOut(auth).catch(() => {})
    throw { message: err?.message || 'Could not sign in' }
  }
}

/** End the session: clears the API cookie, then the local Firebase identity. */
export async function logout() {
  try {
    await apiClient.post('/admin/auth/logout')
  } catch {
    /* the cookie may already be gone; sign out locally regardless */
  }
  await signOut(auth).catch(() => {})
}

/**
 * Ask the API who we are. This is the ONLY source of truth for "am I signed in"
 * — there is no client-side flag to spoof.
 * @returns {Promise<{uid,email,name}|null>}
 */
export async function fetchMe() {
  try {
    const res = await probe.get('/admin/auth/me')
    return res.data?.data || null
  } catch {
    return null
  }
}
