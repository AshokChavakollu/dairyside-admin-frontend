import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { subscriptionsApi } from '../../api'
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters'

export default function SubscriptionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // State
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchSubscription = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await subscriptionsApi.getById(id)
      setSub(res.data)
    } catch (err) {
      setError(err.message || 'Failed to load subscription details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const handleStatusChange = async (newStatus) => {
    const confirmation = window.confirm(`Are you sure you want to change the subscription status to "${newStatus}"?`)
    if (!confirmation) return

    setUpdating(true)
    try {
      await subscriptionsApi.updateStatus(id, { status: newStatus })
      // Re-fetch details to show updated status
      await fetchSubscription()
    } catch (err) {
      alert(err.message || 'Failed to update subscription status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading subscription details..." />
  if (error && !sub) return <EmptyState title="Subscription not found" description={error} />
  if (!sub) return null

  // Format custom days array or string if frequency is custom
  let customDaysText = '—'
  if (sub.frequency === 'custom' && sub.custom_days) {
    try {
      const days = typeof sub.custom_days === 'string' ? JSON.parse(sub.custom_days) : sub.custom_days
      if (Array.isArray(days)) {
        customDaysText = days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
      }
    } catch {
      customDaysText = String(sub.custom_days)
    }
  }

  const isPauseActive = sub.status === 'paused' || (sub.pause_start_date && sub.pause_end_date)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fadeIn">
      {/* Page Header */}
      <PageHeader
        title={`Subscription #${sub.id}`}
        subtitle={`Created on ${formatDate(sub.created_at)}`}
      >
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/subscriptions')}>
            ← Back to Subscriptions
          </Button>
          {sub.status === 'active' && (
            <>
              <Button variant="warning" size="sm" disabled={updating} onClick={() => handleStatusChange('paused')}>
                {updating ? 'Updating...' : 'Pause Schedule'}
              </Button>
              <Button variant="danger" size="sm" disabled={updating} onClick={() => handleStatusChange('cancelled')}>
                {updating ? 'Updating...' : 'Cancel Subscription'}
              </Button>
            </>
          )}
          {sub.status === 'paused' && (
            <>
              <Button variant="success" size="sm" disabled={updating} onClick={() => handleStatusChange('active')}>
                {updating ? 'Updating...' : 'Resume Schedule'}
              </Button>
              <Button variant="danger" size="sm" disabled={updating} onClick={() => handleStatusChange('cancelled')}>
                {updating ? 'Updating...' : 'Cancel Subscription'}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Main 2-Column Content Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
      }}>
        {/* Left Column: Subscription Parameters */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
            Subscription Parameters
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Product Name</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                {sub.product.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Variant: {sub.product.variant_label}
              </div>
              {sub.product.sku && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  SKU: {sub.product.sku}
                </div>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Quantity per delivery</span>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                {(() => {
                  const qty = Number(sub.quantity) || 1;
                  const sl = (sub.product?.variant_label || sub.size_label || sub.variant_label || '').toLowerCase().replace(/\s+/g, '');
                  if (sl.endsWith('ml')) {
                    const ml = parseFloat(sl) * qty;
                    return ml >= 1000 ? `${(ml/1000).toFixed(1).replace(/\.0$/,'')} L` : `${ml} ml`;
                  } else if (sl.endsWith('gm') || sl.endsWith('g')) {
                    const gm = parseFloat(sl) * qty;
                    return gm >= 1000 ? `${(gm/1000).toFixed(1).replace(/\.0$/,'')} kg` : `${gm} g`;
                  } else if (sl.endsWith('kg')) {
                    return `${(parseFloat(sl)*qty).toFixed(1).replace(/\.0$/,'')} kg`;
                  } else if (sl.endsWith('l')) {
                    return `${(parseFloat(sl)*qty).toFixed(1).replace(/\.0$/,'')} L`;
                  }
                  return `${qty} × ${sub.product?.variant_label || sub.size_label || sub.variant_label || 'unit'}`;
                })()}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                {sub.quantity} packets of {sub.product?.variant_label || sub.size_label || sub.variant_label || 'unit'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Frequency</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '4px', textTransform: 'capitalize' }}>
                {sub.frequency.replace(/_/g, ' ')}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Delivery Slot</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                {sub.delivery_slot}
              </div>
            </div>

            {sub.frequency === 'custom' && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Custom Delivery Days</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {customDaysText}
                </div>
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Duration</span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Start: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatDate(sub.start_date)}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                End: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sub.end_date ? formatDate(sub.end_date) : 'Ongoing'}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Price per Delivery</span>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary-light)', marginTop: '4px' }}>
                {formatCurrency(sub.price_per_delivery)}
              </div>
              {sub.discount_pct > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 500, marginTop: '2px' }}>
                  Discount: {sub.discount_pct}% off
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Details & Pause Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status and Actions Card */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Schedule Status</span>
              <div style={{ marginTop: '6px' }}>
                <StatusBadge status={sub.status} size="lg" />
              </div>
            </div>

            {sub.plan_days && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Plan Type</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {sub.plan_days} Days Plan
                </div>
              </div>
            )}
          </div>

          {/* Customer Info Card */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
              Subscriber Information
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                flexShrink: 0,
              }}>
                {getInitials(sub.customer.name)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{sub.customer.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{sub.customer.email}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Phone: {sub.customer.phone || '—'}
                </div>
              </div>
            </div>

            {sub.customer.id && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/customers/${sub.customer.id}`)}
                style={{ width: '100%', marginTop: '8px' }}
              >
                View Customer Profile
              </Button>
            )}
          </div>

          {/* Pause Details Card (If active pause exists) */}
          {isPauseActive && (sub.pause_start_date || sub.pause_end_date) && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.05)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-warning)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚠️ Scheduled Pause Details
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                This subscription has a configured pause range. Deliveries will automatically skip between the dates listed below:
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                padding: '10px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Pause From</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatDate(sub.pause_start_date)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Pause Until</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatDate(sub.pause_end_date)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
