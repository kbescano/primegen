import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'
import PipelineStepper from '@/components/PipelineStepper'

export default async function PipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()

  let request: any
  try {
    request = await payload.findByID({ collection: 'quotation-requests', id, depth: 2 })
  } catch {
    request = null
  }

  if (!request) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#1d1d1f]/40 backdrop-blur-sm flex items-center justify-center p-4 antialiased">
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center">
          <p className="text-[14px] text-gray-500 font-medium">Request not found.</p>
          <Link href="/admin-dashboard" className="text-gray-900 font-semibold text-sm mt-4 inline-block hover:underline">
            &larr; Back to Quotation Inbox
          </Link>
        </div>
      </div>
    )
  }

  const quotationRes = await payload.find({
    collection: 'client-quotations',
    where: { sourceRequestId: { equals: String(id) } },
    limit: 1,
  })
  const quotation = quotationRes.docs[0] || null

  let order: any = null
  if (quotation) {
    const orderRes = await payload.find({
      collection: 'orders',
      where: { sourceQuotationId: { equals: String(quotation.id) } },
      limit: 1,
    })
    order = orderRes.docs[0] || null
  }

  let linkedPOs: any[] = []
  if (order) {
    const posRes = await payload.find({
      collection: 'supplier-purchase-orders',
      where: { sourceOrderId: { equals: String(order.id) } },
      limit: 50,
    })
    linkedPOs = posRes.docs
  }

  const completedSteps = {
    quotation: Boolean(quotation),
    confirmation: Boolean(order),
    supplierPO: linkedPOs.length > 0,
    fulfilled: linkedPOs.length > 0 && linkedPOs.every((po: any) => po.status === 'fulfilled'),
    delivery: Boolean(order && order.fulfillmentStatus === 'delivered' && order.paymentStatus === 'paid'),
    closed: request.status === 'completed',
  }

  const stepOrder: (keyof typeof completedSteps)[] = [
    'quotation',
    'confirmation',
    'supplierPO',
    'fulfilled',
    'delivery',
    'closed',
  ]
  const currentStep = stepOrder.find((s) => !completedSteps[s]) || 'closed'

  return (
    // Big Modal Overlay Container
    <div className="fixed inset-0 z-[100] bg-[#1d1d1f]/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 antialiased">
      
      {/* Modal Window */}
      <div className="bg-[#fbfbfd] w-full max-w-[1100px] h-full max-h-[98vh] rounded-[1.5rem] md:rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden ring-1 ring-white/50">
        
        {/* Compact Fixed Header */}
        <div className="px-4 py-3 md:px-6 md:py-3.5 bg-white/95 backdrop-blur-md border-b border-gray-200/60 z-20 flex items-center gap-3 shrink-0">
          <Link 
            href="/admin-dashboard" 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors shrink-0"
            title="Back to Inbox"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-[15px] md:text-[17px] font-semibold tracking-tight text-[#1d1d1f] leading-none truncate">
              {request.customerName}
            </h1>
            <p className="text-[10px] md:text-[11px] text-gray-500 mt-1 font-medium truncate">
              {request.phone} {request.email ? `\u00b7 ${request.email}` : ''}
            </p>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto relative w-full">
          <PipelineStepper
            request={request}
            quotation={quotation}
            order={order}
            linkedPOs={linkedPOs}
            completedSteps={completedSteps}
            currentStep={currentStep as any}
          />
        </div>
      </div>
    </div>
  )
}