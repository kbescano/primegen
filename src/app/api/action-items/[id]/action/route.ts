import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'

// Comment / solve / unresolve / close transitions on an Action Item.
// Creating one happens through Payload's own POST /api/action-items
// (collection `create` access is already admin-only) -- this route only
// covers what happens after that:
//   comment    (pending/solved)   Admin or the recipient
//   solve      (pending -> solved) Admin or the recipient
//   unresolve  (solved -> pending) Admin or the recipient -- undoes an
//              accidental/premature "solved", or reopens one that turned
//              out not to be fixed
//   close      (solved -> closed)  Admin only
//
// `status`/`comments` are locked to access.update: () => false on the
// collection, so this is the only way to change them.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()
  const reqHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = user.role === 'admin'

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const type = body?.type
  const message = typeof body?.message === 'string' ? body.message.trim() : ''

  if (!['comment', 'solve', 'unresolve', 'close'].includes(type)) {
    return NextResponse.json({ error: 'type must be one of: comment, solve, unresolve, close' }, { status: 400 })
  }

  const item = await payload.findByID({ collection: 'action-items', id }).catch(() => null)
  if (!item) {
    return NextResponse.json({ error: 'Action item not found' }, { status: 404 })
  }

  const recipientId = item.recipient
    ? String(typeof item.recipient === 'object' ? (item.recipient as any).id : item.recipient)
    : null
  const isRecipient = recipientId !== null && recipientId === String(user.id)

  if (!isAdmin && !isRecipient) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const comments = Array.isArray(item.comments) ? [...item.comments] : []
  const authorName = user.name || user.email || (isAdmin ? 'Admin' : 'Staff')
  const authorRole = isAdmin ? 'admin' : 'user'

  if (type === 'comment') {
    if (item.status !== 'pending' && item.status !== 'solved') {
      return NextResponse.json({ error: 'This action item is closed' }, { status: 409 })
    }
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }
    comments.push({ message, authorName, authorRole, createdAt: new Date().toISOString() })

    await payload.update({
      collection: 'action-items',
      id,
      data: { comments },
      overrideAccess: true,
    })
    return NextResponse.json({ success: true })
  }

  if (type === 'solve') {
    if (item.status !== 'pending') {
      return NextResponse.json({ error: 'Action item is not pending' }, { status: 409 })
    }
    if (message) {
      comments.push({ message, authorName, authorRole, createdAt: new Date().toISOString() })
    }

    await payload.update({
      collection: 'action-items',
      id,
      data: { status: 'solved', comments },
      overrideAccess: true,
    })

    return NextResponse.json({ success: true })
  }

  if (type === 'unresolve') {
    if (item.status !== 'solved') {
      return NextResponse.json({ error: 'Action item is not solved' }, { status: 409 })
    }
    comments.push({
      message: message || 'Marked as unresolved.',
      authorName,
      authorRole,
      createdAt: new Date().toISOString(),
    })

    await payload.update({
      collection: 'action-items',
      id,
      data: { status: 'pending', comments },
      overrideAccess: true,
    })

    return NextResponse.json({ success: true })
  }

  // close
  if (!isAdmin) {
    return NextResponse.json({ error: 'Only Admin can close an action item' }, { status: 401 })
  }
  if (item.status !== 'solved') {
    return NextResponse.json({ error: 'Action item is not solved yet' }, { status: 409 })
  }

  await payload.update({
    collection: 'action-items',
    id,
    data: { status: 'closed' },
    overrideAccess: true,
  })

  return NextResponse.json({ success: true })
}
