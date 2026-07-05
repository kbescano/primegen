import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/getPayloadClient'

// Saves the quotation request to the database only.
// No email/SMS is triggered here — the admin reviews and follows up manually
// via the admin dashboard's Quotation Inbox. Prices are never part of this
// payload — the customer-facing form only ever sends material IDs and quantities.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = await getPayloadClient()

    const doc = await payload.create({
      collection: 'quotation-requests',
      data: {
        customerName: body.customerName,
        phone: body.phone,
        email: body.email || undefined,
        projectType: body.projectType || 'other',
        items: Array.isArray(body.items)
          ? body.items
              .filter((i: any) => i.material !== undefined && i.material !== '')
              .map((i: any) => ({ material: Number(i.material), quantity: Number(i.quantity) || 1 }))
          : [],
        message: body.message || '',
        source: body.source || 'website',
        status: 'pending',
      },
    })

    return NextResponse.json({ success: true, id: doc.id })
  } catch (err: any) {
    console.error('Quotation submission failed:', JSON.stringify(err, null, 2))
    return NextResponse.json(
      { success: false, error: 'Submission failed', debug: err?.data || err?.message || String(err) },
      { status: 500 },
    )
  }
}