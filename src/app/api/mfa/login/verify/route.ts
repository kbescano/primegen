import { NextRequest, NextResponse } from 'next/server'
import { generatePayloadCookie } from 'payload/shared'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { decryptSecret, verifyTotpCode } from '@/lib/mfa'

export const dynamic = 'force-dynamic'

// Second step for an account with MFA enabled. Re-verifies the password
// (cheap, and it's what re-triggers Payload's own login-attempt/lockout
// protection on repeated failures) alongside the TOTP code, and only then
// issues the real session cookie.
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()

  let email: string, password: string, code: string
  try {
    const body = await req.json()
    email = typeof body.email === 'string' ? body.email : ''
    password = typeof body.password === 'string' ? body.password : ''
    code = typeof body.code === 'string' ? body.code.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!email || !password || !code) {
    return NextResponse.json({ error: 'Email, password, and code are required' }, { status: 400 })
  }

  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (!result.user || !result.token) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const fullUser: any = await payload.findByID({
      collection: 'users',
      id: result.user.id,
      overrideAccess: true,
    })

    if (!fullUser?.totpEnabled || !fullUser?.totpSecret) {
      return NextResponse.json({ error: 'MFA is not enabled on this account' }, { status: 400 })
    }

    const secret = decryptSecret(fullUser.totpSecret)
    if (!verifyTotpCode(secret, code)) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
    }

    const cookie = generatePayloadCookie({
      collectionAuthConfig: payload.collections.users.config.auth,
      cookiePrefix: payload.config.cookiePrefix,
      token: result.token,
    })
    return NextResponse.json(
      { user: result.user },
      { headers: { 'Set-Cookie': cookie } },
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Invalid email or password' },
      { status: 401 },
    )
  }
}
