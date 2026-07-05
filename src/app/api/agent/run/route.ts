import { NextRequest, NextResponse } from 'next/server'
import { runDailyAgentAnalysis } from '@/lib/agentAnalysis'

// Protect this route with a secret so only your scheduler can trigger it.
// In Vercel, set this as a Cron Job hitting this URL with the header below.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.AGENT_CRON_SECRET}`) {
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
