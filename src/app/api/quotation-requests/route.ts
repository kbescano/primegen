import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
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
const ALLOWED_SOURCES = ['website', 'facebook', 'google', 'viber', 'dummy', 'email', 'marketPlace', 'existingClient', 'callText', 'other']
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
    for (const field of ['phone', 'email', 'facebookLink', 'sourceOther'] as const) {
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

    // This same endpoint also backs CreateRFQModal, which staff use from
    // inside the admin dashboard (Quotation Inbox and Inquiry Tracker) to
    // manually encode an inquiry that came in by phone/walk-in. On Quotation
    // Inbox -- a rep's own view -- auto-assign the new inquiry to whoever
    // created it, so they don't have to re-open it and assign themselves
    // right after. Inquiry Tracker is the admin/marketing triage board,
    // where "unassigned" is a tracked, meaningful state staff route from --
    // it always sends assignToSelf: false, so it's unaffected by this.
    // The identity half (who's allowed to be assigned at all) is still
    // decided entirely server-side below: this flag can only ever narrow
    // eligibility, never grant it, so trusting it here is safe even though
    // it's client-supplied. assignedTo itself is never taken from the
    // request body -- this route stays public for the site's own "Request
    // a Quote" form, and an anonymous caller could otherwise hand out
    // inquiries to any staff account just by naming its id.
    const reqHeaders = await getHeaders()
    const { user: creator } = await payload.auth({ headers: reqHeaders })
    // assignedTo's own filterOptions only allows role "user" or
    // nica@primegen.admin (see QuotationRequests.ts) -- Payload re-checks
    // that on every save regardless of who's asking, so auto-assigning an
    // Admin/Marketing creator outside that set would fail the create
    // outright. Leave it unassigned for them instead, same as before.
    const canAutoAssign =
      body.assignToSelf === true &&
      !!creator &&
      (creator.role === 'user' || creator.email === 'nica@primegen.admin')

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
        sourceOther: body.sourceOther || '',
        status: 'pending', // Default status for new inquiries
        items, // Will be an empty array if "To be confirmed" was checked
        ...(canAutoAssign ? { assignedTo: creator!.id } : {}),
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