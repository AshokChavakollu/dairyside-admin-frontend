// ─── Order Status ───
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
}

export const ORDER_STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
]

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.RETURNED]: 'Returned',
}

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)', border: 'var(--color-warning)' },
  [ORDER_STATUS.CONFIRMED]: { bg: 'var(--color-info-light)', text: 'var(--color-info)', border: 'var(--color-info)' },
  [ORDER_STATUS.PROCESSING]: { bg: '#fef3c7', text: '#d97706', border: '#d97706' },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: { bg: '#dbeafe', text: '#2563eb', border: '#2563eb' },
  [ORDER_STATUS.DELIVERED]: { bg: 'var(--color-success-light)', text: 'var(--color-success)', border: 'var(--color-success)' },
  [ORDER_STATUS.CANCELLED]: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)', border: 'var(--color-danger)' },
  [ORDER_STATUS.RETURNED]: { bg: '#fce7f3', text: '#db2777', border: '#db2777' },
}

// ─── Subscription Status ───
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
}

export const SUBSCRIPTION_STATUS_LABELS = {
  [SUBSCRIPTION_STATUS.ACTIVE]: 'Active',
  [SUBSCRIPTION_STATUS.PAUSED]: 'Paused',
  [SUBSCRIPTION_STATUS.CANCELLED]: 'Cancelled',
  [SUBSCRIPTION_STATUS.EXPIRED]: 'Expired',
}

// ─── Payment Status ───
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
}

// ─── Order Types ───
export const ORDER_TYPES = {
  ONE_TIME: 'one_time',
  SUBSCRIPTION: 'subscription',
  SUBSCRIPTION_DELIVERY: 'subscription_delivery',
  TRIAL: 'trial',
}

export const ORDER_TYPE_LABELS = {
  [ORDER_TYPES.ONE_TIME]: 'One Time',
  [ORDER_TYPES.SUBSCRIPTION]: 'Subscription',
  [ORDER_TYPES.SUBSCRIPTION_DELIVERY]: 'Subscription Delivery',
  [ORDER_TYPES.TRIAL]: 'Trial',
}

// ─── Delivery Shifts ───
export const DELIVERY_SHIFTS = {
  MORNING: 'morning',
  EVENING: 'evening',
}

// ─── Subscription Frequency ───
export const SUBSCRIPTION_FREQUENCY = {
  DAILY: 'daily',
  ALTERNATE: 'alternate',
  WEEKLY: 'weekly',
  CUSTOM: 'custom',
}

// ─── Sidebar Navigation ───
export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: 'dashboard',
  },
  {
    id: 'orders',
    label: 'Orders',
    path: '/orders',
    icon: 'orders',
  },
  {
    id: 'products',
    label: 'Products',
    path: '/products',
    icon: 'products',
    children: [
      { id: 'product-list', label: 'All Products', path: '/products' },
      { id: 'categories', label: 'Categories', path: '/categories' },
      { id: 'inventory', label: 'Inventory', path: '/inventory' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    path: '/customers',
    icon: 'customers',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    path: '/subscriptions',
    icon: 'subscriptions',
    children: [
      { id: 'sub-list', label: 'All Subscriptions', path: '/subscriptions' },
      { id: 'trial-packs', label: 'Trial Packs', path: '/trial-packs' },
    ],
  },
  {
    id: 'deliveries',
    label: 'Deliveries',
    path: '/deliveries',
    icon: 'deliveries',
  },
  {
    id: 'farm-visit',
    label: 'Farm Visits',
    path: '/farm-visit/bookings',
    icon: 'deliveries',
    children: [
      { id: 'farm-visit-bookings', label: 'Bookings', path: '/farm-visit/bookings' },
      { id: 'farm-visit-slots', label: 'Slots', path: '/farm-visit/slots' },
      { id: 'farm-visit-content', label: 'Page Content', path: '/farm-visit/content' },
    ],
  },
  {
    id: 'coupons',
    label: 'Coupons',
    path: '/coupons',
    icon: 'coupons',
  },
  {
    id: 'payments',
    label: 'Payments',
    path: '/collections',
    icon: 'payments',
    children: [
      { id: 'collections', label: 'Collections', path: '/collections' },
      { id: 'payment-system', label: 'Payment System', path: '/payments' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    path: '/banners',
    icon: 'content',
    children: [
      { id: 'banners', label: 'Banners', path: '/banners' },
      { id: 'notifications', label: 'Notifications', path: '/notifications' },
      { id: 'reviews', label: 'Reviews', path: '/reviews' },
      { id: 'settings', label: 'App Settings', path: '/settings' },
    ],
  },
  {
    id: 'service-area',
    label: 'Service Area',
    path: '/pincodes',
    icon: 'area',
    children: [
      { id: 'pincodes', label: 'Pincodes', path: '/pincodes' },
      { id: 'delivery-slots', label: 'Delivery Slots', path: '/delivery-slots' },
    ],
  },
  {
    id: 'messages',
    label: 'Messages',
    path: '/messages',
    icon: 'messages',
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    path: '/audit-logs',
    icon: 'audit',
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports/revenue',
    icon: 'reports',
    children: [
      { id: 'revenue', label: 'Revenue', path: '/reports/revenue' },
      { id: 'product-reports', label: 'Products', path: '/reports/products' },
    ],
  },
]
