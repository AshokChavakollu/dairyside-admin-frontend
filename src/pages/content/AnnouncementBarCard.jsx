import { ANNOUNCEMENT_MESSAGE_MAX } from './announcementSettings'

// ─── Variant palette ───
// A copy of the customer app's VARIANTS map
// (MernApp1-Grocery-frontend → src/components/layout/AnnouncementBar.jsx).
// It has to be duplicated — separate repos, separate bundles — so the preview
// below is only honest as long as the two stay identical. Change one, change
// both. Every gradient uses 700-level shades so white text clears WCAG AA on
// the live bar; the preview inherits that automatically by using the same
// values rather than approximating them.
const VARIANTS = {
  maintenance: {
    label: 'Maintenance',
    hint: 'Something is paused or being worked on',
    gradient: 'linear-gradient(90deg, #b45309 0%, #c2410c 100%)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  info: {
    label: 'Info',
    hint: 'Neutral news — a new feature, a notice',
    gradient: 'linear-gradient(90deg, #1e40af 0%, #1d4ed8 100%)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  warning: {
    label: 'Warning',
    hint: 'Something the customer should act on',
    gradient: 'linear-gradient(90deg, #a16207 0%, #b45309 100%)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  success: {
    label: 'Good news',
    hint: 'Back to normal, or a positive update',
    gradient: 'linear-gradient(90deg, #15803d 0%, #166534 100%)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
}

// The page's existing pill switch, lifted out so the master toggle and the
// dismissible toggle are visibly the same control.
function Toggle({ checked, onChange, label, id }) {
  return (
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: '12px', padding: '2px', cursor: 'pointer',
          border: 'none', flexShrink: 0,
          background: checked ? 'var(--color-primary)' : 'var(--bg-tertiary)',
          transition: 'background var(--transition-fast)',
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: 'white',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform var(--transition-fast)',
        }} />
      </button>
      {label && (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</span>
      )}
    </label>
  )
}

/**
 * Composer for the strip that sits above the header on the customer site.
 *
 * It is the one place an operator can say "ordering is paused" or "this section
 * is still being built" to every visitor without a deploy — which is what it is
 * for while parts of the shop are unfinished.
 *
 * The bar only INFORMS. Switching it on does not stop anyone ordering, so the
 * copy has to be true on its own: if checkout still works, don't write that it
 * doesn't. (`Maintenance Mode` further down the page is the separate switch for
 * actually restricting the shop.)
 *
 * Values are read/written as strings because `app_settings` stores TEXT and the
 * rest of this page speaks the same 'true'/'false' dialect.
 *
 * @param {object} values   { [key]: string } for the four announcement keys
 * @param {(key: string, value: string) => void} onChange
 */
export default function AnnouncementBarCard({ values, onChange }) {
  const enabled = values.announcement_enabled === 'true'
  const dismissible = values.announcement_dismissible === 'true'
  const message = values.announcement_message ?? ''
  const variant = VARIANTS[values.announcement_variant] ? values.announcement_variant : 'maintenance'
  const active = VARIANTS[variant]

  const over = message.length > ANNOUNCEMENT_MESSAGE_MAX
  // Enabled with nothing to say is rejected by the API — say so before Save
  // rather than letting the request come back red.
  const empty = enabled && !message.trim()

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
        marginBottom: '20px',
      }}
    >
      {/* ── Header + master switch ── */}
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: 0 }}>
              Customer App Announcement
            </h2>
            <span style={{
              fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '2px 7px', borderRadius: '999px',
              background: enabled ? 'var(--color-success-light)' : 'var(--bg-tertiary)',
              color: enabled ? 'var(--color-success)' : 'var(--text-tertiary)',
            }}>
              {enabled ? 'Live' : 'Off'}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
            The strip every visitor sees above the header on dairyside.in
          </p>
        </div>

        <Toggle id="announcement-enabled" checked={enabled} label={enabled ? 'Showing' : 'Hidden'}
          onChange={(next) => onChange('announcement_enabled', next ? 'true' : 'false')} />
      </div>

      <div style={{ padding: '20px' }}>
        {/* ── Live preview ──
            Rendered from the same gradients, icon set and layout as the real
            component so what is approved here is what ships. Dimmed rather than
            hidden while the bar is off: an operator writing tomorrow's notice
            still needs to see it, and greying it out is what says "not live". */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{
            fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--text-tertiary)', marginBottom: '8px',
          }}>
            Preview
          </div>

          <div style={{
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            border: '1px solid var(--border-default)',
            opacity: enabled ? 1 : 0.45,
            transition: 'opacity var(--transition-base)',
          }}>
            <div style={{
              position: 'relative', background: active.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', padding: '10px 40px', minHeight: '44px',
            }}>
              <span style={{ display: 'flex', color: 'rgba(255,255,255,0.9)', flexShrink: 0 }}>
                {active.icon}
              </span>
              <p style={{
                margin: 0, textAlign: 'center', color: '#fff', fontSize: '0.8125rem',
                fontWeight: 600, lineHeight: 1.4, letterSpacing: '0.01em',
              }}>
                {message.trim() || 'Your message will appear here…'}
              </p>
              {dismissible && (
                <span aria-hidden="true" style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.8)', display: 'flex',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
              )}
            </div>
          </div>

          <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
            The live bar also carries a slow highlight sweep, which is not shown here.
          </p>
        </div>

        {/* ── Tone ── */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
            Tone
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
            {active.hint}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(VARIANTS).map(([key, v]) => {
              const selected = key === variant
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange('announcement_variant', key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '9px 11px', cursor: 'pointer', textAlign: 'left',
                    borderRadius: 'var(--radius-sm)',
                    background: selected ? 'var(--bg-tertiary)' : 'transparent',
                    // Ring rather than a tick: the swatch is the thing being
                    // chosen, so the selection has to read on the colour itself.
                    border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--border-default)'}`,
                    boxShadow: selected ? '0 0 0 1px var(--color-primary)' : 'none',
                    color: 'var(--text-primary)', fontFamily: 'inherit',
                    fontSize: '0.8125rem', fontWeight: 600,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: '6px', flexShrink: 0,
                    background: v.gradient,
                  }} />
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Message ── */}
        <div style={{ marginBottom: '18px' }}>
          <label htmlFor="announcement-message" style={{
            display: 'block', fontSize: '0.8125rem', fontWeight: 600,
            color: 'var(--text-primary)', marginBottom: '2px',
          }}>
            Message
          </label>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            One sentence. It is shown to signed-out visitors too, so avoid anything internal.
          </div>

          <textarea
            id="announcement-message"
            rows={2}
            value={message}
            maxLength={ANNOUNCEMENT_MESSAGE_MAX + 40} // room to overrun so the counter can warn
            onChange={(e) => onChange('announcement_message', e.target.value)}
            placeholder="Ordering is temporarily disabled for maintenance. You can still browse and add items to your cart!"
            style={{
              width: '100%', background: 'var(--bg-tertiary)',
              border: `1px solid ${over || empty ? 'var(--color-danger)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)',
              fontSize: '0.8125rem', fontFamily: 'inherit', lineHeight: 1.5,
              outline: 'none', resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '6px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-danger)' }}>
              {empty ? 'A message is required while the bar is showing.' : ''}
            </span>
            <span style={{
              fontSize: '0.6875rem', fontVariantNumeric: 'tabular-nums',
              color: over ? 'var(--color-danger)' : 'var(--text-tertiary)',
            }}>
              {message.length} / {ANNOUNCEMENT_MESSAGE_MAX}
            </span>
          </div>
        </div>

        {/* ── Dismissible ── */}
        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          style={{
            padding: '14px 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
              Let customers close it
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Adds a ✕. It comes back on their next visit, and a NEW message always shows again
              even to someone who closed the last one. Leave off for a notice they must not miss.
            </div>
          </div>
          <Toggle
            id="announcement-dismissible"
            checked={dismissible}
            label={dismissible ? 'Closeable' : 'Always on'}
            onChange={(next) => onChange('announcement_dismissible', next ? 'true' : 'false')}
          />
        </div>

        <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '12px' }}>
          Changes take up to a minute to reach customers — the storefront caches this
          so it does not query the database on every page load.
        </p>
      </div>
    </section>
  )
}
