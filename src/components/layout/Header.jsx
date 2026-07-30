import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAdminAuth } from '../../auth/AdminAuthContext'

export default function Header({ showHamburger, onHamburger }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAdminAuth()

  // Await the logout so the API cookie is actually cleared before we navigate —
  // otherwise the redirect can race the request and leave the session alive.
  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  // Build breadcrumb from path
  const pathParts = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = pathParts.map((part, i) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    path: '/' + pathParts.slice(0, i + 1).join('/'),
  }))

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '0 24px',
        height: 'var(--header-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-default)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex min-w-0 items-center gap-2">
        {showHamburger && (
          <button
            onClick={onHamburger}
            aria-label="Open menu"
            style={{
              display: 'grid', placeItems: 'center', width: 40, height: 40, flexShrink: 0,
              borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <div className="flex min-w-0 items-center gap-1.5 truncate text-[0.8125rem]">
          <Link to="/" className="hidden shrink-0 sm:inline-flex" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', alignItems: 'center', transition: 'color var(--transition-fast)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <span
                key={i}
                className={isLast ? 'flex items-center gap-1.5 truncate' : 'hidden items-center gap-1.5 sm:flex'}
              >
                <span className="hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>/</span>
                {isLast ? (
                  <span
                    className="truncate"
                    style={{
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="truncate"
                    style={{
                      color: 'var(--text-tertiary)',
                      fontWeight: 400,
                      textDecoration: 'none',
                      transition: 'color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            )
          })}
          {breadcrumbs.length === 0 && (
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Dashboard</span>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Search — md+ only (drops on phones to save room) */}
        <div
          className="hidden md:flex"
          style={{
            alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)', padding: '8px 14px', width: '220px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.8125rem', fontFamily: 'inherit', width: '100%' }}
          />
          <kbd style={{ background: 'var(--bg-secondary)', borderRadius: '4px', padding: '1px 6px', fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontFamily: 'inherit', border: '1px solid var(--border-default)' }}>⌘K</kbd>
        </div>

        {/* Notification bell */}
        <button
          aria-label="Notifications"
          style={{
            width: 40, height: 40, borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--color-danger)', border: '2px solid var(--bg-secondary)' }} />
        </button>

        {/* Admin avatar — label hidden on small screens */}
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 700, color: 'white', flexShrink: 0,
            }}
          >
            A
          </div>
          <div className="hidden lg:block" style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Admin</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>admin@dairyside.in</div>
          </div>
        </div>

        {/* Logout — icon-only on small, full on sm+ */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px', minHeight: 40,
            background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)', padding: '8px 12px', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-danger)'; e.currentTarget.style.color = 'var(--color-danger)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
