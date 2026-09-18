import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, SUBSCRIPTION_STATUS } from '../../utils/constants'

const statusStyles = {
  active: { bg: '#d1fae5', text: '#059669', dot: '#10b981' },
  paused: { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
  cancelled: { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
  expired: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
  pending: { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
  confirmed: { bg: '#dbeafe', text: '#2563eb', dot: '#3b82f6' },
  processing: { bg: '#fef3c7', text: '#d97706', dot: '#d97706' },
  out_for_delivery: { bg: '#dbeafe', text: '#2563eb', dot: '#2563eb' },
  delivered: { bg: '#d1fae5', text: '#059669', dot: '#10b981' },
  returned: { bg: '#fce7f3', text: '#db2777', dot: '#db2777' },
  paid: { bg: '#d1fae5', text: '#059669', dot: '#10b981' },
  failed: { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
  refunded: { bg: '#dbeafe', text: '#2563eb', dot: '#3b82f6' },
  resolved: { bg: '#d1fae5', text: '#059669', dot: '#10b981' },
  claimed: { bg: '#e0e7ff', text: '#4f46e5', dot: '#6366f1' },
  scheduled: { bg: '#e0f2fe', text: '#0369a1', dot: '#0ea5e9' },
  // Monthly milk bills: what is still owed on them.
  unpaid: { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
  partial: { bg: '#e0f2fe', text: '#0369a1', dot: '#0ea5e9' },
  overdue: { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const style = statusStyles[status] || statusStyles.pending
  const label = ORDER_STATUS_LABELS[status] || (status?.charAt(0).toUpperCase() + status?.slice(1).replace(/_/g, ' ')) || 'Unknown'

  const sizes = {
    sm: { fontSize: '0.7rem', padding: '3px 10px', dotSize: 6 },
    md: { fontSize: '0.8rem', padding: '4px 12px', dotSize: 7 },
    lg: { fontSize: '0.875rem', padding: '6px 14px', dotSize: 8 },
  }

  const s = sizes[size]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: style.bg,
        color: style.text,
        fontSize: s.fontSize,
        fontWeight: 600,
        padding: s.padding,
        borderRadius: '20px',
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      <span style={{
        width: s.dotSize,
        height: s.dotSize,
        borderRadius: '50%',
        background: style.dot,
        flexShrink: 0,
      }} />
      {label}
    </span>
  )
}
