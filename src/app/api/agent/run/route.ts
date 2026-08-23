import { NextRequest, NextResponse } from 'next/server'
import { runDailyAgentAnalysis } from '@/lib/agentAnalysis'

// Protect this route with a secret so only your scheduler can trigger it.
// Set CRON_SECRET in the environment; Vercel Cron (see vercel.json) sends a
// GET request, so that's the method that actually needs to be protected and
// callable here -- this previously only exported POST, so the scheduled
// cron job in vercel.json would have 405'd every time it fired and this
// route would never have actually run on schedule.
function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  return Boolean(secret) && authHeader === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDailyAgentAnalysis()
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('Agent analysis run failed:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

// Kept for manual/out-of-band triggering with the same secret.
export async function POST(req: NextRequest) {
  return GET(req)
}
