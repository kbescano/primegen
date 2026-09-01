import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayloadClient'
import PipelineStepper from '@/components/PipelineStepper'
import { StepKey } from '@/lib/pipelineUtils'

// Unlike admin-dashboard/page.tsx or client-quotation/page.tsx, this page
// never calls headers()/cookies() itself -- with only `params` (no dynamic
// API usage of its own) Next.js can treat it as eligible for the Full
// Route Cache and serve back the pre-edit render, so quotation items
// updated or deleted elsewhere (they live-edit, then land back here) don't
// show up. Same fix as deliveries/inquiry-tracker/reports/sales-report.
export const dynamic = 'force-dynamic'

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

  // Gate for unlocking Step 3 and beyond is purely: did the Step 2
  // "Confirm Quotation Sent" modal actually fire? Quotation approval
  // status (quotation_approved) no longer factors into this gate on its
  // own -- an admin approving the quotation elsewhere in the app must not
  // silently unlock later steps without the explicit Step 2 click. Once
  // an order exists, that's unambiguous proof the whole flow completed.
  const isStepTwoConfirmed = Boolean(
    ['quote-sent', 'completed'].includes(request.status || '') || order
  )
  
  // STRICT FIX: The item must have an assignedPOId AND that PO must actively exist in linkedPOs
  const allItemsAssigned = Boolean(
    order &&
      Array.isArray(order.items) &&
      order.items.length > 0 &&
      order.items.every((item: any) => 
        item.assignedPOId && linkedPOs.some((po: any) => String(po.id) === String(item.assignedPOId))
      )
  )

  const allPOsFulfilled = Boolean(
    linkedPOs.length > 0 && linkedPOs.every((po: any) => po.status === 'fulfilled')
  )

  const isDeliveredAndPaid = Boolean(
    order && order.fulfillmentStatus === 'delivered' && order.paymentStatus === 'paid'
  )

  // Step key completion mapping
  const completedSteps: Record<StepKey, boolean> = {
    quotation: Boolean(quotation),
    confirmation: isStepTwoConfirmed,
    supplierPO: isStepTwoConfirmed && allItemsAssigned && linkedPOs.length > 0,
    fulfilled: isStepTwoConfirmed && allItemsAssigned && allPOsFulfilled,
    delivery: isStepTwoConfirmed && allItemsAssigned && allPOsFulfilled && isDeliveredAndPaid,
    closed: request.status === 'completed',
  }

  const stepOrder: StepKey[] = [
    'quotation',
    'confirmation',
    'supplierPO',
    'fulfilled',
    'delivery',
    'closed',
  ]
  const currentStep: StepKey = stepOrder.find((s) => !completedSteps[s]) || 'closed'

  // --- FORMAT LINE ITEMS FOR PIPELINE STEPPER ---
  const displayRequest = request ? {
    ...request,
    items: Array.isArray(request.items) ? request.items.map((item: any) => ({
      ...item,
      material: item.sizeDescription && typeof item.material === 'object' && item.material !== null
        ? { ...item.material, name: `${item.material.name} - ${item.sizeDescription}` }
        : item.material
    })) : []
  } : null;

  const displayQuotation = quotation ? {
    ...quotation,
    items: Array.isArray(quotation.items) ? quotation.items.map((item: any) => ({
      ...item,
      description: item.sizeDescription ? `${item.description} - ${item.sizeDescription}` : item.description
    })) : []
  } : null;

  const displayOrder = order ? {
    ...order,
    items: Array.isArray(order.items) ? order.items.map((item: any) => ({
      ...item,
      description: item.sizeDescription ? `${item.description} - ${item.sizeDescription}` : item.description
    })) : []
  } : null;

  const displayPOs = linkedPOs.map((po: any) => ({
    ...po,
    items: Array.isArray(po.items) ? po.items.map((item: any) => ({
      ...item,
      description: item.sizeDescription ? `${item.description} - ${item.sizeDescription}` : item.description
    })) : []
  }));
  // ----------------------------------------------

  return (
    <div className="fixed inset-0 z-[100] bg-[#1d1d1f]/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 antialiased">
      <div className="bg-[#fbfbfd] w-full max-w-[1100px] h-full max-h-[98vh] rounded-[1.5rem] md:rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden ring-1 ring-white/50">
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

        <div className="flex-1 overflow-y-auto relative w-full">
          <PipelineStepper
            request={displayRequest}
            quotation={displayQuotation}
            order={displayOrder}
            linkedPOs={displayPOs}
            completedSteps={completedSteps}
            currentStep={currentStep}
          />
        </div>
      </div>
    </div>
  )
}