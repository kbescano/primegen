import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const dynamic = 'force-dynamic'

// totpEnabled isn't readable through a normal find/me call (see Users.ts's
// field-level access), so the account page needs this dedicated,
// server-side check instead.
export async function GET() {
  const payload = await getPayloadClient()
  const reqHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fullUser: any = await payload.findByID({
    collection: 'users',
    id: user.id,
    overrideAccess: true,
  })

  return NextResponse.json({ enabled: Boolean(fullUser?.totpEnabled) })
}
