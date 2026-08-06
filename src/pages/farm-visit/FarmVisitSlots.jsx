import { useState, useEffect, useCallback } from 'react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import FormGrid from '../../components/ui/FormGrid'
import { farmVisitApi } from '../../api'

const FARM_ID = 1 // single farm in v1; the API is already per-farm
const VISIT_TYPES = ['GENERAL', 'SCHOOL_GROUP', 'PRIVATE']
const SLOT_STATUSES = ['OPEN', 'CLOSED', 'CANCELLED']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

const addDays = (ymd, n) => {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

const formatDate = (ymd) => {
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

const formatTime = (t) => {
  const [h, m] = String(t).split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const EMPTY_SLOT = {
  visit_date: '', start_time: '07:00', end_time: '09:00',
  visit_type: 'GENERAL', capacity: 25, price_per_adult: 0, price_per_child: 0,
  status: 'OPEN', notes: '',
}

export default function FarmVisitSlots() {
  const [slots, setSlots] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ from: todayISO(), to: '', status: '' })
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(null) // null | 'new' | slot object
  const [form, setForm] = useState(EMPTY_SLOT)

  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [generator, setGenerator] = useState({
    from: todayISO(), to: addDays(todayISO(), 30),
    start_time: '07:00', end_time: '09:00', capacity: 25,
    visit_type: 'GENERAL', skip_weekdays: [1],
  })
  const [generateResult, setGenerateResult] = useState(null)

  const fetchSlots = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 20 }
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })

    farmVisitApi
      .getSlots(FARM_ID, params)
      .then((res) => {
        setSlots(res.data || [])
        setPagination(res.pagination || null)
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [page, filters])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const openNew = () => { setForm({ ...EMPTY_SLOT, visit_date: todayISO() }); setEditing('new'); setError('') }

  const openEdit = (slot) => {
    setForm({
      visit_date: String(slot.visit_date).slice(0, 10),
      start_time: String(slot.start_time).slice(0, 5),
      end_time: String(slot.end_time).slice(0, 5),
      visit_type: slot.visit_type,
      capacity: slot.capacity,
      price_per_adult: slot.price_per_adult,
      price_per_child: slot.price_per_child,
      status: slot.status,
      notes: slot.notes || '',
    })
    setEditing(slot)
    setError('')
  }

  const save = async () => {
    setError('')
    try {
      setBusy(true)
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        price_per_adult: Number(form.price_per_adult) || 0,
        price_per_child: Number(form.price_per_child) || 0,
        notes: form.notes.trim() || null,
      }
      if (editing === 'new') await farmVisitApi.createSlot(FARM_ID, payload)
      else await farmVisitApi.updateSlot(editing.id, payload)

      setEditing(null)
      fetchSlots()
    } catch (err) {
      // The server refuses to shrink capacity below booked seats and names the
      // number — surface that verbatim rather than a generic failure.
      setError(err.message || 'Could not save this slot')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (slot) => {
    if (slot.seats_booked > 0) {
      setError(`Slot has ${slot.seats_booked} booked seat(s). Set it to CANCELLED instead so those visitors can be contacted.`)
      return
    }
    if (!window.confirm(`Delete the ${formatTime(slot.start_time)} slot on ${formatDate(slot.visit_date)}?`)) return

    try {
      setBusy(true)
      await farmVisitApi.deleteSlot(slot.id)
      fetchSlots()
    } catch (err) {
      setError(err.message || 'Could not delete this slot')
    } finally {
      setBusy(false)
    }
  }

  const generate = async () => {
    setError('')
    setGenerateResult(null)
    try {
      setBusy(true)
      const res = await farmVisitApi.generateSlots(FARM_ID, {
        from: generator.from,
        to: generator.to,
        skip_weekdays: generator.skip_weekdays,
        templates: [{
          start_time: generator.start_time,
          end_time: generator.end_time,
          capacity: Number(generator.capacity),
          visit_type: generator.visit_type,
        }],
      })
      setGenerateResult(res.data)
      fetchSlots()
    } catch (err) {
      setError(err.message || 'Could not generate slots')
    } finally {
      setBusy(false)
    }
  }

  const toggleWeekday = (d) =>
    setGenerator((g) => ({
      ...g,
      skip_weekdays: g.skip_weekdays.includes(d)
        ? g.skip_weekdays.filter((x) => x !== d)
        : [...g.skip_weekdays, d],
    }))

  const columns = [
    { key: 'visit_date', header: 'Date', minWidth: 130, render: (v) => <strong>{formatDate(v)}</strong> },
    {
      key: 'start_time', header: 'Time', minWidth: 150,
      render: (v, row) => `${formatTime(v)} – ${formatTime(row.end_time)}`,
    },
    {
      key: 'visit_type', header: 'Type', minWidth: 120,
      render: (v) => <span style={{ textTransform: 'capitalize' }}>{String(v).toLowerCase().replace('_', ' ')}</span>,
    },
    {
      key: 'seats_booked', header: 'Occupancy', minWidth: 150,
      render: (v, row) => {
        const pct = row.capacity > 0 ? Math.round((v / row.capacity) * 100) : 0
        const full = row.seats_available <= 0
        return (
          <div>
            <div style={{ fontWeight: 700, color: full ? '#dc2626' : 'var(--text-primary)' }}>
              {v} / {row.capacity}
            </div>
            {/* A bar reads faster than a number when scanning 20 rows. */}
            <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: full ? '#dc2626' : '#10b981' }} />
            </div>
          </div>
        )
      },
    },
    {
      key: 'status', header: 'Status', minWidth: 110,
      render: (v) => (
        <span
          style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            background: v === 'OPEN' ? '#d1fae5' : v === 'CLOSED' ? '#f3f4f6' : '#fee2e2',
            color: v === 'OPEN' ? '#059669' : v === 'CLOSED' ? '#6b7280' : '#dc2626',
          }}
        >
          {v}
        </span>
      ),
    },
    {
      key: 'actions', header: '', minWidth: 150,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>Edit</Button>
          <Button
            variant="danger" size="sm" onClick={() => remove(row)}
            disabled={busy || row.seats_booked > 0}
            title={row.seats_booked > 0 ? 'Has bookings — cancel it instead' : 'Delete slot'}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Farm Visit Slots"
        subtitle="Bookable sessions, their capacity and how full they are"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setGeneratorOpen(true); setGenerateResult(null); setError('') }}>
              Generate slots
            </Button>
            <Button onClick={openNew}>Add slot</Button>
          </div>
        }
      />

      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
          padding: '16px', background: 'var(--bg-card)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
        }}
      >
        <label style={labelInline}>From
          <input type="date" value={filters.from} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, from: e.target.value })) }} style={inputStyle} />
        </label>
        <label style={labelInline}>To
          <input type="date" value={filters.to} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, to: e.target.value })) }} style={inputStyle} />
        </label>
        <label style={labelInline}>Status
          <select value={filters.status} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, status: e.target.value })) }} style={inputStyle}>
            <option value="">All</option>
            {SLOT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <DataTable
        columns={columns}
        data={slots}
        loading={loading}
        emptyTitle="No slots in this range"
        emptyDescription="Use “Generate slots” to create a schedule, or add one by hand."
        pagination={pagination}
        onPageChange={setPage}
      />

      {/* ── Add / edit ── */}
      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a slot' : 'Edit slot'}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save slot'}</Button>
          </div>
        }
      >
        {error && <ErrorNote>{error}</ErrorNote>}

        {editing && editing !== 'new' && editing.seats_booked > 0 && (
          <div
            style={{
              marginBottom: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              background: '#fef3c7', color: '#92400e', fontSize: '0.8125rem',
            }}
          >
            {editing.seats_booked} seat{editing.seats_booked === 1 ? '' : 's'} already booked.
            Capacity can't go below that, and changing the date or time moves an
            existing visit — contact those visitors first.
          </div>
        )}

        <FormGrid>
          <Field label="Date"><input type="date" value={form.visit_date} onChange={(e) => setField('visit_date', e.target.value)} style={inputStyle} /></Field>
          <Field label="Visit type">
            <select value={form.visit_type} onChange={(e) => setField('visit_type', e.target.value)} style={inputStyle}>
              {VISIT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <Field label="Start time"><input type="time" value={form.start_time} onChange={(e) => setField('start_time', e.target.value)} style={inputStyle} /></Field>
          <Field label="End time"><input type="time" value={form.end_time} onChange={(e) => setField('end_time', e.target.value)} style={inputStyle} /></Field>
          <Field label="Capacity" hint="Total seats, adults and children together">
            <input type="number" min="1" max="500" value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setField('status', e.target.value)} style={inputStyle}>
              {SLOT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Price per adult (₹)" hint="0 = free">
            <input type="number" min="0" step="0.01" value={form.price_per_adult} onChange={(e) => setField('price_per_adult', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Price per child (₹)" hint="0 = free">
            <input type="number" min="0" step="0.01" value={form.price_per_child} onChange={(e) => setField('price_per_child', e.target.value)} style={inputStyle} />
          </Field>
        </FormGrid>

        <Field label="Internal notes" hint="Not shown to visitors">
          <input type="text" value={form.notes} onChange={(e) => setField('notes', e.target.value)} style={{ ...inputStyle, width: '100%' }} />
        </Field>
      </Modal>

      {/* ── Bulk generator ── */}
      <Modal
        isOpen={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        title="Generate a slot schedule"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setGeneratorOpen(false)} disabled={busy}>Close</Button>
            <Button onClick={generate} disabled={busy}>{busy ? 'Generating…' : 'Generate'}</Button>
          </div>
        }
      >
        {error && <ErrorNote>{error}</ErrorNote>}

        <p style={{ marginTop: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Creates one slot per open day across the range. Safe to run twice —
          days that already have this slot are skipped, and nothing with bookings
          is touched.
        </p>

        <FormGrid>
          <Field label="From"><input type="date" value={generator.from} onChange={(e) => setGenerator((g) => ({ ...g, from: e.target.value }))} style={inputStyle} /></Field>
          <Field label="To"><input type="date" value={generator.to} onChange={(e) => setGenerator((g) => ({ ...g, to: e.target.value }))} style={inputStyle} /></Field>
          <Field label="Start time"><input type="time" value={generator.start_time} onChange={(e) => setGenerator((g) => ({ ...g, start_time: e.target.value }))} style={inputStyle} /></Field>
          <Field label="End time"><input type="time" value={generator.end_time} onChange={(e) => setGenerator((g) => ({ ...g, end_time: e.target.value }))} style={inputStyle} /></Field>
          <Field label="Capacity"><input type="number" min="1" max="500" value={generator.capacity} onChange={(e) => setGenerator((g) => ({ ...g, capacity: e.target.value }))} style={inputStyle} /></Field>
          <Field label="Visit type">
            <select value={generator.visit_type} onChange={(e) => setGenerator((g) => ({ ...g, visit_type: e.target.value }))} style={inputStyle}>
              {VISIT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </Field>
        </FormGrid>

        <Field label="Closed days" hint="Days to skip — no slots are created on these">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {WEEKDAYS.map((label, d) => {
              const skipped = generator.skip_weekdays.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleWeekday(d)}
                  aria-pressed={skipped}
                  style={{
                    minHeight: 36, padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600,
                    border: `1px solid ${skipped ? '#dc2626' : 'var(--border-default)'}`,
                    background: skipped ? '#fee2e2' : 'var(--bg-tertiary)',
                    color: skipped ? '#b91c1c' : 'var(--text-secondary)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Field>

        {generateResult && (
          <div
            style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
              background: '#d1fae5', color: '#065f46', fontSize: '0.875rem',
            }}
          >
            Created <strong>{generateResult.created}</strong> slot{generateResult.created === 1 ? '' : 's'}.
            {generateResult.skipped_existing > 0 && ` ${generateResult.skipped_existing} already existed and were left alone.`}
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

const labelInline = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', color: 'var(--text-secondary)' }

const Field = ({ label, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</label>
    {children}
    {hint && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{hint}</span>}
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
