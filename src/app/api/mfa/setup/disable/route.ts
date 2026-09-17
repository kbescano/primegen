import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const dynamic = 'force-dynamic'

// Re-verifies the current password before turning MFA off -- someone
// walking up to an already-logged-in, unlocked session shouldn't be able
// to disable this with one click.
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()
  const reqHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: reqHeaders })

  // payload.auth()'s generic User type marks email optional (it also
  // covers username-only auth setups), even though this app's Users
  // collection always requires it -- narrow it explicitly for TS.
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let password: string
  try {
    const body = await req.json()
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!password) {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  try {
    await payload.login({
      collection: 'users',
      data: { email: user.email, password },
    })
  } catch {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { totpEnabled: false, totpSecret: null },
    overrideAccess: true,
  })

  return NextResponse.json({ success: true })
}
