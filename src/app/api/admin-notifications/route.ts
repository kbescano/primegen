import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'

export async function GET(req: NextRequest) {
  const payload = await getPayloadClient()
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sinceParam = req.nextUrl.searchParams.get('since')
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const sinceDate = sinceParam ? new Date(sinceParam) : twoHoursAgo
  // Never look back further than 2 hours, no matter how stale "since" is --
  // that's the decay window so an unopened bell doesn't inflate forever.
  const effectiveSince = sinceDate > twoHoursAgo ? sinceDate : twoHoursAgo

  const [recentRes, unreadRes] = await Promise.all([
    payload.find({
      collection: 'quotation-requests',
      where: { status: { equals: 'pending' } },
      sort: '-createdAt',
      limit: 5,
    }),
    payload.find({
      collection: 'quotation-requests',
      where: {
        and: [
          { status: { equals: 'pending' } },
          { createdAt: { greater_than: effectiveSince.toISOString() } },
        ],
      },
      limit: 1, // we only need totalDocs, not the actual records
    }),
  ])

  return NextResponse.json({
    count: unreadRes.totalDocs,
    items: recentRes.docs.map((d: any) => ({
      id: d.id,
      customerName: d.customerName,
      createdAt: d.createdAt,
    })),
  })
}
