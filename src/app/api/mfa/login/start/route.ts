import { NextRequest, NextResponse } from 'next/server'
import { generatePayloadCookie } from 'payload/shared'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const dynamic = 'force-dynamic'

// Replaces a direct call to Payload's own public /api/users/login for the
// login form specifically -- that endpoint sets the real session cookie
// the instant the password is correct, which would make MFA purely
// cosmetic (anyone could just skip the code screen and navigate straight
// into the dashboard, since they'd already be logged in). Using the Local
// API here instead means *this* route decides if/when the cookie actually
// gets set.
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()

  let email: string, password: string
  try {
    const body = await req.json()
    email = typeof body.email === 'string' ? body.email : ''
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  try {
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (!result.user || !result.token) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // login() only returns id/email/role (whatever's saveToJWT) -- fetch
    // the full doc via Local API (overrideAccess bypasses totpEnabled's
    // own "never editable via the API" read lock, which is exactly what a
    // trusted server-side check is for) to see if this account needs a
    // second step.
    const fullUser: any = await payload.findByID({
      collection: 'users',
      id: result.user.id,
      overrideAccess: true,
    })

    if (!fullUser?.totpEnabled) {
      // No MFA on this account -- log all the way in now, same as a
      // normal login.
      const cookie = generatePayloadCookie({
        collectionAuthConfig: payload.collections.users.config.auth,
        cookiePrefix: payload.config.cookiePrefix,
        token: result.token,
      })
      return NextResponse.json(
        { mfaRequired: false, user: result.user },
        { headers: { 'Set-Cookie': cookie } },
      )
    }

    // MFA is on -- password was correct, but no cookie gets set yet. The
    // client moves to the code screen and re-submits password + code
    // together to /api/mfa/login/verify.
    return NextResponse.json({ mfaRequired: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Invalid email or password' },
      { status: 401 },
    )
  }
}
