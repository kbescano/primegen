import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const dynamic = 'force-dynamic'

// This endpoint is intentionally public (it's the site's "Request a Quote"
// form), so it's the one place on the site anyone on the internet can write
// to without an account. Payload's own field schema already rejects bad
// enum values, missing relationships, etc., but it doesn't bound string
// length or array size -- so add the basic shape/size checks here to stop
// obviously-abusive submissions (megabyte-sized fields, thousands of line
// items) before they hit the database.
const MAX_TEXT = 500
const MAX_MESSAGE = 5000
const MAX_ITEMS = 50
const ALLOWED_SOURCES = ['website', 'facebook', 'google', 'viber', 'dummy', 'email', 'marketPlace']
const ALLOWED_PROJECT_TYPES = ['residential', 'commercial', 'renovation', 'other']

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

export async function POST(req: Request) {
  try {
    const payload = await getPayloadClient()

    // Parse the incoming form data from CreateRFQModal
    const body = await req.json()

    if (!isNonEmptyString(body.customerName) || body.customerName.trim().length > MAX_TEXT) {
      return NextResponse.json({ error: 'customerName is required' }, { status: 400 })
    }
    for (const field of ['phone', 'email', 'facebookLink'] as const) {
      if (body[field] != null && (typeof body[field] !== 'string' || body[field].length > MAX_TEXT)) {
        return NextResponse.json({ error: `${field} is invalid` }, { status: 400 })
      }
    }
    if (body.message != null && (typeof body.message !== 'string' || body.message.length > MAX_MESSAGE)) {
      return NextResponse.json({ error: 'message is too long' }, { status: 400 })
    }
    if (body.projectType != null && !ALLOWED_PROJECT_TYPES.includes(body.projectType)) {
      return NextResponse.json({ error: 'projectType is invalid' }, { status: 400 })
    }
    const source = isNonEmptyString(body.source) ? body.source : 'website'
    if (!ALLOWED_SOURCES.includes(source)) {
      return NextResponse.json({ error: 'source is invalid' }, { status: 400 })
    }
    const items = body.items || []
    if (!Array.isArray(items) || items.length > MAX_ITEMS) {
      return NextResponse.json({ error: `items must be an array of at most ${MAX_ITEMS}` }, { status: 400 })
    }

    // Create the document in Payload CMS
    const doc = await payload.create({
      collection: 'quotation-requests',
      data: {
        customerName: body.customerName.trim(),
        phone: body.phone,
        email: body.email,
        projectType: body.projectType,
        message: body.message,
        source,
        facebookLink: body.facebookLink || '',
        status: 'pending', // Default status for new inquiries
        items, // Will be an empty array if "To be confirmed" was checked
      },
    })

    return NextResponse.json({ success: true, doc }, { status: 201 })

  } catch (error: any) {
    console.error('[API] Error creating quotation request:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}