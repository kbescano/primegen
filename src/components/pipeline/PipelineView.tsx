import Link from 'next/link'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import PipelineStepper from '@/components/PipelineStepper'
import PipelineBackLink from '@/components/PipelineBackLink'
import PipelineFrame, { PipelineCloseButton } from '@/components/pipeline/PipelineFrame'
import { displayDescription } from '@/lib/pipelineUtils'
import { computeDealStage, computePipelineProgress, stageTone } from '@/lib/dealStage'

// The deal workflow, shared by its two entry points:
//   variant="page"  -> /admin-dashboard/pipeline/<id>  (typed URL, refresh,
//                      or after a step that reloads the page)
//   variant="modal" -> the same URL intercepted by @modal/(.)pipeline/<id>
//                      when opened from inside the portal. The list underneath
//                      stays mounted, so closing it needs no reload and keeps
//                      the scroll position.
//
// Like the page it came from, this never relies on a cached render: it reads
// headers() itself, and both callers are force-dynamic, so quotation items
// updated or deleted elsewhere always show up.
export default async function PipelineView({
  id,
  variant,
}: {
  id: string
  variant: 'page' | 'modal'
}) {
  const payload = await getPayloadClient()

  const reqHeaders = await getHeaders()

  // These four don't depend on each other, so they run together -- the
  // workflow used to make them (and the three lookups below) one after another,
  // and every database round trip adds to how long the modal takes to open.
  const [{ user: currentUser }, approvalSettings, request, quotationRes]: [any, any, any, any] =
    await Promise.all([
      payload.auth({ headers: reqHeaders }),
      payload.findGlobal({ slug: 'approval-settings' }).catch(() => ({ autoApproveMode: false })),
      payload.findByID({ collection: 'quotation-requests', id, depth: 2 }).catch(() => null),
      payload.find({
        collection: 'client-quotations',
        where: { sourceRequestId: { equals: String(id) } },
        limit: 1,
      }),
    ])
  const isAdmin = currentUser?.role === 'admin'
  const autoApproveMode = Boolean(approvalSettings?.autoApproveMode)

  if (!request) {
    return (
      <PipelineFrame variant={variant} notFound>
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center relative">
          <p className="text-[14px] text-gray-500 font-medium">Request not found.</p>
          {variant === 'modal' ? (
            <div className="mt-4 flex justify-center">
              <PipelineCloseButton label="Close" />
            </div>
          ) : (
            <Link href="/admin-dashboard" className="text-gray-900 font-semibold text-sm mt-4 inline-block hover:underline">
              &larr; Back to inquiries
            </Link>
          )}
        </div>
      </PipelineFrame>
    )
  }

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

  // The order's supplier POs, and its delivery routes (several are allowed,
  // oldest first -- used to show which items have been picked up from their
  // suppliers). Both only need the order, so they run together.
  let linkedPOs: any[] = []
  let routes: any[] = []
  if (order) {
    const [posRes, routesRes] = await Promise.all([
      payload.find({
        collection: 'supplier-purchase-orders',
        where: { sourceOrderId: { equals: String(order.id) } },
        limit: 50,
      }),
      payload.find({
        collection: 'delivery-itineraries',
        where: { sourceOrderId: { equals: order.id } },
        sort: 'createdAt',
        limit: 50,
        depth: 0,
      }),
    ])
    linkedPOs = posRes.docs
    routes = routesRes.docs.map((r: any) => ({
      id: r.id,
      trackingNumber: r.trackingNumber,
      status: r.status,
      stops: (r.stops || []).map((s: any) => ({
        type: s.type,
        address: s.address,
        contactName: s.contactName,
        status: s.status,
      })),
    }))
  }

  // Which steps are done, and which is current. The rules live in
  // lib/dealStage.ts (shared with the Deals list so the two never disagree):
  // Step 3 and beyond unlock only after the Step 2 "Confirm Quotation Sent"
  // click (or once an order exists), every order item needs a PO that really
  // exists, and cancelled POs are ignored when checking all POs are fulfilled.
  const { completedSteps, currentStep } = computePipelineProgress({
    request,
    quotation,
    order,
    pos: linkedPOs,
  })
  const stage = computeDealStage({ request, quotation, order, pos: linkedPOs })

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
      description: displayDescription(item)
    })) : []
  } : null;

  const displayOrder = order ? {
    ...order,
    items: Array.isArray(order.items) ? order.items.map((item: any) => ({
      ...item,
      description: displayDescription(item)
    })) : []
  } : null;

  const displayPOs = linkedPOs.map((po: any) => ({
    ...po,
    items: Array.isArray(po.items) ? po.items.map((item: any) => ({
      ...item,
      description: displayDescription(item)
    })) : []
  }));
  // ----------------------------------------------

  return (
    <PipelineFrame variant={variant}>
      <div className="px-4 py-3 md:px-6 md:py-3.5 bg-white/95 backdrop-blur-md border-b border-gray-200/60 z-20 flex items-center gap-3 shrink-0">
        {variant === 'page' && <PipelineBackLink />}
        <div className="flex flex-col overflow-hidden min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] md:text-[17px] font-semibold tracking-tight text-[#1d1d1f] leading-none truncate">
              {request.customerName}
            </h1>
            <span
              className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${stageTone(stage.key)}`}
            >
              {stage.label}
            </span>
          </div>
          <p className="text-[10px] md:text-[11px] text-gray-500 mt-1 font-medium truncate">
            {request.phone} {request.email ? `· ${request.email}` : ''}
          </p>
        </div>
        {variant === 'modal' && <PipelineCloseButton />}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain relative w-full">
        <PipelineStepper
          request={displayRequest}
          quotation={displayQuotation}
          order={displayOrder}
          linkedPOs={displayPOs}
          routes={routes}
          completedSteps={completedSteps}
          currentStep={currentStep}
          isAdmin={isAdmin}
          autoApproveMode={autoApproveMode}
        />
      </div>
    </PipelineFrame>
  )
}
