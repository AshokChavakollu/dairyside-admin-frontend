import { useState, useEffect, useCallback } from 'react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import FormGrid from '../../components/ui/FormGrid'
import { paymentsApi } from '../../api'
import { formatCurrency, formatDate } from '../../utils/formatters'

export default function PaymentManagement() {
  const [activeTab, setActiveTab] = useState('gateways') // 'gateways' | 'transactions' | 'issues'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Settings State
  const [settings, setSettings] = useState({
    razorpay_enabled: true,
    cod_enabled: true,
    wallet_enabled: true,
    upi_enabled: true,
    active_payment_gateway: 'razorpay',
    razorpay_key_id: '',
    razorpay_key_secret: '',
  })

  // Stats & Transactions State
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    refundedTransactions: 0,
    pendingTransactions: 0,
    successRate: '0%',
  })
  const [transactions, setTransactions] = useState([])
  const [totalTx, setTotalTx] = useState(0)
  const [txFilter, setTxFilter] = useState({ status: '', method: '', search: '', page: 1 })
  const [selectedTx, setSelectedTx] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  // Fetch Settings & Stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [settRes, statRes] = await Promise.all([
        paymentsApi.getSettings(),
        paymentsApi.getStats(),
      ])

      if (settRes?.raw) {
        setSettings((prev) => ({
          ...prev,
          razorpay_enabled: (settRes.raw.razorpay_enabled ?? 'true') === 'true',
          cod_enabled: (settRes.raw.cod_enabled ?? 'true') === 'true',
          wallet_enabled: (settRes.raw.wallet_enabled ?? 'true') === 'true',
          upi_enabled: (settRes.raw.upi_enabled ?? 'true') === 'true',
          active_payment_gateway: settRes.raw.active_payment_gateway || 'razorpay',
          razorpay_key_id: settRes.raw.razorpay_key_id || 'rzp_test_T0ROrLNim09D7D',
          razorpay_key_secret: settRes.raw.razorpay_key_secret || 'UCc6qOXIUjbjFS4TtP9QuXKn',
        }))
      }

      if (statRes) {
        setStats(statRes)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load payment configurations' })
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch Transactions list
  const fetchTransactions = useCallback(async () => {
    try {
      const res = await paymentsApi.getTransactions({
        page: txFilter.page,
        limit: 15,
        status: txFilter.status || undefined,
        method: txFilter.method || undefined,
        search: txFilter.search || undefined,
      })
      setTransactions(res.items || [])
      setTotalTx(res.pagination?.total || 0)
    } catch {
      /* ignore non-critical */
    }
  }, [txFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'transactions' || activeTab === 'issues') {
      fetchTransactions()
    }
  }, [activeTab, fetchTransactions])

  // Toggle Payment Method Switch
  const handleToggleMethod = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setMessage({ type: '', text: '' })
      const payload = {
        razorpay_enabled: settings.razorpay_enabled ? 'true' : 'false',
        cod_enabled: settings.cod_enabled ? 'true' : 'false',
        wallet_enabled: settings.wallet_enabled ? 'true' : 'false',
        upi_enabled: settings.upi_enabled ? 'true' : 'false',
        active_payment_gateway: settings.active_payment_gateway,
        razorpay_key_id: settings.razorpay_key_id,
        razorpay_key_secret: settings.razorpay_key_secret,
      }
      await paymentsApi.updateSettings(payload)
      setMessage({ type: 'success', text: 'Payment settings & gateways updated successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save payment settings' })
    } finally {
      setSaving(false)
    }
  }

  // Process Refund
  const handleRefund = async (orderId) => {
    if (!window.confirm(`Issue refund for Order #${orderId}?`)) return
    try {
      setRefunding(true)
      await paymentsApi.refundTransaction(orderId, { reason: refundReason || 'Admin refund' })
      setSelectedTx(null)
      setRefundReason('')
      fetchTransactions()
      fetchData()
      setMessage({ type: 'success', text: `Refund successfully processed for Order #${orderId}` })
    } catch (err) {
      alert(err.message || 'Refund failed')
    } finally {
      setRefunding(false)
    }
  }

  const columns = [
    { key: 'order_id', header: 'Order ID', render: (val) => <span className="font-mono font-bold">#{val}</span> },
    { key: 'customer_name', header: 'Customer', render: (val, row) => <div><div className="font-medium">{val}</div><div className="text-xs text-gray-500">{row.customer_phone || row.customer_email || '—'}</div></div> },
    { key: 'total_amount', header: 'Amount', render: (val) => <span className="font-bold text-green-700">{formatCurrency(val)}</span> },
    { key: 'payment_method', header: 'Method', render: (val) => <span className="uppercase text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{val || 'razorpay'}</span> },
    { key: 'payment_status', header: 'Status', render: (val) => <StatusBadge status={val || 'pending'} /> },
    { key: 'created_at', header: 'Date', render: (val) => formatDate(val) },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" onClick={() => setSelectedTx(row)}>
            Details
          </Button>
          {row.payment_status === 'paid' && (
            <Button variant="danger" size="sm" onClick={() => handleRefund(row.order_id)}>
              Refund
            </Button>
          )}
        </div>
      ),
    },
  ]

  const cardStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    boxShadow: 'var(--shadow-sm)',
  }

  const inputStyle = {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    width: '100%',
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <PageHeader
        title="Payment Management"
        description="Centralized control for payment gateways, method status, live transaction monitoring, and refund handling."
      />

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-default)', marginBottom: '24px' }}>
        {[
          { id: 'gateways', label: '⚡ Gateways & Methods' },
          { id: 'transactions', label: '💳 Live Transactions' },
          { id: 'issues', label: '🛠️ Issue Resolution & Refunds' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab.id ? '600' : '400',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${message.type === 'error' ? '#ef4444' : '#22c55e'}`,
            color: message.type === 'error' ? '#ef4444' : '#22c55e',
            fontSize: '0.875rem',
          }}
        >
          {message.text}
        </div>
      )}

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: '600' }}>Total Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)', marginTop: '4px' }}>{formatCurrency(stats.totalRevenue)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: '600' }}>Transactions</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '4px' }}>{stats.totalTransactions}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: '600' }}>Success Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e', marginTop: '4px' }}>{stats.successRate}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: '600' }}>Failed / Pending</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444', marginTop: '4px' }}>{stats.failedTransactions} / {stats.pendingTransactions}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: '600' }}>Refunded</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b', marginTop: '4px' }}>{stats.refundedTransactions}</div>
        </div>
      </div>

      {/* TAB 1: Gateways & Methods */}
      {activeTab === 'gateways' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Payment Method Enable/Disable */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '600' }}>Active Payment Methods</h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              Enable or disable payment options visible on customer checkout in real-time.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { key: 'razorpay_enabled', label: 'Razorpay Gateway', desc: 'Online Cards, NetBanking, UPI' },
                { key: 'cod_enabled', label: 'Cash on Delivery (COD)', desc: 'Pay cash upon delivery' },
                { key: 'wallet_enabled', label: 'DairySide Wallet', desc: 'Prepaid customer balance' },
                { key: 'upi_enabled', label: 'Direct UPI / QR', desc: 'Instant GPay, PhonePe, Paytm' },
              ].map((m) => (
                <div key={m.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{m.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{m.desc}</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings[m.key]}
                      onChange={() => handleToggleMethod(m.key)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: settings[m.key] ? 'var(--color-primary)' : '#ccc',
                        borderRadius: '24px',
                        transition: '.3s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          content: '""',
                          height: '18px',
                          width: '18px',
                          left: settings[m.key] ? '22px' : '3px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: '.3s',
                        }}
                      />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Gateway Configurations */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '600' }}>Gateway Credentials & Primary Gateway</h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              Configure active primary gateway and credentials securely.
            </p>

            <FormGrid columns={2}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>Primary Gateway</label>
                <select
                  value={settings.active_payment_gateway}
                  onChange={(e) => setSettings((p) => ({ ...p, active_payment_gateway: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="razorpay">Razorpay (Active)</option>
                  <option value="stripe" disabled>Stripe (Coming Soon)</option>
                  <option value="paytm" disabled>Paytm (Coming Soon)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>Razorpay Key ID</label>
                <input
                  type="text"
                  value={settings.razorpay_key_id}
                  onChange={(e) => setSettings((p) => ({ ...p, razorpay_key_id: e.target.value }))}
                  placeholder="rzp_test_..."
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>Razorpay Key Secret</label>
                <input
                  type="password"
                  value={settings.razorpay_key_secret}
                  onChange={(e) => setSettings((p) => ({ ...p, razorpay_key_secret: e.target.value }))}
                  placeholder="Enter Key Secret"
                  style={inputStyle}
                />
              </div>
            </FormGrid>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button disabled={saving} onClick={handleSaveSettings}>
                {saving ? 'Saving...' : 'Save Payment Configurations'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 & 3: Live Transactions & Issue Resolution */}
      {(activeTab === 'transactions' || activeTab === 'issues') && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by Order ID, Customer, Phone..."
              value={txFilter.search}
              onChange={(e) => setTxFilter((p) => ({ ...p, search: e.target.value, page: 1 }))}
              style={{ ...inputStyle, width: '260px' }}
            />
            <select
              value={txFilter.status}
              onChange={(e) => setTxFilter((p) => ({ ...p, status: e.target.value, page: 1 }))}
              style={{ ...inputStyle, width: '160px' }}
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={txFilter.method}
              onChange={(e) => setTxFilter((p) => ({ ...p, method: e.target.value, page: 1 }))}
              style={{ ...inputStyle, width: '160px' }}
            >
              <option value="">All Methods</option>
              <option value="razorpay">Razorpay</option>
              <option value="cod">COD</option>
              <option value="wallet">Wallet</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <DataTable
            columns={columns}
            data={transactions}
            loading={loading}
            emptyMessage="No payment transactions found matching filter criteria."
          />
        </div>
      )}

      {/* Selected Transaction Modal */}
      {selectedTx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ ...cardStyle, width: '480px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Transaction Details — Order #{selectedTx.order_id}</h3>
            <div style={{ display: 'grid', gap: '10px', fontSize: '0.875rem' }}>
              <div><strong>Customer:</strong> {selectedTx.customer_name} ({selectedTx.customer_phone || selectedTx.customer_email})</div>
              <div><strong>Amount:</strong> {formatCurrency(selectedTx.total_amount)}</div>
              <div><strong>Payment Method:</strong> <span className="uppercase font-semibold">{selectedTx.payment_method || 'razorpay'}</span></div>
              <div><strong>Status:</strong> <StatusBadge status={selectedTx.payment_status || 'pending'} /></div>
              <div><strong>Date:</strong> {formatDate(selectedTx.created_at)}</div>

              {selectedTx.payment_status === 'paid' && (
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-default)', paddingTop: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>Refund Reason</label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Customer cancelled / order issue"
                    style={inputStyle}
                  />
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button variant="ghost" onClick={() => setSelectedTx(null)}>Cancel</Button>
                    <Button variant="danger" disabled={refunding} onClick={() => handleRefund(selectedTx.order_id)}>
                      {refunding ? 'Processing...' : 'Confirm Refund'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {selectedTx.payment_status !== 'paid' && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => setSelectedTx(null)}>Close</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
