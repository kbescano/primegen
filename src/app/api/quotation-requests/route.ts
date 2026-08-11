import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const payload = await getPayloadClient()
    
    // Parse the incoming form data from CreateRFQModal
    const body = await req.json()

    // Create the document in Payload CMS
    const doc = await payload.create({
      collection: 'quotation-requests',
      data: {
        customerName: body.customerName,
        phone: body.phone,
        email: body.email,
        projectType: body.projectType,
        message: body.message,
        source: body.source || 'website',
        status: 'pending', // Default status for new inquiries
        items: body.items || [], // Will be an empty array if "To be confirmed" was checked
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