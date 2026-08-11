import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'

export async function GET(req: NextRequest) {
  const payload = await getPayloadClient()
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sinceParam = req.nextUrl.searchParams.get('since')
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const sinceDate = sinceParam ? new Date(sinceParam) : twoHoursAgo
  
  // Never look back further than 2 hours so an unopened bell doesn't inflate forever.
  const effectiveSince = sinceDate > twoHoursAgo ? sinceDate : twoHoursAgo

  const items: any[] = []

  // 1. New Quotation Requests
  const pendingReqs = await payload.find({
    collection: 'quotation-requests',
    where: {
      and: [
        { status: { equals: 'pending' } },
        { createdAt: { greater_than: effectiveSince.toISOString() } },
      ],
    },
    limit: 20,
  })
  pendingReqs.docs.forEach((d: any) => {
    items.push({
      id: `req-new-${d.id}`,
      message: `New RFQ from ${d.customerName || 'a customer'}`,
      link: `/admin-dashboard/pipeline/${d.id}`,
      createdAt: d.createdAt,
    })
  })

  // 2. Status Updates on Requests (Updated by staff)
  const updatedReqs = await payload.find({
    collection: 'quotation-requests',
    where: {
      and: [
        { status: { not_equals: 'pending' } },
        { updatedAt: { greater_than: effectiveSince.toISOString() } },
      ],
    },
    limit: 20,
  })
  updatedReqs.docs.forEach((d: any) => {
    // Only capture it if it's an actual update, not a fresh creation
    if (d.createdAt === d.updatedAt) return
    items.push({
      id: `req-upd-${d.id}`,
      message: `RFQ ${d.customerName} status updated to ${d.status}`,
      link: `/admin-dashboard/pipeline/${d.id}`,
      createdAt: d.updatedAt,
    })
  })

  // 3. Quotations Pending Approval
  const pendingQuotes = await payload.find({
    collection: 'client-quotations',
    where: {
      and: [
        { status: { equals: 'pending_approval' } },
        { updatedAt: { greater_than: effectiveSince.toISOString() } },
      ],
    },
    limit: 20,
  })
  pendingQuotes.docs.forEach((d: any) => {
    items.push({
      id: `quo-pend-${d.id}`,
      message: `Quotation ${d.quotationNumber} requires approval`,
      link: `/admin-dashboard/client-quotation?id=${d.id}`,
      createdAt: d.updatedAt,
    })
  })

  // 4. Orders with Pending OPEX
  const updatedOrders = await payload.find({
    collection: 'orders',
    where: {
      updatedAt: { greater_than: effectiveSince.toISOString() },
    },
    limit: 20,
  })
  updatedOrders.docs.forEach((d: any) => {
    const hasPendingOpex = Array.isArray(d.opex) && d.opex.some((exp: any) => exp.status === 'pending')
    if (hasPendingOpex) {
      items.push({
        id: `ord-opex-${d.id}`,
        message: `Order ${d.orderNumber} has pending OPEX`,
        link: `/admin-dashboard/orders?id=${d.id}`,
        createdAt: d.updatedAt,
      })
    }
  })

  // Sort aggregated items by most recent first
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({
    count: items.length,
    items: items.slice(0, 20), // Cap payload size
  })
}