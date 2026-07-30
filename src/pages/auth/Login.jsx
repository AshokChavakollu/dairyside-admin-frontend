import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../auth/AdminAuthContext'

const LOGO_URL =
  'https://res.cloudinary.com/jkew0usj/image/upload/f_png,h_96/v1784492249/dairyside/logo/dairyside2_qodnwa.svg'

const EyeIcon = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      // Real round trip now (Firebase, then the admin API's allowlist check) —
      // the old artificial delay that made the button "feel" like a sign-in is
      // no longer needed.
      await login(email, password)
      const dest = location.state?.from?.pathname || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      // Covers both bad credentials and a valid account that is not an admin;
      // the API's message distinguishes them.
      setError(err?.message || 'Could not sign in')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setBusy(false)
    }
  }

  const inputWrap = {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    padding: '0 14px',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
  }

  const inputStyle = {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit',
    padding: '13px 0', letterSpacing: '0.01em',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', padding: '24px',
    }}>
      {/* Ambient glow orbs */}
      <div style={{
        position: 'absolute', top: '-180px', right: '-120px', width: '480px', height: '480px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-200px', left: '-140px', width: '520px', height: '520px',
        background: 'radial-gradient(circle, rgba(22,163,74,0.12), transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      {/* Subtle grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.35,
        backgroundImage: 'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }} />

      <style>{`
        @keyframes loginCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-9px); } 40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); } 80% { transform: translateX(4px); }
        }
        @keyframes spinnerRotate { to { transform: rotate(360deg); } }
        .login-field:focus-within {
          border-color: var(--color-primary) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
        }
        .login-btn:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
        .login-btn:active:not(:disabled) { transform: scale(0.985); }
      `}</style>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1,
        background: 'linear-gradient(180deg, rgba(30,41,59,0.92), rgba(30,41,59,0.78))',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: '20px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.02) inset',
        padding: '40px 36px 32px',
        animation: `loginCardIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both${shake ? ', loginShake 0.45s ease' : ''}`,
      }}>
        {/* Logo on a soft white chip so the brand colors read on dark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '22px' }}>
          <div style={{
            background: '#ffffff', borderRadius: '14px', padding: '12px 22px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
          }}>
            <img src={LOGO_URL} alt="DairySide" style={{ height: '40px', display: 'block' }} />
          </div>
        </div>

        <h1 style={{
          margin: 0, textAlign: 'center', fontSize: '1.35rem', fontWeight: 800,
          color: 'var(--text-primary)', letterSpacing: '-0.01em',
        }}>
          Admin Console
        </h1>
        <p style={{
          margin: '6px 0 28px', textAlign: 'center', fontSize: '0.83rem',
          color: 'var(--text-secondary)', lineHeight: 1.5,
        }}>
          Sign in to manage orders, subscriptions & deliveries
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '7px' }}>
            Email
          </label>
          <div className="login-field" style={{ ...inputWrap, marginBottom: '18px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              style={inputStyle}
              type="email"
              placeholder="you@dairyside.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          {/* Password */}
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '7px' }}>
            Password
          </label>
          <div className="login-field" style={{ ...inputWrap, marginBottom: error ? '12px' : '26px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              style={inputStyle}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'grid', placeItems: 'center', padding: '4px' }}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>

          {error && (
            <div role="alert" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', borderRadius: 'var(--radius-md)',
              padding: '10px 14px', fontSize: '0.8rem', fontWeight: 500, marginBottom: '20px',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            className="login-btn"
            type="submit"
            disabled={busy}
            style={{
              width: '100%', border: 'none', cursor: busy ? 'default' : 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit',
              padding: '14px', borderRadius: 'var(--radius-md)', letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              opacity: busy ? 0.85 : 1,
              transition: 'filter var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast)',
            }}
          >
            {busy && (
              <span style={{
                width: 16, height: 16, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#ffffff',
                animation: 'spinnerRotate 0.7s linear infinite', display: 'inline-block',
              }} />
            )}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{
          marginTop: '26px', paddingTop: '18px', borderTop: '1px solid rgba(148,163,184,0.12)',
          textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-tertiary)', letterSpacing: '0.02em',
        }}>
          DairySide Admin · Authorized personnel only
        </div>
      </div>
    </div>
  )
}
