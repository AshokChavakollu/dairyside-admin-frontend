import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '../../utils/constants'

// ─── SVG Icon Map ───
const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  orders: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><path d="M9 14l2 2 4-4" />
    </svg>
  ),
  products: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  customers: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  subscriptions: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
    </svg>
  ),
  deliveries: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  coupons: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  payments: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  content: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  area: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  messages: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  audit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  reports: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  chevronDown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
}

export default function Sidebar({ isDesktop = true, collapsed, mobileOpen, onToggleCollapse, onCloseMobile }) {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState({})

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const isParentActive = (item) => {
    if (item.children) {
      return item.children.some(child => isActive(child.path))
    }
    return isActive(item.path)
  }

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-default)',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        // Desktop: always in-flow (content is pushed by margin). Mobile: slide
        // the whole drawer off-canvas unless opened via the hamburger.
        transform: isDesktop ? 'none' : mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform var(--transition-base), width var(--transition-base)',
        overflow: 'hidden',
        boxShadow: !isDesktop && mobileOpen ? '0 0 40px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid var(--border-default)',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1rem',
            color: 'white',
            flexShrink: 0,
          }}
        >
          DS
        </div>
        {!collapsed && (
          <div style={{ animation: 'fadeIn 200ms ease' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              DairySide
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Admin Panel
            </div>
          </div>
        )}

        {/* Close button — mobile drawer only */}
        {!isDesktop && (
          <button
            onClick={onCloseMobile}
            aria-label="Close menu"
            style={{
              marginLeft: 'auto', display: 'grid', placeItems: 'center',
              width: 36, height: 36, borderRadius: 'var(--radius-sm)', flexShrink: 0,
              background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {NAV_ITEMS.map(item => (
          <div key={item.id}>
            {item.children ? (
              <>
                {/* Parent with children */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: collapsed ? '10px 14px' : '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isParentActive(item) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: isParentActive(item) ? 'var(--color-primary-light)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: isParentActive(item) ? 600 : 500,
                    transition: 'all var(--transition-fast)',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    if (!isParentActive(item)) e.target.style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={e => {
                    if (!isParentActive(item)) e.target.style.background = 'transparent'
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span style={{ flexShrink: 0, display: 'flex' }}>{icons[item.icon]}</span>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                      <span style={{
                        transform: expandedItems[item.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform var(--transition-fast)',
                        display: 'flex',
                      }}>
                        {icons.chevronDown}
                      </span>
                    </>
                  )}
                </button>

                {/* Children */}
                {!collapsed && expandedItems[item.id] && (
                  <div style={{ paddingLeft: '44px', display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
                    {item.children.map(child => (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        onClick={onCloseMobile}
                        style={{
                          display: 'block',
                          padding: '7px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          fontWeight: isActive(child.path) ? 600 : 400,
                          color: isActive(child.path) ? 'var(--color-primary-light)' : 'var(--text-tertiary)',
                          background: isActive(child.path) ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                          textDecoration: 'none',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={e => {
                          if (!isActive(child.path)) {
                            e.target.style.color = 'var(--text-secondary)'
                            e.target.style.background = 'rgba(255,255,255,0.03)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive(child.path)) {
                            e.target.style.color = 'var(--text-tertiary)'
                            e.target.style.background = 'transparent'
                          }
                        }}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Single nav link */
              <NavLink
                to={item.path}
                end={item.path === '/'}
                onClick={onCloseMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: collapsed ? '10px 14px' : '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive(item.path) ? 600 : 500,
                  color: isActive(item.path) ? 'var(--color-primary-light)' : 'var(--text-secondary)',
                  background: isActive(item.path)
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))'
                    : 'transparent',
                  transition: 'all var(--transition-fast)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive(item.path)) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={e => {
                  if (!isActive(item.path)) e.currentTarget.style.background = 'transparent'
                }}
                title={collapsed ? item.label : undefined}
              >
                {isActive(item.path) && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    borderRadius: '0 3px 3px 0',
                    background: 'var(--color-primary)',
                  }} />
                )}
                <span style={{ flexShrink: 0, display: 'flex' }}>{icons[item.icon]}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle — desktop only (mobile uses the close button / overlay) */}
      {isDesktop && (
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--border-default)',
        flexShrink: 0,
      }}>
        <button
          onClick={onToggleCollapse}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            fontFamily: 'inherit',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.04)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}>
            <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
      )}
    </aside>
  )
}
