import { useState, useEffect, useCallback } from 'react'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { reviewsApi } from '../../api'

/**
 * Customer reviews, and which of them appear on the home page.
 *
 * There is no "write a review" control here on purpose. Reviews come only from
 * customers with a delivered order for that product. The home page used to
 * carry three testimonials attributed to people who did not exist; the fix was
 * to make the section read real rows, so giving an admin a way to author one
 * would put the problem straight back.
 */

const Stars = ({ n }) => (
  <span style={{ color: '#f0a500', letterSpacing: '1px', fontSize: '0.8125rem' }} aria-label={`${n} out of 5`}>
    {'★'.repeat(n)}
    <span style={{ color: 'var(--border-default)' }}>{'★'.repeat(5 - n)}</span>
  </span>
)

const Toggle = ({ on, disabled, onClick, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    style={{
      width: 44, height: 24, borderRadius: 12, padding: 2, border: 'none',
      background: on ? 'var(--color-primary)' : 'var(--bg-tertiary)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'background var(--transition-fast)', flexShrink: 0,
    }}
  >
    <div style={{
      width: 20, height: 20, borderRadius: '50%', background: 'white',
      transform: on ? 'translateX(20px)' : 'translateX(0)',
      transition: 'transform var(--transition-fast)',
    }} />
  </button>
)

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [meta, setMeta] = useState({ featuredCount: 0, maxFeatured: 6 })
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [message, setMessage] = useState(null)
  const [onlyFeatured, setOnlyFeatured] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = { limit: 50 }
      if (onlyFeatured) params.featured = true
      const res = await reviewsApi.getReviews(params)
      setReviews(res.data || [])
      if (res.meta) setMeta(res.meta)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load reviews' })
    } finally {
      setLoading(false)
    }
  }, [onlyFeatured])

  useEffect(() => { load() }, [load])

  const toggleFeatured = async (review) => {
    const next = !review.is_featured
    try {
      setSavingId(review.id)
      setMessage(null)
      await reviewsApi.setFeatured(review.id, next)
      setReviews(prev => prev.map(r => (r.id === review.id ? { ...r, is_featured: next } : r)))
      setMeta(m => ({ ...m, featuredCount: m.featuredCount + (next ? 1 : -1) }))
      setMessage({
        type: 'success',
        text: next
          ? 'Featured. It appears on the home page within a minute.'
          : 'Removed from the home page (within a minute).',
      })
    } catch (err) {
      // The API refuses a 7th feature, an unpublished review, and a review with
      // no written text. Those messages are written for a human, so show them
      // as-is rather than replacing them with something generic.
      setMessage({ type: 'error', text: err.message || 'Could not update this review' })
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <LoadingSpinner text="Loading reviews..." />

  const full = meta.featuredCount >= meta.maxFeatured

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle="Real customer reviews. Choose which appear on the home page."
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px',
          borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 600,
          background: full ? 'var(--color-warning-light, var(--bg-tertiary))' : 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
        }}>
          {meta.featuredCount} of {meta.maxFeatured} home page slots used
        </div>
      </PageHeader>

      {message && (
        <div role="alert" style={{
          background: message.type === 'success' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
          color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16,
          fontSize: '0.8125rem', fontWeight: 500,
        }}>
          {message.text}
        </div>
      )}

      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
        fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={onlyFeatured}
          onChange={e => setOnlyFeatured(e.target.checked)}
        />
        Show only featured
      </label>

      {reviews.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', padding: '40px 20px', textAlign: 'center',
          color: 'var(--text-tertiary)', fontSize: '0.875rem',
        }}>
          {onlyFeatured
            ? 'No reviews are featured yet. Clear the filter and pick one.'
            : 'No customer reviews yet. They appear here once customers review a delivered order.'}
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)', overflow: 'hidden',
        }}>
          {reviews.map((r, i) => {
            const noText = !r.body || !String(r.body).trim()
            // A review can only be blocked from being featured, never from
            // being unfeatured — otherwise a review that later loses its text
            // or gets unpublished would be stuck on the home page.
            const blocked = !r.is_featured && (noText || r.status !== 'published' || full)

            return (
              <div
                key={r.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                style={{
                  padding: '16px 20px',
                  borderBottom: i < reviews.length - 1 ? '1px solid var(--border-default)' : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <Stars n={r.rating} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {r.product_name || 'Product removed'}
                    </span>
                    {r.order_id && (
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em',
                        color: 'var(--color-success)', background: 'var(--color-success-light)',
                        padding: '2px 8px', borderRadius: 999,
                      }}>
                        VERIFIED PURCHASE
                      </span>
                    )}
                    {r.status !== 'published' && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                        {String(r.status).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {r.title && (
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                      {r.title}
                    </div>
                  )}

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {noText
                      ? <em style={{ color: 'var(--text-tertiary)' }}>Rating only — no written review, so it cannot be a testimonial.</em>
                      : `"${r.body}"`}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
                    {r.author_name || 'Anonymous'} · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {r.is_featured ? 'On home page' : 'Hidden'}
                  </span>
                  <Toggle
                    on={r.is_featured}
                    disabled={savingId === r.id || blocked}
                    onClick={() => toggleFeatured(r)}
                    label={`Feature review by ${r.author_name || 'customer'} on the home page`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
