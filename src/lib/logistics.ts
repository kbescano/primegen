// Shared route / pickup logic for an order that can have several routes.
// An order's items are tied to supplier POs (item.assignedPOId); a route's
// pickup stops name the supplier + PO ("Joven (2026-000000128)"). Whether an
// item has been picked up is worked out from those stops -- nothing extra is
// stored on the order, so it can never drift out of date.

export type StopLike = {
  id?: string
  type: 'pickup' | 'dropoff'
  address?: string | null
  contactName?: string | null
  status?: string | null
}

export type RouteLike = {
  id: string | number
  trackingNumber?: string
  status?: string
  stops?: StopLike[] | null
}

export type PoRef = {
  id?: string | number
  poNumber?: string | null
  name?: string | null
  address?: string | null
}

// Accepts either a raw supplier PO doc or the tracker's own PO shape.
export function toPoRef(po: any): PoRef {
  return {
    id: po?.id ?? po?.poId,
    poNumber: po?.poNumber ?? null,
    name: po?.name ?? po?.supplierName ?? null,
    address: po?.address ?? po?.supplierAddress ?? null,
  }
}

const idOf = (v: any): string => {
  if (v === null || v === undefined || v === '') return ''
  return typeof v === 'object' ? String(v.id ?? '') : String(v)
}

// The Primegen warehouse itself (a pickup of the company's own stock).
export function isWarehouseStop(stop: StopLike): boolean {
  const name = (stop.contactName || '').toLowerCase()
  const address = stop.address || ''
  return name.includes('primegen') || address.includes('TANZANG LUMA') || address.includes('CAVITE')
}

// Which supplier PO(s) a pickup stop is for: by PO number first, then by
// supplier name / address.
export function posForStop(stop: StopLike, pos: PoRef[]): PoRef[] {
  if (stop.type !== 'pickup') return []
  const contact = stop.contactName || ''
  const address = stop.address || ''
  let matches = pos.filter((po) => po.poNumber && (contact.includes(po.poNumber) || address.includes(po.poNumber)))
  if (matches.length === 0) {
    matches = pos.filter(
      (po) => (po.name && contact.includes(po.name)) || (po.address && address && address.includes(po.address)),
    )
  }
  return matches
}

export type PickupState = 'unscheduled' | 'scheduled' | 'arrived' | 'picked_up'

export const PICKUP_LABEL: Record<PickupState, string> = {
  unscheduled: 'Not scheduled',
  scheduled: 'Pickup scheduled',
  arrived: 'Pickup in progress',
  picked_up: 'Picked up',
}

export const PICKUP_STYLE: Record<PickupState, string> = {
  unscheduled: 'bg-gray-100 text-gray-500 border-gray-200',
  scheduled: 'bg-blue-50 text-blue-600 border-blue-100',
  arrived: 'bg-amber-50 text-amber-700 border-amber-100',
  picked_up: 'bg-[#149911]/10 text-[#149911] border-[#149911]/20',
}

export type PickupInfo = { state: PickupState; routeNumber?: number; tracking?: string }

type Hit = { status: string; routeNumber: number; tracking?: string }

function infoFromHits(hits: Hit[]): PickupInfo {
  if (hits.length === 0) return { state: 'unscheduled' }
  const done = hits.filter((h) => h.status === 'completed')
  const inProgress = hits.some((h) => h.status === 'arrived') || (done.length > 0 && done.length < hits.length)
  const state: PickupState = done.length === hits.length ? 'picked_up' : inProgress ? 'arrived' : 'scheduled'
  // Point at the route that decides the state (first not-yet-complete one, or the last one).
  const pick = (state === 'picked_up' ? hits[hits.length - 1] : hits.find((h) => h.status !== 'completed')) || hits[0]
  return { state, routeNumber: pick.routeNumber, tracking: pick.tracking }
}

// Pickup state of one supplier PO across all of an order's routes.
export function poPickupInfo(po: PoRef, pos: PoRef[], routes: RouteLike[]): PickupInfo {
  const hits: Hit[] = []
  routes.forEach((route, r) => {
    for (const stop of route.stops || []) {
      if (stop.type !== 'pickup') continue
      const matched = posForStop(stop, pos)
      if (matched.some((m) => (m.id !== undefined && po.id !== undefined && idOf(m.id) === idOf(po.id)) || (m.poNumber && m.poNumber === po.poNumber))) {
        hits.push({ status: stop.status || 'pending', routeNumber: r + 1, tracking: route.trackingNumber })
      }
    }
  })
  return infoFromHits(hits)
}

// Pickup state of the items that come from Primegen's own warehouse.
export function warehousePickupInfo(routes: RouteLike[]): PickupInfo {
  const hits: Hit[] = []
  routes.forEach((route, r) => {
    for (const stop of route.stops || []) {
      if (stop.type === 'pickup' && isWarehouseStop(stop)) {
        hits.push({ status: stop.status || 'pending', routeNumber: r + 1, tracking: route.trackingNumber })
      }
    }
  })
  return infoFromHits(hits)
}

// One entry per order item: its supplier PO's pickup state (or the
// warehouse's, for items with no supplier).
export function itemPickupInfos(items: any[], pos: any[], routes: RouteLike[]): PickupInfo[] {
  const refs = pos.map(toPoRef)
  const cache = new Map<string, PickupInfo>()
  const warehouse = warehousePickupInfo(routes)
  return (items || []).map((item) => {
    const poId = idOf(item?.assignedPOId)
    if (!poId) return warehouse
    const ref = refs.find((p) => idOf(p.id) === poId)
    if (!ref) return { state: 'unscheduled' as PickupState }
    if (!cache.has(poId)) cache.set(poId, poPickupInfo(ref, refs, routes))
    return cache.get(poId)!
  })
}

export function pickupProgress(items: any[], pos: any[], routes: RouteLike[]): { total: number; pickedUp: number } {
  const infos = itemPickupInfos(items, pos, routes)
  return { total: infos.length, pickedUp: infos.filter((i) => i.state === 'picked_up').length }
}

// A route is finished when all its drop-offs are done (or, for a pickup-only
// route, when all its stops are done).
export function routeIsComplete(stops: StopLike[] | null | undefined): boolean {
  const all = stops || []
  const drops = all.filter((s) => s.type === 'dropoff')
  if (drops.length > 0) return drops.every((s) => s.status === 'completed')
  return all.length > 0 && all.every((s) => s.status === 'completed')
}

// The order is delivered once every drop-off on every one of its routes is done.
export function orderStatusFromRoutes(routes: RouteLike[]): 'delivered' | 'shipped' {
  const drops = routes.flatMap((r) => r.stops || []).filter((s) => s.type === 'dropoff')
  return drops.length > 0 && drops.every((s) => s.status === 'completed') ? 'delivered' : 'shipped'
}
