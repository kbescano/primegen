import { getPayloadClient } from '@/lib/getPayloadClient'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import OrdersListClient from '@/components/OrdersListClient'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string; pipelineId?: string }>
}) {
  const { id: highlightId, pipelineId } = await searchParams
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

  // Fetches the whole (capped) batch once -- Status + Search both filter
  // this client-side now (see OrdersListClient), same pattern as the
  // Quotation Inbox, instead of a server round trip per status click.
  const { docs } = await payload.find({
    collection: 'orders',
    sort: '-createdAt',
    limit: 100,
  })

  const orderIds = docs.map((d: any) => String(d.id))
  const linkedPOsRes =
    orderIds.length > 0
      ? await payload.find({
          collection: 'supplier-purchase-orders',
          where: { sourceOrderId: { in: orderIds } },
          limit: 300,
        })
      : { docs: [] as any[] }
  const posByOrderId: Record<string, any[]> = {}
  for (const po of linkedPOsRes.docs as any[]) {
    if (!po.sourceOrderId) continue
    if (!posByOrderId[po.sourceOrderId]) posByOrderId[po.sourceOrderId] = []
    posByOrderId[po.sourceOrderId].push(po)
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

      <OrdersListClient orders={docs} posByOrderId={posByOrderId} highlightId={highlightId} />
    </div>
  )
}
