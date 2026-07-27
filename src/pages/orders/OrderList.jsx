import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import { ordersApi } from '../../api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { ORDER_STATUS_LABELS } from '../../utils/constants'

function formatVolume(qty, sizeLabel) {
  const count = Number(qty) || 1;
  if (!sizeLabel) return `${count}`;

  const sizeMatch = String(sizeLabel).trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  if (sizeMatch) {
    const sizeVal = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toLowerCase();

    if (unit === 'ml') {
      const totalMl = sizeVal * count;
      if (totalMl >= 1000) {
        const litres = (totalMl / 1000).toFixed(1).replace(/\.0$/, '');
        return `${litres}L`;
      }
      return `${totalMl}ml`;
    } else if (unit === 'l' || unit === 'liter' || unit === 'liters') {
      const totalL = (sizeVal * count).toFixed(1).replace(/\.0$/, '');
      return `${totalL}L`;
    } else if (unit === 'gm' || unit === 'g') {
      const totalGm = sizeVal * count;
      if (totalGm >= 1000) {
        const kgs = (totalGm / 1000).toFixed(1).replace(/\.0$/, '');
        return `${kgs}kg`;
      }
      return `${totalGm}g`;
    } else if (unit === 'kg' || unit === 'kgs') {
      const totalKg = (sizeVal * count).toFixed(1).replace(/\.0$/, '');
      return `${totalKg}kg`;
    }
  }
  return `${count}`;
}

const PAGE_SIZE = 25

export default function OrderList() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    let alive = true
    setLoading(true)
    const params = { page, limit: PAGE_SIZE }
    if (statusFilter !== 'all') params.status = statusFilter
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim()

    ordersApi
      .getAll(params)
      .then((res) => {
        if (!alive) return
        setOrders(res.data || [])
        setTotal(res.pagination?.total ?? 0)
      })
      .catch(() => alive && setOrders([]))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [page, statusFilter, debouncedSearch])

  const columns = [
    {
      key: 'order_number',
      header: 'Order #',
      minWidth: '140px',
      render: (val) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-primary-light)' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{row.customer_phone}</div>
        </div>
      ),
    },
    {
      key: 'order_type',
      header: 'Type',
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 500, padding: '2px 8px',
            borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
            textTransform: 'capitalize', width: 'fit-content',
          }}>
            {val.replace(/_/g, ' ')}
          </span>
          {row.subscription_id && (
            <span
              onClick={(e) => { e.stopPropagation(); navigate(`/subscriptions/${row.subscription_id}`); }}
              style={{
                fontSize: '0.7rem',
                color: 'var(--color-primary-light)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sub #{row.subscription_id} →
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'items_count',
      header: 'Items',
      align: 'center',
      render: (val, row) => <span style={{ fontWeight: 600 }}>{formatVolume(val, row.size_label)}</span>,
    },
    {
      key: 'total_amount',
      header: 'Amount',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 600 }}>{formatCurrency(val)}</span>,
    },
    {
      key: 'delivery_shift',
      header: 'Shift / Slot',
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px',
            background: val === 'morning' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            color: val === 'morning' ? '#fbbf24' : '#a78bfa',
            textTransform: 'capitalize', width: 'fit-content',
          }}>
            {val === 'morning' ? '☀' : '🌙'} {val}
          </span>
          {row.delivery_slot && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2.5px', whiteSpace: 'nowrap' }}>
              {row.delivery_slot}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (val) => <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{formatDateTime(val)}</span>,
    },
  ]

  const statusTabs = ['all', 'pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled']

  return (
    <div>
      <PageHeader title="Orders" subtitle={debouncedSearch ? `${total} orders matching "${debouncedSearch}"` : `${total} total orders`}>
        <Button variant="secondary" size="sm" icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        }>
          Export
        </Button>
      </PageHeader>

      {/* Search & Status Filters Bar */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{
            position: 'relative', flex: '1', minWidth: '280px', maxWidth: '420px',
          }}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Customer Name, or Phone..."
              style={{
                width: '100%',
                padding: '8px 32px 8px 36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-tertiary)',
                  cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '2px',
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div style={{
            display: 'flex', gap: '4px', flexWrap: 'wrap',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '4px',
            border: '1px solid var(--border-default)', width: 'fit-content',
          }}>
            {statusTabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setStatusFilter(tab); setPage(1) }}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none',
                  fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                  background: statusFilter === tab ? 'var(--color-primary)' : 'transparent',
                  color: statusFilter === tab ? 'white' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'all' ? 'All' : (ORDER_STATUS_LABELS[tab] || tab.replace(/_/g, ' '))}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
        pagination={{ total, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }}
        onPageChange={(newOffset) => setPage(Math.floor(newOffset / PAGE_SIZE) + 1)}
        emptyTitle={debouncedSearch ? "No matching orders found" : "No orders found"}
        emptyDescription={debouncedSearch ? `No orders match "${debouncedSearch}". Try searching for a different Order # or customer name.` : "Try changing the status filter"}
      />
    </div>
  )
}
