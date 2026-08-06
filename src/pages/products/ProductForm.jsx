import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../api/axiosConfig'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [variants, setVariants] = useState([])

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    category_id: '',
    short_description: '',
    description: '',
    image_url: '',
    badge: '',
    display_order: 0,
    is_subscription_eligible: false,
    is_featured: false,
    is_active: true
  })

  // Variant modal form state
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [editingVariant, setEditingVariant] = useState(null)
  const [variantForm, setVariantForm] = useState({
    sku: '',
    size_label: '',
    size_value: '',
    size_unit: 'ml',
    mrp: '',
    sale_price: '',
    stock_quantity: 0,
    min_order_quantity: 1,
    max_order_quantity: 10,
    is_default: false,
    is_active: true
  })

  useEffect(() => {
    fetchCategories()
    if (isEdit) {
      fetchProductDetail()
    }
  }, [id])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      if (res.data && res.data.data) {
        setCategories(res.data.data)
      }
    } catch {
      toast.error('Failed to fetch categories')
    }
  }

  const fetchProductDetail = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/products/${id}`)
      if (res.data && res.data.data) {
        const prod = res.data.data
        setProductForm({
          name: prod.name || '',
          slug: prod.slug || '',
          category_id: prod.category_id || '',
          short_description: prod.short_description || '',
          description: prod.description || '',
          image_url: prod.image_url || prod.thumbnail || '',
          badge: prod.badge || '',
          display_order: prod.display_order || 0,
          is_subscription_eligible: !!prod.is_subscription_eligible,
          is_featured: !!prod.is_featured,
          is_active: !!prod.is_active
        })
        setVariants(prod.variants || [])
      }
    } catch {
      toast.error('Failed to fetch product details')
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setProductForm(prev => {
      const updated = { ...prev, name }
      // Auto-generate slug if not editing
      if (!isEdit && !prev.slug) {
        updated.slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }
      return updated
    })
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!productForm.name.trim()) return toast.error('Product Name is required')
    if (!productForm.slug.trim()) return toast.error('Product Slug is required')
    if (!productForm.category_id) return toast.error('Category is required')

    try {
      setSaving(true)
      const payload = {
        ...productForm,
        category_id: Number(productForm.category_id),
        display_order: Number(productForm.display_order)
      }

      if (isEdit) {
        await api.put(`/products/${id}`, payload)
        toast.success('Product updated successfully')
      } else {
        const res = await api.post('/products', payload)
        toast.success('Product created successfully')
        if (res.data && res.data.data) {
          navigate(`/products/${res.data.data.id}/edit`)
        } else {
          navigate('/products')
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  // Variant Handlers
  const handleOpenAddVariant = () => {
    setEditingVariant(null)
    setVariantForm({
      sku: `${productForm.slug || 'prod'}-${Date.now().toString().slice(-4)}`,
      size_label: '',
      size_value: '',
      size_unit: 'ml',
      mrp: '',
      sale_price: '',
      stock_quantity: 100,
      min_order_quantity: 1,
      max_order_quantity: 10,
      is_default: variants.length === 0, // default if first variant
      is_active: true
    })
    setShowVariantModal(true)
  }

  const handleOpenEditVariant = (variant) => {
    setEditingVariant(variant)
    setVariantForm({
      sku: variant.sku || '',
      size_label: variant.size_label || '',
      size_value: variant.size_value || '',
      size_unit: variant.size_unit || 'ml',
      mrp: variant.mrp || '',
      sale_price: variant.sale_price || '',
      stock_quantity: variant.stock_quantity || 0,
      min_order_quantity: variant.min_order_quantity || 1,
      max_order_quantity: variant.max_order_quantity || 10,
      is_default: !!variant.is_default,
      is_active: !!variant.is_active
    })
    setShowVariantModal(true)
  }

  const handleSaveVariant = async () => {
    if (!variantForm.sku.trim()) return toast.error('SKU is required')
    if (!variantForm.sale_price) return toast.error('Sale Price is required')

    try {
      const payload = {
        ...variantForm,
        size_value: variantForm.size_value ? Number(variantForm.size_value) : null,
        mrp: Number(variantForm.mrp || variantForm.sale_price),
        sale_price: Number(variantForm.sale_price),
        stock_quantity: Number(variantForm.stock_quantity || 0),
        min_order_quantity: Number(variantForm.min_order_quantity || 1),
        max_order_quantity: Number(variantForm.max_order_quantity || 10)
      }

      if (editingVariant) {
        // The variant PUT no longer carries stock — it wrote the column
        // absolutely, so saving a price change re-asserted whatever stock read
        // when this modal opened and silently undid any sale made in between.
        // Stock goes through the ledgered endpoint instead, and only when the
        // admin actually changed the number.
        await api.put(`/variants/${editingVariant.id}`, payload)
        const newStock = Number(variantForm.stock_quantity || 0)
        if (newStock !== Number(editingVariant.stock_quantity ?? 0)) {
          await api.patch(`/variants/${editingVariant.id}/stock`, { stock_quantity: newStock })
        }
        toast.success('Variant updated successfully')
      } else {
        await api.post(`/products/${id}/variants`, payload)
        toast.success('Variant added successfully')
      }
      setShowVariantModal(false)
      fetchProductDetail()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save variant')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title={isEdit ? 'Edit Product' : 'New Product'}
        subtitle={isEdit ? `Manage details and variants of ${productForm.name}` : 'Create a new dairy catalog item'}
      />

      <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="lg:grid-cols-3">
          
          {/* Main Info Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="lg:col-span-2">
            
            {/* General Info Card */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>General Information</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Fresh Cow Ghee"
                    required
                    className="admin-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Slug (URL Name) *</label>
                    <input
                      type="text"
                      value={productForm.slug}
                      onChange={e => setProductForm({ ...productForm, slug: e.target.value })}
                      placeholder="e.g. fresh-cow-ghee"
                      required
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Category *</label>
                    <select
                      value={productForm.category_id}
                      onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                      required
                      className="admin-select"
                      style={{ height: '38px' }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Short Description</label>
                  <input
                    type="text"
                    value={productForm.short_description}
                    onChange={e => setProductForm({ ...productForm, short_description: e.target.value })}
                    placeholder="Brief description for cards"
                    className="admin-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Detailed Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Full product details..."
                    rows={4}
                    className="admin-textarea"
                  />
                </div>
              </div>
            </div>

            {/* Media & Badge Info Card */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Media & Marketing</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Image URL</label>
                    <input
                      type="text"
                      value={productForm.image_url}
                      onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
                      placeholder="https://..."
                      className="admin-input"
                    />
                  </div>
                  {productForm.image_url && (
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={productForm.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Product Badge (e.g. Best Seller, Pure, Organic)</label>
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                    placeholder="e.g. Best Seller"
                    className="admin-input"
                  />
                </div>
              </div>
            </div>

            {/* Product Variants (Visible in Edit mode only) */}
            {isEdit ? (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Product Variants</h3>
                  <Button variant="ghost" size="sm" onClick={handleOpenAddVariant} icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  }>
                    Add Variant
                  </Button>
                </div>

                {variants.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    No variants defined for this product. Add a variant to sell it.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-default)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '12px 8px' }}>SKU</th>
                          <th style={{ padding: '12px 8px' }}>Label / Size</th>
                          <th style={{ padding: '12px 8px' }}>MRP</th>
                          <th style={{ padding: '12px 8px' }}>Sale Price</th>
                          <th style={{ padding: '12px 8px' }}>Stock</th>
                          <th style={{ padding: '12px 8px', textAlign: 'center' }}>Default</th>
                          <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map(v => (
                          <tr key={v.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                            <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{v.sku}</td>
                            <td style={{ padding: '12px 8px' }}>
                              <span style={{ fontWeight: 600 }}>{v.size_label || `${v.size_value} ${v.size_unit}`}</span>
                            </td>
                            <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', textDecoration: v.mrp > v.sale_price ? 'line-through' : 'none' }}>
                              ₹{v.mrp}
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--color-primary-light)' }}>₹{v.sale_price}</td>
                            <td style={{ padding: '12px 8px' }}>
                              <span style={{ fontWeight: 600, color: v.stock_quantity < 10 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                {v.stock_quantity}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              {v.is_default ? (
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: 'var(--color-primary-light)', color: 'white' }}>
                                  Default
                                </span>
                              ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenEditVariant(v)}>Edit</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

          </div>

          {/* Sidebar Status Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Publish Status Card */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Publish Settings</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Display Order</label>
                  <input
                    type="number"
                    value={productForm.display_order}
                    onChange={e => setProductForm({ ...productForm, display_order: Number(e.target.value) })}
                    className="admin-input"
                  />
                </div>

                <hr style={{ border: 'none', borderBottom: '1px solid var(--border-default)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={productForm.is_active}
                      onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Active Status</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Visible on customer store front</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.875rem', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={productForm.is_featured}
                      onChange={e => setProductForm({ ...productForm, is_featured: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Featured Product</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Highlight in homepage sliders</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.875rem', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={productForm.is_subscription_eligible}
                      onChange={e => setProductForm({ ...productForm, is_subscription_eligible: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Subscription Eligible</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allows daily/custom subscriptions</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button Card */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button
                variant="primary"
                type="submit"
                disabled={saving}
                style={{ width: '100%', padding: '12px' }}
              >
                {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/products')}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
            </div>

          </div>
        </div>
      </form>

      {/* Variant Modal */}
      <Modal
        isOpen={showVariantModal}
        onClose={() => setShowVariantModal(false)}
        title={editingVariant ? 'Edit Variant' : 'Add Variant'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowVariantModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveVariant}>
              {editingVariant ? 'Update' : 'Add'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>SKU (Stock Keeping Unit) *</label>
            <input
              type="text"
              value={variantForm.sku}
              onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })}
              required
              className="admin-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Size Label</label>
              <input
                type="text"
                value={variantForm.size_label}
                onChange={e => setVariantForm({ ...variantForm, size_label: e.target.value })}
                placeholder="e.g. 500 ML"
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Size Value</label>
              <input
                type="number"
                value={variantForm.size_value}
                onChange={e => setVariantForm({ ...variantForm, size_value: e.target.value })}
                placeholder="e.g. 500"
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Unit</label>
              <select
                value={variantForm.size_unit}
                onChange={e => setVariantForm({ ...variantForm, size_unit: e.target.value })}
                className="admin-select"
                style={{ height: '38px' }}
              >
                <option value="ml">ml</option>
                <option value="gm">gm</option>
                <option value="kg">kg</option>
                <option value="pcs">pcs</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>MRP (Maximum Retail Price)</label>
              <input
                type="number"
                value={variantForm.mrp}
                onChange={e => setVariantForm({ ...variantForm, mrp: e.target.value })}
                placeholder="e.g. 80"
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Sale Price *</label>
              <input
                type="number"
                value={variantForm.sale_price}
                onChange={e => setVariantForm({ ...variantForm, sale_price: e.target.value })}
                placeholder="e.g. 75"
                required
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Stock Quantity</label>
              <input
                type="number"
                value={variantForm.stock_quantity}
                onChange={e => setVariantForm({ ...variantForm, stock_quantity: e.target.value })}
                placeholder="e.g. 100"
                className="admin-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Min Order Qty</label>
              <input
                type="number"
                value={variantForm.min_order_quantity}
                onChange={e => setVariantForm({ ...variantForm, min_order_quantity: e.target.value })}
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Max Order Qty</label>
              <input
                type="number"
                value={variantForm.max_order_quantity}
                onChange={e => setVariantForm({ ...variantForm, max_order_quantity: e.target.value })}
                className="admin-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={variantForm.is_default}
                onChange={e => setVariantForm({ ...variantForm, is_default: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
              />
              Default Variant
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={variantForm.is_active}
                onChange={e => setVariantForm({ ...variantForm, is_active: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
              />
              Active
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
