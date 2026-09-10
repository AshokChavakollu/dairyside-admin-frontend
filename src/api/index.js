import apiClient from './apiClient'

export const dashboardApi = {
  getStats: () => apiClient.get('/admin/dashboard/stats'),
  getRevenueChart: (params) => apiClient.get('/admin/dashboard/revenue-chart', { params }),
  getRecentOrders: () => apiClient.get('/admin/dashboard/recent-orders'),
  getLowStock: () => apiClient.get('/admin/dashboard/low-stock'),
}

export const ordersApi = {
  getAll: (params) => apiClient.get('/admin/orders', { params }),
  getById: (id) => apiClient.get(`/admin/orders/${id}`),
  updateStatus: (id, data) => apiClient.patch(`/admin/orders/${id}/status`, data),
  updateNotes: (id, data) => apiClient.patch(`/admin/orders/${id}/notes`, data),
  bulkUpdateStatus: (data) => apiClient.post('/admin/orders/bulk-status', data),
}

export const productsApi = {
  getAll: (params) => apiClient.get('/admin/products', { params }),
  getById: (id) => apiClient.get(`/admin/products/${id}`),
  create: (data) => apiClient.post('/admin/products', data),
  update: (id, data) => apiClient.put(`/admin/products/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/products/${id}`),
  addVariant: (productId, data) => apiClient.post(`/admin/products/${productId}/variants`, data),
  updateVariant: (id, data) => apiClient.put(`/admin/variants/${id}`, data),
  updateStock: (id, data) => apiClient.patch(`/admin/variants/${id}/stock`, data),
}

// Inventory — all writes are ledgered on the backend and broadcast to shoppers.
export const inventoryApi = {
  variants: (params) => apiClient.get('/admin/inventory/variants', { params }),
  lowStock: (params) => apiClient.get('/admin/inventory/low-stock', { params }),
  ledger: (params) => apiClient.get('/admin/inventory/ledger', { params }),
  restock: (id, data) => apiClient.post(`/admin/inventory/variants/${id}/restock`, data),
  adjust: (id, data) => apiClient.post(`/admin/inventory/variants/${id}/adjust`, data),
  setThreshold: (id, data) => apiClient.patch(`/admin/inventory/variants/${id}/threshold`, data),
}

export const categoriesApi = {
  getAll: (params) => apiClient.get('/admin/categories', { params }),
  create: (data) => apiClient.post('/admin/categories', data),
  update: (id, data) => apiClient.put(`/admin/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/categories/${id}`),
}

export const customersApi = {
  getAll: (params) => apiClient.get('/admin/customers', { params }),
  getById: (id) => apiClient.get(`/admin/customers/${id}`),
  getOrders: (id, params) => apiClient.get(`/admin/customers/${id}/orders`, { params }),
  getSubscriptions: (id) => apiClient.get(`/admin/customers/${id}/subscriptions`),
  getWallet: (id, params) => apiClient.get(`/admin/customers/${id}/wallet`, { params }),
  adjustWallet: (id, data) => apiClient.post(`/admin/customers/${id}/wallet`, data),
}

export const subscriptionsApi = {
  getAll: (params) => apiClient.get('/admin/subscriptions', { params }),
  getById: (id) => apiClient.get(`/admin/subscriptions/${id}`),
  updateStatus: (id, data) => apiClient.patch(`/admin/subscriptions/${id}/status`, data),
  getTrialPacks: (params) => apiClient.get('/admin/trial-packs', { params }),
}

export const deliveriesApi = {
  getToday: (params) => apiClient.get('/admin/deliveries/today', { params }),
  complete: (orderId) => apiClient.patch(`/admin/deliveries/${orderId}/complete`),
  bulkComplete: (data) => apiClient.post('/admin/deliveries/bulk-complete', data),
}

export const couponsApi = {
  getAll: (params) => apiClient.get('/admin/coupons', { params }),
  getById: (id) => apiClient.get(`/admin/coupons/${id}`),
  create: (data) => apiClient.post('/admin/coupons', data),
  update: (id, data) => apiClient.put(`/admin/coupons/${id}`, data),
  delete: (id) => apiClient.delete(`/admin/coupons/${id}`),
}

export const contentApi = {
  getBanners: (params) => apiClient.get('/admin/banners', { params }),
  createBanner: (data) => apiClient.post('/admin/banners', data),
  updateBanner: (id, data) => apiClient.put(`/admin/banners/${id}`, data),
  deleteBanner: (id) => apiClient.delete(`/admin/banners/${id}`),
  sendNotification: (data) => apiClient.post('/admin/notifications', data),
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data) => apiClient.put('/admin/settings', data),
}

// Customer reviews. Read-only plus a feature toggle — the admin API has no
// create/edit route, because a review may only be written by a verified
// purchaser through the customer app. That is what makes the home page
// testimonials trustworthy.
export const reviewsApi = {
  getReviews: (params) => apiClient.get('/admin/reviews', { params }),
  setFeatured: (id, is_featured) => apiClient.patch(`/admin/reviews/${id}/featured`, { is_featured }),
}

export const serviceAreaApi = {
  getPincodes: (params) => apiClient.get('/admin/pincodes', { params }),
  createPincode: (data) => apiClient.post('/admin/pincodes', data),
  updatePincode: (id, data) => apiClient.put(`/admin/pincodes/${id}`, data),
  deletePincode: (id) => apiClient.delete(`/admin/pincodes/${id}`),
  getDeliverySlots: () => apiClient.get('/admin/delivery-slots'),
  updateDeliverySlot: (id, data) => apiClient.put(`/admin/delivery-slots/${id}`, data),
}

export const messagesApi = {
  getAll: (params) => apiClient.get('/admin/contact-messages', { params }),
  respond: (id, data) => apiClient.patch(`/admin/contact-messages/${id}`, data),
}

// Audit trail. Entries are written solely by the customer backend and can never
// be edited — hence no create/update calls. Deleting is permitted and is itself
// recorded as an AUDIT_DELETE entry.
export const auditApi = {
  getAll: (params) => apiClient.get('/admin/audit-logs', { params }),
  getFacets: () => apiClient.get('/admin/audit-logs/facets'),
  getEntityHistory: (type, id, params) =>
    apiClient.get(`/admin/audit-logs/entity/${type}/${id}`, { params }),
  remove: (id) => apiClient.delete(`/admin/audit-logs/${id}`),
  // axios sends a DELETE body only via the `data` option.
  removeMany: (body) => apiClient.delete('/admin/audit-logs', { data: body }),
  deletePreview: (body) => apiClient.post('/admin/audit-logs/delete-preview', body),
}

export const paymentsApi = {
  getSettings: () => apiClient.get('/admin/payments/settings'),
  updateSettings: (data) => apiClient.put('/admin/payments/settings', data),
  getStats: () => apiClient.get('/admin/payments/stats'),
  getTransactions: (params) => apiClient.get('/admin/payments/transactions', { params }),
  getTransactionById: (id) => apiClient.get(`/admin/payments/transactions/${id}`),
  refundTransaction: (id, data) => apiClient.post(`/admin/payments/transactions/${id}/refund`, data),
}

// Farm Visit — page content, bookable slots and the visit bookings queue.
// Slot capacity and booking status changes are guarded server-side (a slot can
// never be shrunk below its booked seats, and cancelling releases them inside a
// transaction), so these are thin passthroughs.
export const farmVisitApi = {
  // Farm
  getFarms: () => apiClient.get('/admin/farm-visit/farms'),
  getFarm: (farmId) => apiClient.get(`/admin/farm-visit/farms/${farmId}`),
  updateFarm: (farmId, data) => apiClient.put(`/admin/farm-visit/farms/${farmId}`, data),

  // Content sections: 'blocks' | 'gallery' | 'testimonials' | 'faqs'
  getSection: (farmId, section) =>
    apiClient.get(`/admin/farm-visit/farms/${farmId}/content/${section}`),
  createSectionRow: (farmId, section, data) =>
    apiClient.post(`/admin/farm-visit/farms/${farmId}/content/${section}`, data),
  updateSectionRow: (section, id, data) =>
    apiClient.put(`/admin/farm-visit/content/${section}/${id}`, data),
  deleteSectionRow: (section, id) =>
    apiClient.delete(`/admin/farm-visit/content/${section}/${id}`),

  // Slots
  getSlots: (farmId, params) =>
    apiClient.get(`/admin/farm-visit/farms/${farmId}/slots`, { params }),
  createSlot: (farmId, data) => apiClient.post(`/admin/farm-visit/farms/${farmId}/slots`, data),
  generateSlots: (farmId, data) =>
    apiClient.post(`/admin/farm-visit/farms/${farmId}/slots/generate`, data),
  updateSlot: (id, data) => apiClient.put(`/admin/farm-visit/slots/${id}`, data),
  deleteSlot: (id) => apiClient.delete(`/admin/farm-visit/slots/${id}`),

  // Bookings
  getBookings: (params) => apiClient.get('/admin/farm-visit/bookings', { params }),
  getBooking: (id) => apiClient.get(`/admin/farm-visit/bookings/${id}`),
  updateBookingStatus: (id, status) =>
    apiClient.patch(`/admin/farm-visit/bookings/${id}/status`, { status }),
  getBookingStats: (farmId) => apiClient.get(`/admin/farm-visit/farms/${farmId}/booking-stats`),
}
