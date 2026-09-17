import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import QRCode from 'qrcode'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { generateTotpSecret } from '@/lib/mfa'

export const dynamic = 'force-dynamic'

// Any logged-in user can set up MFA on their own account -- this is a
// personal security choice, not a role-gated admin feature. Generates a
// fresh secret and its QR code but does NOT save anything yet; nothing is
// persisted until /api/mfa/setup/confirm proves the user actually scanned
// it correctly, so an abandoned setup never leaves an account half
// configured.
export async function POST() {
  const payload = await getPayloadClient()
  const reqHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: reqHeaders })

  // payload.auth()'s generic User type marks email optional, even though
  // this app's Users collection always requires it -- narrow for TS.
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { base32Secret, otpauthUrl } = generateTotpSecret(user.email)
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl)

  return NextResponse.json({ secret: base32Secret, qrDataUrl })
}
