import { useState, useEffect, useCallback } from 'react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import StatsCard from '../../components/common/StatsCard'
import Modal from '../../components/common/Modal'
import { farmVisitApi } from '../../api'

// Mirrors the ENUM in migrations/018. Cancelling is handled separately because
// it is the only transition that moves seats.
const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED']

// StatusBadge keys are lowercase; NO_SHOW has no entry and falls back to the
// neutral 'pending' style, which is fine — it is a rare, non-urgent state.
const badgeStatus = (s) => String(s || '').toLowerCase()

const formatDate = (ymd) => {
  if (!ymd) return '—'
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number)
  // Built and read in UTC so the farm's calendar day is not shifted by the
  // operator's browser timezone.
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

const formatTime = (t) => {
  if (!t) return ''
  const [h, m] = String(t).split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function FarmVisitBookings() {
  const [bookings, setBookings] = useState([])
  const [pagination, setPagination] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', search: '', from: '', to: '' })
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const fetchBookings = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 20 }
    // Only send filters that are set — an empty string would fail Joi's enum.
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })

    farmVisitApi
      .getBookings(params)
      .then((res) => {
        setBookings(res.data || [])
        setPagination(res.pagination || null)
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [page, filters])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  useEffect(() => {
    farmVisitApi.getBookingStats(1).then((res) => setStats(res.data)).catch(() => setStats(null))
  }, [bookings])

  const setFilter = (key, value) => {
    setPage(1) // a filtered result set has different pages
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const changeStatus = async (booking, status) => {
    setError('')
    // Cancelling releases seats and cannot be undone — worth one confirmation.
    if (status === 'CANCELLED') {
      const seats = booking.seats
      if (!window.confirm(
        `Cancel ${booking.booking_ref} and release ${seats} seat${seats === 1 ? '' : 's'}?\n\n` +
        `${booking.visitor_name} · ${formatDate(booking.visit_date)}\n\n` +
        `The seats go back into the slot immediately. This cannot be undone.`
      )) return
    }

    try {
      setBusy(true)
      await farmVisitApi.updateBookingStatus(booking.id, status)
      setSelected(null)
      fetchBookings()
    } catch (err) {
      setError(err.message || 'Could not update this booking')
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'booking_ref',
      header: 'Reference',
      minWidth: 130,
      render: (v) => (
        <span style={{ fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>{v}</span>
      ),
    },
    {
      key: 'visitor_name',
      header: 'Visitor',
      minWidth: 180,
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.visitor_phone}</div>
        </div>
      ),
    },
    {
      key: 'visit_date',
      header: 'Visit',
      minWidth: 170,
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{formatDate(v)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {formatTime(row.start_time)} – {formatTime(row.end_time)}
          </div>
        </div>
      ),
    },
    {
      key: 'seats',
      header: 'Party',
      minWidth: 110,
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{v} seat{v === 1 ? '' : 's'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {row.adults}A{row.children > 0 ? ` · ${row.children}C` : ''}
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', minWidth: 120, render: (v) => <StatusBadge status={badgeStatus(v)} /> },
    {
      key: 'actions',
      header: '',
      minWidth: 90,
      render: (_, row) => (
        <Button variant="secondary" size="sm" onClick={() => setSelected(row)}>View</Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Farm Visit Bookings"
        subtitle="Who is coming, when, and how many seats they hold"
        actions={<Button variant="secondary" onClick={fetchBookings} disabled={loading}>Refresh</Button>}
      />

      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <StatsCard title="Total bookings" value={stats.total} />
          {/* Cancelled bookings hold no seats, so this is the real headcount. */}
          <StatsCard title="Seats held" value={stats.seats} />
          <StatsCard title="Confirmed" value={stats.by_status?.CONFIRMED?.count ?? 0} />
          <StatsCard title="Cancelled" value={stats.by_status?.CANCELLED?.count ?? 0} />
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
          padding: '16px', background: 'var(--bg-card)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
        }}
      >
        <input
          type="search"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Reference, name or phone"
          aria-label="Search bookings"
          style={inputStyle}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          aria-label="Filter by status"
          style={inputStyle}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <input
          type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)}
          aria-label="Visits from" style={inputStyle}
        />
        <input
          type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)}
          aria-label="Visits until" style={inputStyle}
        />
        {(filters.search || filters.status || filters.from || filters.to) && (
          <Button variant="secondary" size="sm" onClick={() => { setPage(1); setFilters({ status: '', search: '', from: '', to: '' }) }}>
            Clear
          </Button>
        )}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        emptyTitle="No bookings yet"
        emptyDescription="Visits booked on the storefront will appear here."
        pagination={pagination}
        onPageChange={setPage}
      />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Booking ${selected.booking_ref}` : ''}
        size="md"
      >
        {selected && (
          <div>
            <dl style={{ display: 'grid', gap: '10px' }}>
              <Row label="Visitor" value={selected.visitor_name} />
              <Row label="Phone" value={selected.visitor_phone} />
              <Row label="Email" value={selected.visitor_email || '—'} />
              <Row label="Date" value={formatDate(selected.visit_date)} />
              <Row label="Time" value={`${formatTime(selected.start_time)} – ${formatTime(selected.end_time)}`} />
              <Row label="Visit type" value={String(selected.visit_type || '').replace('_', ' ')} />
              <Row label="Party" value={`${selected.adults} adult(s)${selected.children ? `, ${selected.children} child(ren)` : ''} — ${selected.seats} seats`} />
              <Row label="Cost" value={selected.amount_total > 0 ? `₹${selected.amount_total.toFixed(2)}` : 'Free'} />
              <Row label="Status" value={<StatusBadge status={badgeStatus(selected.status)} />} />
            </dl>

            {selected.special_requests && (
              <div
                style={{
                  marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)', fontSize: '0.875rem', color: 'var(--text-secondary)',
                }}
              >
                <strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-primary)' }}>
                  Special requests
                </strong>
                {selected.special_requests}
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selected.status === 'CANCELLED' ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  This booking is cancelled and its seats have been released. It can't be reinstated —
                  the visitor needs to book again.
                </p>
              ) : (
                <>
                  {selected.status !== 'CONFIRMED' && (
                    <Button size="sm" onClick={() => changeStatus(selected, 'CONFIRMED')} disabled={busy}>
                      Mark confirmed
                    </Button>
                  )}
                  {selected.status !== 'COMPLETED' && (
                    <Button variant="secondary" size="sm" onClick={() => changeStatus(selected, 'COMPLETED')} disabled={busy}>
                      Mark completed
                    </Button>
                  )}
                  {selected.status !== 'NO_SHOW' && (
                    <Button variant="secondary" size="sm" onClick={() => changeStatus(selected, 'NO_SHOW')} disabled={busy}>
                      No show
                    </Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => changeStatus(selected, 'CANCELLED')} disabled={busy}>
                    Cancel &amp; release seats
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

const inputStyle = {
  minHeight: 40,
  padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
}

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}>
    <dt style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</dt>
    <dd style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>{value}</dd>
  </div>
)

const ErrorNote = ({ children }) => (
  <div
    role="alert"
    style={{
      marginBottom: '16px', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
      background: '#fee2e2', color: '#b91c1c', fontSize: '0.875rem',
    }}
  >
    {children}
  </div>
)
