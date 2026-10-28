import { getPayloadClient } from '@/lib/getPayloadClient'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import OrdersListClient from '@/components/OrdersListClient'
import { fetchOrdersPage, fetchPOsByOrderId, normalizeOrderStatus } from '@/lib/orderList'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string; pipelineId?: string; q?: string }>
}) {
  const { id: highlightId, pipelineId, status, q } = await searchParams
  const payload = await getPayloadClient()

  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (user?.role !== 'admin') {
    if (!highlightId) {
      redirect('/admin-dashboard')
    }
    if (highlightId && !pipelineId) {
      redirect('/admin-dashboard')
    }
  }

  // Only the newest page is rendered here; older orders are loaded on demand
  // as the list is scrolled (see OrdersListClient), and Status + Search run
  // on the server so they reach every order.
  // NOTE: deliberately NOT excluding clientPaymentReceipts/
  // supplierPaymentReceipts -- OrdersListClient's OrderCardBody renders a
  // Payment Receipts preview inline for every card. Receipts are base64, so
  // loading in small pages is also what keeps this page's payload bounded.
  const activeStatus = normalizeOrderStatus(status)
  const term = (q || '').trim()
  const isAdmin = user?.role === 'admin'

  const page = await fetchOrdersPage(payload, { status: activeStatus, term, page: 1 })
  const docs = page.docs
  const posByOrderId = page.posByOrderId

  // `?id=` deep links open an order as a modal; it may be older than the
  // page being shown, so fetch it directly.
  let viewOrder: any = docs.find((d: any) => String(d.id) === highlightId)
  if (highlightId && !viewOrder) {
    viewOrder = await payload.findByID({ collection: 'orders', id: highlightId }).catch(() => undefined)
    if (viewOrder) Object.assign(posByOrderId, await fetchPOsByOrderId(payload, [viewOrder]))
  }

  return (
    <div className="max-w-[1000px] mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#01172f] mb-1">
          Orders &amp; Financial Review
        </h1>
        <p className="text-xs text-gray-500 font-medium">
          Administrative view of confirmed orders. Track fulfillment progress, manage payments, and approve Operating Expenses (OPEX) to calculate true net profit. Order statuses are locked and must be updated via the Pipeline.
        </p>
      </div>

      <OrdersListClient
        orders={docs}
        viewOrder={viewOrder}
        posByOrderId={posByOrderId}
        highlightId={highlightId}
        totalDocs={page.totalDocs}
        hasNextPage={isAdmin && page.hasNextPage}
        initialStatus={activeStatus}
        initialQuery={q || ''}
      />
    </div>
  )
}
