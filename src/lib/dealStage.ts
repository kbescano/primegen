import type { StepKey } from '@/lib/pipelineUtils'

// Where a deal stands, in plain words -- derived from the records that already
// exist (inquiry, quotation, order, supplier POs), so nothing new is stored.
//
// The six workflow steps are what a person *does*; the stage is where the deal
// *is*. Both come from the same progress calculation below, so the Deals list
// and the workflow page can never disagree.

export type DealStageKey =
  | 'inquiry'
  | 'quoted'
  | 'ordering'
  | 'delivery'
  | 'payment'
  | 'closing'
  | 'done'
  | 'lost'

export type DealStage = {
  key: DealStageKey
  /** Short name shown on the pill, e.g. "In delivery". */
  label: string
  /** The workflow step that is next to do (a verb phrase), or null when finished. */
  next: string | null
}

export const STEP_ORDER: StepKey[] = ['quotation', 'confirmation', 'supplierPO', 'fulfilled', 'delivery', 'closed']

// What the person has to do at each step.
export const NEXT_ACTION: Record<StepKey, string> = {
  quotation: 'Create quotation',
  confirmation: 'Approve & send quotation',
  supplierPO: 'Create supplier PO',
  fulfilled: 'Confirm suppliers fulfilled',
  delivery: 'Track delivery & payment',
  closed: 'Confirm completed',
}

// Chip order, left to right in the Deals list.
export const DEAL_STAGES: { key: DealStageKey; label: string; tone: string }[] = [
  { key: 'inquiry', label: 'Not yet quoted', tone: 'bg-gray-100 text-gray-600' },
  { key: 'quoted', label: 'Quoted', tone: 'bg-blue-50 text-blue-700' },
  { key: 'ordering', label: 'Ordering', tone: 'bg-indigo-50 text-indigo-700' },
  { key: 'delivery', label: 'In delivery', tone: 'bg-amber-50 text-amber-700' },
  { key: 'payment', label: 'Awaiting payment', tone: 'bg-orange-50 text-orange-700' },
  { key: 'closing', label: 'Ready to close', tone: 'bg-teal-50 text-teal-700' },
  { key: 'done', label: 'Done', tone: 'bg-emerald-50 text-emerald-700' },
  { key: 'lost', label: 'Rejected / cancelled', tone: 'bg-red-50 text-red-600' },
]

export function stageTone(key: string): string {
  return DEAL_STAGES.find((s) => s.key === key)?.tone ?? 'bg-gray-100 text-gray-600'
}

export function isDealStageKey(value: unknown): value is DealStageKey {
  return DEAL_STAGES.some((s) => s.key === value)
}

type Progress = {
  completedSteps: Record<StepKey, boolean>
  currentStep: StepKey
}

/**
 * Which workflow steps are done and which is current. This is the rule the
 * workflow page has always used (see PipelineView): a step only counts once the
 * one before it does, every order item must have a PO that really exists, and
 * cancelled POs are ignored when checking that every PO is fulfilled.
 */
export function computePipelineProgress(input: {
  request: { status?: string | null } | null | undefined
  quotation?: any | null
  order?: any | null
  pos?: any[] | null
}): Progress {
  const request = input.request
  const quotation = input.quotation ?? null
  const order = input.order ?? null
  const linkedPOs = input.pos ?? []

  // Step 2 is "confirmed" only once the Confirm Quotation Sent step has run
  // (the inquiry moved to quote-sent) -- or an order exists, which proves the
  // whole flow already completed.
  const isStepTwoConfirmed = Boolean(['quote-sent', 'completed'].includes(request?.status || '') || order)

  const allItemsAssigned = Boolean(
    order &&
      Array.isArray(order.items) &&
      order.items.length > 0 &&
      order.items.every(
        (item: any) => item.assignedPOId && linkedPOs.some((po: any) => String(po.id) === String(item.assignedPOId)),
      ),
  )

  const activePOs = linkedPOs.filter((po: any) => po.status !== 'cancelled')
  const allPOsFulfilled = Boolean(activePOs.length > 0 && activePOs.every((po: any) => po.status === 'fulfilled'))
  const isDeliveredAndPaid = Boolean(order && order.fulfillmentStatus === 'delivered' && order.paymentStatus === 'paid')

  const completedSteps: Record<StepKey, boolean> = {
    quotation: Boolean(quotation),
    confirmation: isStepTwoConfirmed,
    supplierPO: isStepTwoConfirmed && allItemsAssigned && linkedPOs.length > 0,
    fulfilled: isStepTwoConfirmed && allItemsAssigned && allPOsFulfilled,
    delivery: isStepTwoConfirmed && allItemsAssigned && allPOsFulfilled && isDeliveredAndPaid,
    closed: request?.status === 'completed',
  }

  const currentStep: StepKey = STEP_ORDER.find((s) => !completedSteps[s]) || 'closed'
  return { completedSteps, currentStep }
}

/** The plain-language stage of a deal, plus what is next to do. */
export function computeDealStage(input: {
  request: { status?: string | null } | null | undefined
  quotation?: any | null
  order?: any | null
  pos?: any[] | null
}): DealStage {
  const { currentStep } = computePipelineProgress(input)
  const order = input.order ?? null

  if (input.request?.status === 'rejected') return { key: 'lost', label: 'Rejected', next: null }
  if (order?.fulfillmentStatus === 'cancelled') return { key: 'lost', label: 'Cancelled', next: null }
  if (input.request?.status === 'completed') return { key: 'done', label: 'Done', next: null }

  const next = NEXT_ACTION[currentStep]
  switch (currentStep) {
    case 'quotation':
      return { key: 'inquiry', label: 'Not yet quoted', next }
    case 'confirmation':
      return { key: 'quoted', label: 'Quoted', next }
    case 'supplierPO':
      // The quotation has been sent but the customer hasn't confirmed an order
      // yet: still waiting on them, so still "Quoted".
      return order
        ? { key: 'ordering', label: 'Ordering', next }
        : { key: 'quoted', label: 'Quoted', next: 'Confirm order with customer' }
    case 'fulfilled':
      return { key: 'ordering', label: 'Ordering', next }
    case 'delivery':
      return order?.fulfillmentStatus === 'delivered'
        ? { key: 'payment', label: 'Awaiting payment', next }
        : { key: 'delivery', label: 'In delivery', next }
    case 'closed':
    default:
      return { key: 'closing', label: 'Ready to close', next }
  }
}
