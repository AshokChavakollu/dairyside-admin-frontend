import { useState, useEffect, useCallback } from 'react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import FormGrid from '../../components/ui/FormGrid'
import { farmVisitApi } from '../../api'

const FARM_ID = 1

// Every tab maps to one API section. `blockType` narrows the shared
// farm_content_blocks table to the rows a tab owns, which is why five of these
// point at the same section.
const TABS = [
  { id: 'benefit', label: 'Why visit', section: 'blocks', blockType: 'benefit' },
  { id: 'timeline_step', label: 'Experience', section: 'blocks', blockType: 'timeline_step' },
  { id: 'practice', label: 'Practices', section: 'blocks', blockType: 'practice' },
  { id: 'certification', label: 'Certifications', section: 'blocks', blockType: 'certification' },
  { id: 'guideline', label: 'Safety rules', section: 'blocks', blockType: 'guideline' },
  { id: 'faqs', label: 'FAQs', section: 'faqs' },
  { id: 'testimonials', label: 'Testimonials', section: 'testimonials' },
  { id: 'gallery', label: 'Gallery', section: 'gallery' },
]

// Must stay in step with the map in the storefront's FarmIcon.jsx — a name not
// in that map renders a neutral fallback dot instead of an icon.
const ICONS = [
  'cow', 'droplet', 'flask', 'cup', 'family', 'leaf', 'gate', 'path', 'basket',
  'grass', 'shield', 'stethoscope', 'recycle', 'certificate', 'shoe', 'child',
  'hand', 'no-food', 'camera', 'clock', 'phone', 'mail', 'pin', 'check',
]

export default function FarmVisitContent() {
  const [tab, setTab] = useState(TABS[0])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | row
  const [form, setForm] = useState({})

  const fetchRows = useCallback(() => {
    setLoading(true)
    farmVisitApi
      .getSection(FARM_ID, tab.section)
      .then((res) => {
        const all = res.data || []
        setRows(tab.blockType ? all.filter((r) => r.block_type === tab.blockType) : all)
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { fetchRows() }, [fetchRows])

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const openNew = () => {
    setForm(blankFor(tab, rows.length))
    setEditing('new')
    setError('')
  }

  const openEdit = (row) => {
    setForm({
      ...row,
      // meta arrives as an object from the JSON column; the form edits the one
      // field that matters rather than exposing raw JSON to an operator.
      duration_minutes: row.meta?.duration_minutes ?? '',
    })
    setEditing(row)
    setError('')
  }

  const save = async () => {
    setError('')
    try {
      setBusy(true)
      const payload = buildPayload(tab, form)

      if (editing === 'new') await farmVisitApi.createSectionRow(FARM_ID, tab.section, payload)
      else await farmVisitApi.updateSectionRow(tab.section, editing.id, payload)

      setEditing(null)
      fetchRows()
    } catch (err) {
      setError(err.message || 'Could not save this item')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (row) => {
    if (!window.confirm(`Delete “${row.title || row.question || row.author_name || 'this item'}”?`)) return
    try {
      setBusy(true)
      await farmVisitApi.deleteSectionRow(tab.section, row.id)
      fetchRows()
    } catch (err) {
      setError(err.message || 'Could not delete this item')
    } finally {
      setBusy(false)
    }
  }

  const togglePublished = async (row) => {
    // blocks use is_active; the other three use is_published.
    const key = tab.section === 'blocks' ? 'is_active' : 'is_published'
    try {
      setBusy(true)
      await farmVisitApi.updateSectionRow(tab.section, row.id, { [key]: !row[key] })
      fetchRows()
    } catch (err) {
      setError(err.message || 'Could not change visibility')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Farm Visit Page"
        subtitle="Everything on the public /visit-farm page — edits go live immediately"
        actions={<Button onClick={openNew}>Add item</Button>}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }} role="tablist">
        {TABS.map((t) => {
          const active = t.id === tab.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              style={{
                minHeight: 38, padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600,
                border: `1px solid ${active ? 'transparent' : 'var(--border-default)'}`,
                background: active ? 'var(--color-primary, #1b6d24)' : 'var(--bg-tertiary)',
                color: active ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {error && (
        <div role="alert" style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: '#fee2e2', color: '#b91c1c', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="Loading content..." />
      ) : rows.length === 0 ? (
        <EmptyState
          title={`No ${tab.label.toLowerCase()} yet`}
          description="Add the first item — it appears on the storefront as soon as it's saved."
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {rows.map((row) => {
            const published = tab.section === 'blocks' ? row.is_active : row.is_published
            return (
              <div
                key={row.id}
                style={{
                  display: 'flex', gap: 16, alignItems: 'flex-start', padding: 16,
                  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)', opacity: published ? 1 : 0.55,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.9375rem' }}>
                      {row.title || row.question || row.author_name || row.alt_text || `Item ${row.id}`}
                    </strong>
                    {row.icon && (
                      <code style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {row.icon}
                      </code>
                    )}
                    {!published && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#f3f4f6', color: '#6b7280' }}>
                        Hidden
                      </span>
                    )}
                  </div>
                  {(row.body || row.answer || row.quote || row.caption) && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                      {row.body || row.answer || row.quote || row.caption}
                    </p>
                  )}
                  {row.image_url && (
                    <img src={row.image_url} alt="" style={{ marginTop: 8, height: 56, borderRadius: 6, objectFit: 'cover' }} />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Button variant="secondary" size="sm" onClick={() => togglePublished(row)} disabled={busy}>
                    {published ? 'Hide' : 'Show'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => remove(row)} disabled={busy}>Delete</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={`${editing === 'new' ? 'Add' : 'Edit'} — ${tab.label}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
        }
      >
        {error && (
          <div role="alert" style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: '#fee2e2', color: '#b91c1c', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* ── blocks ── */}
        {tab.section === 'blocks' && (
          <>
            <Field label="Title"><input type="text" value={form.title || ''} onChange={(e) => setField('title', e.target.value)} style={fullInput} /></Field>
            <Field label="Description"><textarea rows={3} value={form.body || ''} onChange={(e) => setField('body', e.target.value)} style={{ ...fullInput, resize: 'vertical' }} /></Field>
            <FormGrid>
              <Field label="Icon" hint="Anything else renders a plain dot">
                <select value={form.icon || ''} onChange={(e) => setField('icon', e.target.value)} style={inputStyle}>
                  <option value="">None</option>
                  {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Order" hint="Lower shows first">
                <input type="number" min="0" value={form.display_order ?? 0} onChange={(e) => setField('display_order', e.target.value)} style={inputStyle} />
              </Field>
              {tab.blockType === 'timeline_step' && (
                <Field label="Duration (minutes)" hint="Used for the total on the page">
                  <input type="number" min="0" value={form.duration_minutes ?? ''} onChange={(e) => setField('duration_minutes', e.target.value)} style={inputStyle} />
                </Field>
              )}
            </FormGrid>
          </>
        )}

        {/* ── faqs ── */}
        {tab.section === 'faqs' && (
          <>
            <Field label="Question"><input type="text" value={form.question || ''} onChange={(e) => setField('question', e.target.value)} style={fullInput} /></Field>
            <Field label="Answer"><textarea rows={4} value={form.answer || ''} onChange={(e) => setField('answer', e.target.value)} style={{ ...fullInput, resize: 'vertical' }} /></Field>
            <FormGrid>
              <Field label="Category" hint="Optional grouping"><input type="text" value={form.category || ''} onChange={(e) => setField('category', e.target.value)} style={inputStyle} /></Field>
              <Field label="Order"><input type="number" min="0" value={form.display_order ?? 0} onChange={(e) => setField('display_order', e.target.value)} style={inputStyle} /></Field>
            </FormGrid>
          </>
        )}

        {/* ── testimonials ── */}
        {tab.section === 'testimonials' && (
          <>
            <Field label="Quote"><textarea rows={4} value={form.quote || ''} onChange={(e) => setField('quote', e.target.value)} style={{ ...fullInput, resize: 'vertical' }} /></Field>
            <FormGrid>
              <Field label="Author"><input type="text" value={form.author_name || ''} onChange={(e) => setField('author_name', e.target.value)} style={inputStyle} /></Field>
              <Field label="Location"><input type="text" value={form.author_location || ''} onChange={(e) => setField('author_location', e.target.value)} style={inputStyle} /></Field>
              <Field label="Rating (1–5)">
                <input type="number" min="1" max="5" value={form.rating ?? ''} onChange={(e) => setField('rating', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Order"><input type="number" min="0" value={form.display_order ?? 0} onChange={(e) => setField('display_order', e.target.value)} style={inputStyle} /></Field>
            </FormGrid>
          </>
        )}

        {/* ── gallery ── */}
        {tab.section === 'gallery' && (
          <>
            <Field label="Image URL"><input type="url" value={form.image_url || ''} onChange={(e) => setField('image_url', e.target.value)} style={fullInput} placeholder="https://…" /></Field>
            <Field
              label="Alt text"
              hint="Required. Describes the photo for screen readers and when the image fails to load."
            >
              <input type="text" value={form.alt_text || ''} onChange={(e) => setField('alt_text', e.target.value)} style={fullInput} />
            </Field>
            <FormGrid>
              <Field label="Caption" hint="Optional, shown under the photo"><input type="text" value={form.caption || ''} onChange={(e) => setField('caption', e.target.value)} style={inputStyle} /></Field>
              <Field label="Order"><input type="number" min="0" value={form.display_order ?? 0} onChange={(e) => setField('display_order', e.target.value)} style={inputStyle} /></Field>
            </FormGrid>
          </>
        )}
      </Modal>
    </div>
  )
}

function blankFor(tab, count) {
  const base = { display_order: count }
  if (tab.section === 'blocks') return { ...base, block_type: tab.blockType, title: '', body: '', icon: '', is_active: true }
  if (tab.section === 'faqs') return { ...base, question: '', answer: '', category: '', is_published: true }
  if (tab.section === 'testimonials') return { ...base, quote: '', author_name: '', author_location: '', rating: 5, is_published: true }
  return { ...base, image_url: '', alt_text: '', caption: '', is_published: true }
}

/**
 * Strips the row down to the columns its table actually has.
 *
 * Sending an unknown column back on update produces ER_BAD_FIELD_ERROR, and the
 * edit form is seeded from a full row (which carries id, created_at, farm_id and
 * a computed duration_minutes that is not a column at all).
 */
function buildPayload(tab, form) {
  const num = (v, fallback = 0) => (v === '' || v == null ? fallback : Number(v))

  if (tab.section === 'blocks') {
    const payload = {
      block_type: tab.blockType,
      title: String(form.title || '').trim(),
      body: String(form.body || '').trim() || null,
      icon: form.icon || null,
      display_order: num(form.display_order),
    }
    // meta is only sent when there is something to put in it, so an empty
    // object never overwrites a certification's issuer details.
    if (tab.blockType === 'timeline_step' && form.duration_minutes !== '' && form.duration_minutes != null) {
      payload.meta = { duration_minutes: num(form.duration_minutes) }
    }
    return payload
  }

  if (tab.section === 'faqs') {
    return {
      question: String(form.question || '').trim(),
      answer: String(form.answer || '').trim(),
      category: String(form.category || '').trim() || null,
      display_order: num(form.display_order),
    }
  }

  if (tab.section === 'testimonials') {
    return {
      quote: String(form.quote || '').trim(),
      author_name: String(form.author_name || '').trim(),
      author_location: String(form.author_location || '').trim() || null,
      rating: form.rating === '' || form.rating == null ? null : num(form.rating, 5),
      display_order: num(form.display_order),
    }
  }

  return {
    image_url: String(form.image_url || '').trim(),
    // Never null: alt_text is NOT NULL in the schema precisely so a photo
    // cannot be published without it. Empty string is the correct value for a
    // decorative image.
    alt_text: String(form.alt_text || '').trim(),
    caption: String(form.caption || '').trim() || null,
    display_order: num(form.display_order),
  }
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

const fullInput = { ...inputStyle, width: '100%' }

const Field = ({ label, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</label>
    {children}
    {hint && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{hint}</span>}
  </div>
)
