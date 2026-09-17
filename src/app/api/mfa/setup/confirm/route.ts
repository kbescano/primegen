import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { encryptSecret, verifyTotpCode } from '@/lib/mfa'

export const dynamic = 'force-dynamic'

// Proves the user actually scanned the QR code and their app is producing
// valid codes before anything gets saved -- only then is totpEnabled
// flipped on. Uses overrideAccess: true because totpEnabled/totpSecret are
// both locked against direct API writes (see Users.ts) precisely so they
// can only change through this verified path.
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()
  const reqHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let secret: string, code: string
  try {
    const body = await req.json()
    secret = typeof body.secret === 'string' ? body.secret : ''
    code = typeof body.code === 'string' ? body.code.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!secret || !code) {
    return NextResponse.json({ error: 'Secret and code are required' }, { status: 400 })
  }

  if (!verifyTotpCode(secret, code)) {
    return NextResponse.json({ error: 'Invalid code -- check the app and try again' }, { status: 400 })
  }

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { totpEnabled: true, totpSecret: encryptSecret(secret) },
    overrideAccess: true,
  })

  return NextResponse.json({ success: true })
}
