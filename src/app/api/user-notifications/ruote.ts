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

  // recipient is a relationship field -> stores the user's ID, not their
  // email. Coerce to numeric where possible since Postgres relationship
  // columns are typically numeric.
  const recipientId = isNaN(Number(user.id)) ? user.id : Number(user.id)

  // Retention rule: a notification stays visible for at least 1 day no
  // matter what, AND stays visible indefinitely while still unread. It
  // only drops out of the list once it is BOTH read AND older than 1 day.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  try {
    const res = await payload.find({
      collection: 'notifications' as any,
      where: {
        and: [
          { recipient: { equals: recipientId } },
          {
            or: [
              { createdAt: { greater_than: oneDayAgo.toISOString() } },
              { read: { equals: false } },
            ],
          },
        ],
      },
      sort: '-createdAt',
      limit: 50,
    })

    const unreadCount = res.docs.filter((d: any) => d.read !== true).length

    return NextResponse.json({
      count: unreadCount,
      items: res.docs.map((d: any) => ({
        id: d.id,
        message: d.message,
        link: d.link,
        createdAt: d.createdAt,
        read: d.read || false,
      })),
    })
  } catch (err) {
    console.error('Failed to fetch user notifications:', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const payload = await getPayloadClient()
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const targetId = isNaN(Number(body.id)) ? body.id : Number(body.id)

    await payload.update({
      collection: 'notifications' as any,
      id: targetId,
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to update notification:', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}