import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import Login from './pages/auth/Login'
import { useAdminAuth } from './auth/AdminAuthContext'

// Helper to redirect /products/:id to /products/:id/edit
function ProductRedirect() {
  const { id } = useParams()
  return <Navigate to={`/products/${id}/edit`} replace />
}

// Shown while the API is being asked who we are. Rendering nothing here (or
// redirecting) would flash the login screen at an already-authenticated admin
// on every page refresh.
function AuthPending() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'var(--text-secondary)' }}>
      Checking your session…
    </div>
  )
}

// Gate every admin route behind a verified server session. Unauthenticated
// visits redirect to /login and bounce back to the page they wanted after.
// This is a UX gate only — the API enforces the same check on every request.
function RequireAuth({ children }) {
  const location = useLocation()
  const { status } = useAdminAuth()
  if (status === 'loading') return <AuthPending />
  if (status === 'anon') return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

// Keeps a signed-in admin off the login screen without flashing it first.
function LoginRoute() {
  const { status } = useAdminAuth()
  if (status === 'loading') return <AuthPending />
  if (status === 'authed') return <Navigate to="/" replace />
  return <Login />
}
import Dashboard from './pages/Dashboard'
import OrderList from './pages/orders/OrderList'
import OrderDetail from './pages/orders/OrderDetail'
import ProductList from './pages/products/ProductList'
import ProductForm from './pages/products/ProductForm'
import CategoryList from './pages/products/CategoryList'
import Inventory from './pages/products/Inventory'
import CustomerList from './pages/customers/CustomerList'
import CustomerDetail from './pages/customers/CustomerDetail'
import SubscriptionList from './pages/subscriptions/SubscriptionList'
import SubscriptionDetail from './pages/subscriptions/SubscriptionDetail'
import TrialPackList from './pages/subscriptions/TrialPackList'
import FarmVisitBookings from './pages/farm-visit/FarmVisitBookings'
import FarmVisitSlots from './pages/farm-visit/FarmVisitSlots'
import FarmVisitContent from './pages/farm-visit/FarmVisitContent'
import DeliveryManifest from './pages/deliveries/DeliveryManifest'
import CouponList from './pages/coupons/CouponList'
import AppSettings from './pages/content/AppSettings'
import ContactMessages from './pages/messages/ContactMessages'
import AuditLogs from './pages/audit/AuditLogs'
import PincodeList from './pages/service-area/PincodeList'
import DeliverySlotList from './pages/service-area/DeliverySlotList'
import PaymentManagement from './pages/payments/PaymentManagement'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginRoute />} />
      <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
        {/* Dashboard */}
        <Route index element={<Dashboard />} />

        {/* Orders */}
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />

        {/* Products */}
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductRedirect />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="inventory" element={<Inventory />} />

        {/* Customers */}
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/:id" element={<CustomerDetail />} />

        {/* Subscriptions */}
        <Route path="subscriptions" element={<SubscriptionList />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetail />} />
        <Route path="trial-packs" element={<TrialPackList />} />

        {/* Farm Visits */}
        <Route path="farm-visit/bookings" element={<FarmVisitBookings />} />
        <Route path="farm-visit/slots" element={<FarmVisitSlots />} />
        <Route path="farm-visit/content" element={<FarmVisitContent />} />

        {/* Deliveries */}
        <Route path="deliveries" element={<DeliveryManifest />} />

        {/* Coupons & Payments */}
        <Route path="coupons" element={<CouponList />} />
        <Route path="payments" element={<PaymentManagement />} />
        <Route path="coupons/new" element={<ComingSoon title="Create Coupon" description="Coupon create form is being built" />} />
        <Route path="coupons/:id/edit" element={<ComingSoon title="Edit Coupon" description="Coupon edit form is being built" />} />

        {/* Content */}
        <Route path="banners" element={<ComingSoon title="Banners" description="Banner management is being built" />} />
        <Route path="notifications" element={<ComingSoon title="Notifications" description="Notification system is being built" />} />
        <Route path="settings" element={<AppSettings />} />

        {/* Service Area */}
        <Route path="pincodes" element={<PincodeList />} />
        <Route path="delivery-slots" element={<DeliverySlotList />} />

        {/* Messages */}
        <Route path="messages" element={<ContactMessages />} />

        {/* Audit trail (read-only) */}
        <Route path="audit-logs" element={<AuditLogs />} />

        {/* Reports */}
        <Route path="reports/revenue" element={<ComingSoon title="Revenue Reports" description="Revenue analytics is being built" />} />
        <Route path="reports/products" element={<ComingSoon title="Product Reports" description="Product analytics is being built" />} />

        {/* 404 */}
        <Route path="*" element={<ComingSoon title="Page Not Found" description="The page you're looking for doesn't exist" />} />
      </Route>
    </Routes>
  )
}
