// Surfaces the live operational feed as toasts, panel-wide.
//
// Mounted once in AdminLayout so it is active on every admin screen — a new
// order matters whether you happen to be looking at the orders list or not.
// The toast is the notification; the underlying screens still refetch normally,
// so nothing here is load-bearing for correctness.
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { onEvent } from '../auth/adminSocket'

const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(Number(n) || 0)

export default function useAdminFeed() {
  useEffect(() => {
    const offOrder = onEvent('order:new', (o) => {
      toast.success(
        `New ${String(o.paymentMethod || '').toUpperCase() === 'COD' ? 'COD' : 'paid'} order #${o.orderId} — ${inr(o.totalAmount)}`,
        { autoClose: 8000 } // longer than the default: ops should not miss it
      )
    })

    const offStock = onEvent('stock:low', (s) => {
      const label = [s.productName, s.sizeLabel].filter(Boolean).join(' ')
      if (s.state === 'OUT_OF_STOCK') {
        toast.error(`Out of stock: ${label}`, { autoClose: false }) // needs a decision — stays until dismissed
      } else {
        toast.warn(`Low stock: ${label} — ${s.stock} left`, { autoClose: 10000 })
      }
    })

    return () => {
      offOrder()
      offStock()
    }
  }, [])
}
