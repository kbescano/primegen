import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { pauseAllCampaigns } from '@/lib/metaAds'

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await pauseAllCampaigns()

    // Log the action for full transparency, same as any other agent action
    await payload.create({
      collection: 'agent-actions',
      data: {
        summary: `Manual pause-all triggered by ${user.email}`,
        reasoning: 'Admin used the emergency Pause All Ads button on the dashboard.',
        actionType: 'pause-all',
        riskLevel: 'high',
        status: 'approved',
        reviewedBy: user.id,
        executedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({ success: true, pausedCount: result.pausedCount })
  } catch (err) {
    console.error('Pause-all failed:', err)
    return NextResponse.json({ error: 'Failed to pause campaigns' }, { status: 500 })
  }
}
