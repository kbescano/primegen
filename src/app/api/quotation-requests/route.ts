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
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  // Calculate what's "new" since the bell was last opened
  const lastSeenDate = sinceParam ? new Date(sinceParam) : oneDayAgo
  const effectiveSince = lastSeenDate > oneDayAgo ? lastSeenDate : oneDayAgo

  const items: any[] = []
  let unreadCount = 0

  function processDocs(docs: any[], idPrefix: string, msgFn: (d: any) => string, linkFn: (d: any) => string, dateField: string = 'updatedAt') {
    docs.forEach((d: any) => {
      const dateStr = d[dateField]
      const isNew = new Date(dateStr) > effectiveSince
      if (isNew) unreadCount++

      items.push({
        id: `${idPrefix}-${d.id}`,
        message: msgFn(d),
        link: linkFn(d),
        createdAt: dateStr,
        read: !isNew // Visually mark as read if older than last opened
      })
    })
  }

  // 1. New Quotation Requests
  const pendingReqs = await payload.find({
    collection: 'quotation-requests',
    where: {
      and: [
        { status: { equals: 'pending' } },
        { createdAt: { greater_than: oneDayAgo.toISOString() } },
      ],
    },
    limit: 20,
  })
  processDocs(pendingReqs.docs, 'req-new', d => `New RFQ from ${d.customerName || 'a customer'}`, d => `/admin-dashboard/pipeline/${d.id}`, 'createdAt')

  // 2. Status Updates on Requests (Staff changed status)
  const updatedReqs = await payload.find({
    collection: 'quotation-requests',
    where: {
      and: [
        { status: { not_equals: 'pending' } },
        { updatedAt: { greater_than: oneDayAgo.toISOString() } },
      ],
    },
    limit: 20,
  })
  const actualUpdates = updatedReqs.docs.filter((d: any) => d.createdAt !== d.updatedAt)
  processDocs(actualUpdates, 'req-upd', d => `RFQ ${d.customerName} status updated to ${d.status}`, d => `/admin-dashboard/pipeline/${d.id}`)

  // 3. Quotations Pending Approval
  const pendingQuotes = await payload.find({
    collection: 'client-quotations',
    where: {
      and: [
        { status: { equals: 'pending_approval' } },
        { updatedAt: { greater_than: oneDayAgo.toISOString() } },
      ],
    },
    limit: 20,
  })
  processDocs(pendingQuotes.docs, 'quo-pend', d => `Quotation ${d.quotationNumber} requires approval`, d => `/admin-dashboard/client-quotation?id=${d.id}`)

  // 4. Orders with Pending OPEX
  const updatedOrders = await payload.find({
    collection: 'orders',
    where: { updatedAt: { greater_than: oneDayAgo.toISOString() } },
    limit: 20,
  })
  const opexOrders = updatedOrders.docs.filter((d: any) => Array.isArray(d.opex) && d.opex.some((exp: any) => exp.status === 'pending'))
  processDocs(opexOrders, 'ord-opex', d => `Order ${d.orderNumber} has pending OPEX`, d => `/admin-dashboard/orders?id=${d.id}`)

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({
    count: unreadCount,
    items: items.slice(0, 40),
  })
}