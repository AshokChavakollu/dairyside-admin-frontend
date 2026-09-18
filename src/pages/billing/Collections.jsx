// ─────────────────────────────────────────────────────────────
//  Collections — the counter screen.
//
//  Most DairySide customers pay their monthly milk bill in cash at the dairy.
//  Until this screen existed there was nowhere to record that: a bill was
//  either settled by Razorpay or it sat unpaid forever, and the customer had
//  no receipt.
//
//  It is built for one job done many times in a row: find the customer who is
//  standing there, see what they owe, take what they hand over — part of it is
//  fine — and have the receipt sent for them. The amount box is pre-filled
//  with the balance because that is what is paid nine times in ten.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useMemo } from 'react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StatsCard from '../../components/common/StatsCard'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { billingApi } from '../../api'
import { formatCurrency, formatDate } from '../../utils/formatters'

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI / PhonePe / GPay' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
]

const FILTERS = [
  { value: '', label: 'Everything owed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'partial', label: 'Part paid' },
  { value: 'unpaid', label: 'Nothing paid' },
]

const todayYmd = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const monthLabel = (m) => {
  if (!m || !/^\d{4}-\d{2}$/.test(m)) return m || '—'
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

const input = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
}
const label = { display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)' }

export default function Collections() {
  const [invoices, setInvoices] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', search: '' })
  const [message, setMessage] = useState({ type: '', text: '' })

  // The bill being collected against, with its history.
  const [target, setTarget] = useState(null)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ amount: '', method: 'cash', reference: '', receivedAt: todayYmd(), note: '', receivedBy: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await billingApi.getCollectible({ status: filter.status || undefined, search: filter.search || undefined })
      const d = res.data?.data || {}
      setInvoices(d.invoices || [])
      setStats(d.stats || null)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Could not load the bills.' })
    } finally {
      setLoading(false)
    }
  }, [filter.status, filter.search])

  useEffect(() => { fetchData() }, [fetchData])

  // Open the collect dialog for one bill, and load what it has already received.
  const openCollect = async (row) => {
    setTarget(row)
    setDetail(null)
    setFormError('')
    setForm({ amount: String(row.balance), method: 'cash', reference: '', receivedAt: todayYmd(), note: '', receivedBy: '' })
    try {
      const res = await billingApi.getInvoice(row.id)
      setDetail(res.data?.data || null)
    } catch {
      setDetail(null) // the history is a nicety; taking the money is not blocked on it
    }
  }

  const closeCollect = () => { setTarget(null); setDetail(null); setFormError('') }

  const balance = Number(target?.balance || 0)
  const amountNum = Number(form.amount)
  const remaining = useMemo(() => Math.round((balance - (amountNum || 0)) * 100) / 100, [balance, amountNum])
  const amountValid = amountNum > 0 && amountNum - balance <= 0.005

  const submit = async (e) => {
    e?.preventDefault?.()
    if (!amountValid) {
      setFormError(amountNum > balance ? `That is more than the balance of ${formatCurrency(balance)}.` : 'Enter an amount greater than zero.')
      return
    }
    try {
      setSaving(true)
      setFormError('')
      const res = await billingApi.recordPayment(target.id, {
        amount: amountNum,
        method: form.method,
        reference: form.reference || undefined,
        receivedAt: form.receivedAt || undefined,
        note: form.note || undefined,
        receivedBy: form.receivedBy || undefined,
      })
      const out = res.data?.data || {}
      setMessage({
        type: 'success',
        text: out.fullyPaid
          ? `${formatCurrency(amountNum)} received from ${target.customer_name} — bill settled. Receipt sent.`
          : `${formatCurrency(amountNum)} received from ${target.customer_name} — ${formatCurrency(out.balance)} still due. Receipt sent.`,
      })
      closeCollect()
      fetchData()
    } catch (err) {
      // Never close on failure: if nothing was recorded, the person at the
      // counter must see that and try again.
      setFormError(err.response?.data?.error || err.message || 'The payment could not be recorded. Nothing was saved — please try again.')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'customer_name',
      header: 'Customer',
      render: (_v, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.customer_name || '—'}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{row.customer_mobile || row.customer_email || ''}</div>
        </div>
      ),
    },
    {
      key: 'invoice_number',
      header: 'Bill',
      render: (_v, row) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{row.invoice_number}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{monthLabel(row.month)}</div>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Owed',
      render: (_v, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(row.balance)}</div>
          {Number(row.paid_amount) > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {formatCurrency(row.paid_amount)} of {formatCurrency(row.total_amount)} paid
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'Due',
      render: (_v, row) => (
        <span style={{ color: row.overdue ? 'var(--color-danger, #dc2626)' : 'var(--text-secondary)', fontWeight: row.overdue ? 600 : 400 }}>
          {row.due_date ? formatDate(row.due_date) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_v, row) => <StatusBadge status={row.overdue ? 'overdue' : row.status === 'partial' ? 'partial' : 'unpaid'} />,
    },
    {
      key: 'actions',
      header: '',
      render: (_v, row) => (
        <Button size="sm" onClick={(e) => { e.stopPropagation(); openCollect(row) }}>
          Take payment
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Collections"
        subtitle="Monthly milk bills with money still owed. Take cash at the counter and the customer is sent a receipt."
      />

      {message.text && (
        <div
          role="status"
          style={{
            marginBottom: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
            background: message.type === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)',
            border: `1px solid ${message.type === 'error' ? 'rgba(220,38,38,0.35)' : 'rgba(22,163,74,0.35)'}`,
            color: message.type === 'error' ? 'var(--color-danger, #dc2626)' : 'var(--color-success, #16a34a)',
            display: 'flex', justifyContent: 'space-between', gap: 12,
          }}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage({ type: '', text: '' })} aria-label="Dismiss"
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
        </div>
      )}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatsCard title="Owed in total" value={formatCurrency(stats.outstanding.amount)} subtitle={`${stats.outstanding.bills} bill${stats.outstanding.bills === 1 ? '' : 's'}`} />
          <StatsCard title="Overdue" value={formatCurrency(stats.outstanding.overdueAmount)} subtitle={`${stats.outstanding.overdueBills} past the due date`} color="var(--color-danger, #dc2626)" />
          <StatsCard title="Collected today" value={formatCurrency(stats.today.amount)} subtitle={`${stats.today.collections} payment${stats.today.collections === 1 ? '' : 's'}`} color="var(--color-success, #16a34a)" />
          <StatsCard title="Cash today" value={formatCurrency(stats.today.cashAmount)} subtitle="what should be in the drawer" color="var(--color-success, #16a34a)" />
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Name, mobile or bill number…"
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          style={{ ...input, flex: '1 1 260px', maxWidth: 380 }}
          aria-label="Search bills"
        />
        <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} style={{ ...input, width: 'auto' }} aria-label="Filter bills">
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        emptyTitle="Nothing to collect"
        emptyDescription="Every issued bill has been paid."
        onRowClick={openCollect}
      />

      <Modal
        isOpen={Boolean(target)}
        onClose={saving ? () => {} : closeCollect}
        title={target ? `Take payment — ${target.customer_name}` : 'Take payment'}
        size="md"
      >
        {target && (
          <form onSubmit={submit}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{target.invoice_number} · {monthLabel(target.month)}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{target.customer_mobile || ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8, alignItems: 'baseline' }}>
                <strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{formatCurrency(target.balance)}</strong>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                  {Number(target.paid_amount) > 0 ? `${formatCurrency(target.paid_amount)} of ${formatCurrency(target.total_amount)} already paid` : 'nothing paid yet'}
                </span>
              </div>
            </div>

            {detail?.payments?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <span style={label}>Already received</span>
                {detail.payments.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border-default)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{formatDate(p.received_at)} · {p.method}{p.received_by ? ` · ${p.received_by}` : ''}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label htmlFor="collect-amount" style={label}>Amount received</label>
                <input
                  id="collect-amount" type="number" step="0.01" min="0" max={target.balance} inputMode="decimal" autoFocus
                  value={form.amount}
                  onChange={(e) => { setForm((f) => ({ ...f, amount: e.target.value })); setFormError('') }}
                  style={{ ...input, fontSize: '1.25rem', fontWeight: 700 }}
                />
                <div style={{ marginTop: 6, fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                  {amountValid && remaining > 0 ? `${formatCurrency(remaining)} will still be due` : amountValid ? 'This settles the bill in full' : `Balance ${formatCurrency(balance)}`}
                </div>
              </div>

              <div>
                <label htmlFor="collect-method" style={label}>How</label>
                <select id="collect-method" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} style={input}>
                  {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="collect-date" style={label}>Date received</label>
                <input id="collect-date" type="date" value={form.receivedAt} max={todayYmd()} onChange={(e) => setForm((f) => ({ ...f, receivedAt: e.target.value }))} style={input} />
              </div>

              <div>
                <label htmlFor="collect-by" style={label}>Taken by <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <input id="collect-by" value={form.receivedBy} placeholder="Who took the money" onChange={(e) => setForm((f) => ({ ...f, receivedBy: e.target.value }))} style={input} />
              </div>

              {form.method !== 'cash' && (
                <div>
                  <label htmlFor="collect-ref" style={label}>Reference <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <input id="collect-ref" value={form.reference} placeholder="UPI txn / cheque no." onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} style={input} />
                </div>
              )}

              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="collect-note" style={label}>Note <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <input id="collect-note" value={form.note} placeholder="Anything worth remembering about this payment" onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} style={input} />
              </div>
            </div>

            {formError && (
              <div role="alert" style={{ marginTop: 16, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.35)', color: 'var(--color-danger, #dc2626)', fontSize: '0.875rem' }}>
                {formError}
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={closeCollect} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving || !amountValid}>
                {saving ? 'Recording…' : `Record ${formatCurrency(amountNum || 0)}`}
              </Button>
            </div>
            <p style={{ marginTop: 12, fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              The customer is emailed a receipt automatically — for a cash payment that is their only proof.
            </p>
          </form>
        )}
      </Modal>
    </div>
  )
}
