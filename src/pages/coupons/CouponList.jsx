import { useState, useEffect, useCallback } from 'react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import FormGrid from '../../components/ui/FormGrid'
import { couponsApi } from '../../api'
import { formatCurrency, formatDate } from '../../utils/formatters'

// valid_from defaults to today so the window is always deliberate — the API
// requires both ends on create.
const today = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM = {
  code: '', description: '', discount_type: 'percentage', discount_value: '',
  min_order_amount: 0, max_discount: '', usage_limit: '', per_user_limit: 1,
  first_order_only: false, visibility: 'private',
  valid_from: today(), valid_until: '',
}

/**
 * Render the form state as one plain-English sentence for proofreading.
 * Deliberately reads the same fields the API will act on, so a mismatch between
 * what the sentence says and what the coupon does is impossible.
 */
function summarise(f) {
  if (!f.discount_value) return 'Fill in the discount to see a summary.'
  const amount = f.discount_type === 'percentage' ? `${f.discount_value}% off` : `₹${f.discount_value} off`
  const cap = f.max_discount ? `, up to ₹${f.max_discount}` : ''
  const min = Number(f.min_order_amount) > 0 ? ` on orders above ₹${f.min_order_amount}` : ''
  const first = f.first_order_only ? ', first order only' : ''
  const perUser = Number(f.per_user_limit) > 1 ? `, up to ${f.per_user_limit}× per customer` : ''
  const total = f.usage_limit ? `, ${f.usage_limit} redemptions total` : ''
  const vis = f.visibility === 'public' ? ', listed in the app' : ', code must be typed'
  const window = f.valid_from && f.valid_until ? `. Valid ${f.valid_from} to ${f.valid_until}.` : '.'
  return `${amount}${cap}${min}${first}${perUser}${total}${vis}${window} Saved as a draft — activate it to make it redeemable.`
}

export default function CouponList() {
  const [coupons, setCoupons] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const fetchCoupons = useCallback(() => {
    setLoading(true)
    couponsApi
      .getAll({ limit: 100 })
      .then((res) => {
        setCoupons(res.data || [])
        setTotal(res.pagination?.total ?? 0)
      })
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleCreate = async () => {
    try {
      setBusy(true)
      setError('')
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount) || 0,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        per_user_limit: Number(form.per_user_limit) || 1,
        first_order_only: !!form.first_order_only,
        visibility: form.visibility,
        // End-of-day so "valid until the 31st" means through the 31st.
        valid_from: new Date(`${form.valid_from}T00:00:00`).toISOString(),
        valid_until: new Date(`${form.valid_until}T23:59:59`).toISOString(),
        // Created paused, not live. Going live is a deliberate second action —
        // a typo in a discount value should not be redeemable the instant it
        // is saved.
        status: 'draft',
      }
      await couponsApi.create(payload)
      setForm(EMPTY_FORM)
      setShowAdd(false)
      fetchCoupons()
    } catch (err) {
      setError(err.message || 'Failed to create coupon')
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (row) => {
    try {
      setBusy(true)
      await couponsApi.update(row.id, { status: row.status === 'active' ? 'paused' : 'active' })
      fetchCoupons()
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Archive coupon ${row.code}? It stops being redeemable but stays on past orders.`)) return
    try {
      setBusy(true)
      await couponsApi.delete(row.id)
      fetchCoupons()
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'code', header: 'Code',
      render: (val) => <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary-light)', fontSize: '0.875rem', background: 'rgba(99, 102, 241, 0.1)', padding: '3px 10px', borderRadius: '6px' }}>{val}</span>,
    },
    { key: 'description', header: 'Description', render: (val) => <span style={{ fontSize: '0.8125rem' }}>{val || '—'}</span> },
    {
      key: 'discount_value', header: 'Discount',
      render: (val, row) => <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{row.discount_type === 'percentage' ? `${val}%` : formatCurrency(val)}</span>,
    },
    { key: 'min_order_amount', header: 'Min Order', align: 'right', render: (val) => <span>{formatCurrency(val)}</span> },
    {
      key: 'used_count', header: 'Usage', align: 'center',
      render: (val, row) => <span style={{ fontWeight: 600 }}>{val}{row.usage_limit ? `/${row.usage_limit}` : ''}</span>,
    },
    { key: 'valid_until', header: 'Valid Until', render: (val) => val ? <span style={{ fontSize: '0.8rem', color: new Date(val) < new Date() ? 'var(--color-danger)' : 'var(--text-secondary)' }}>{formatDate(val)}</span> : <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No expiry</span> },
    {
      key: 'first_order_only', header: 'Rules', align: 'center',
      render: (val, row) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {[val ? '1st order' : null, row.visibility === 'public' ? 'public' : null]
            .filter(Boolean).join(' · ') || '—'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (val) => <StatusBadge status={val || 'draft'} /> },
    {
      key: 'actions', header: '', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => toggleActive(row)}>
            {row.status === 'active' ? 'Pause' : 'Activate'}
          </Button>
          {/* Not a delete — orders and redemptions reference this row, so the
              history has to stay resolvable. The API pauses it. */}
          <Button variant="danger" size="sm" disabled={busy} onClick={() => handleDelete(row)}>Archive</Button>
        </div>
      ),
    },
  ]

  const inputStyle = {
    background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
    padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none', width: '100%',
  }

  // max_discount is mandatory on percentage coupons — an uncapped "20% off"
  // costs whatever the largest basket happens to be, with no worst case. The
  // API enforces this too; blocking it here just gives a faster answer.
  const canSave =
    form.code.trim().length >= 3 &&
    Number(form.discount_value) > 0 &&
    !!form.valid_from && !!form.valid_until &&
    new Date(form.valid_until) >= new Date(form.valid_from) &&
    (form.discount_type !== 'percentage' || Number(form.max_discount) > 0)

  return (
    <div>
      <PageHeader title="Coupons" subtitle={`${total} coupons`}>
        <Button variant="primary" size="md" onClick={() => setShowAdd(v => !v)} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
          {showAdd ? 'Close' : 'Create Coupon'}
        </Button>
      </PageHeader>

      {showAdd && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
          padding: '20px', marginBottom: '16px',
        }} className="animate-fadeIn">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px' }}>New coupon</h3>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', marginBottom: '10px' }}>{error}</div>}
          <FormGrid min={180} className="mb-3.5">
            <input style={inputStyle} placeholder="Code (e.g. FRESH20) *" value={form.code} onChange={e => setField('code', e.target.value.toUpperCase())} />
            <input style={inputStyle} placeholder="Description" value={form.description} onChange={e => setField('description', e.target.value)} />
            <select style={inputStyle} value={form.discount_type} onChange={e => setField('discount_type', e.target.value)}>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
            <input style={inputStyle} type="number" min="1" placeholder={form.discount_type === 'percentage' ? 'Discount % *' : 'Discount ₹ *'} value={form.discount_value} onChange={e => setField('discount_value', e.target.value)} />
            <input style={inputStyle} type="number" min="0" placeholder="Min order ₹" value={form.min_order_amount} onChange={e => setField('min_order_amount', e.target.value)} />
            <input style={inputStyle} type="number" min="1" placeholder={form.discount_type === 'percentage' ? 'Max discount ₹ *' : 'Max discount ₹ (optional)'} value={form.max_discount} onChange={e => setField('max_discount', e.target.value)} />
            <input style={inputStyle} type="number" min="1" placeholder="Total usage limit (optional)" value={form.usage_limit} onChange={e => setField('usage_limit', e.target.value)} />
            <input style={inputStyle} type="number" min="1" placeholder="Uses per customer" value={form.per_user_limit} onChange={e => setField('per_user_limit', e.target.value)} />
            <select style={inputStyle} value={form.visibility} onChange={e => setField('visibility', e.target.value)}>
              <option value="private">Private — code must be typed</option>
              <option value="public">Public — listed in the app</option>
            </select>
            <label style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.first_order_only} onChange={e => setField('first_order_only', e.target.checked)} />
              First order only
            </label>
            <input style={inputStyle} type="date" value={form.valid_from} onChange={e => setField('valid_from', e.target.value)} title="Valid from" />
            <input style={inputStyle} type="date" value={form.valid_until} onChange={e => setField('valid_until', e.target.value)} title="Valid until" />
          </FormGrid>

          {/* A sentence marketing can proofread. Misconfigured coupons are
              caught far more often by reading this back than by well-labelled
              inputs. */}
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>
            {summarise(form)}
          </p>

          <Button variant="primary" size="md" disabled={busy || !canSave} onClick={handleCreate}>
            {busy ? 'Saving…' : 'Save as draft'}
          </Button>
        </div>
      )}

      <DataTable columns={columns} data={coupons} loading={loading} emptyTitle="No coupons found" emptyDescription="Create your first coupon to offer discounts" />
    </div>
  )
}
