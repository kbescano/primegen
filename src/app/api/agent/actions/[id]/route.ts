import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { updateCampaignBudget, setCampaignStatus } from '@/lib/metaAds'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { decision } = await req.json() // 'approved' | 'rejected'
  const action = await payload.findByID({ collection: 'agent-actions', id })

  if (!action) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 })
  }

  if (decision === 'rejected') {
    await payload.update({
      collection: 'agent-actions',
      id,
      data: { status: 'rejected', reviewedBy: user.id },
    })
    return NextResponse.json({ success: true })
  }

  // Approved — execute the actual change on the ad account
  try {
    const change = action.proposedChange as any

    switch (action.actionType) {
      case 'increase-budget':
      case 'decrease-budget':
        await updateCampaignBudget(action.targetCampaignId as string, change.newDailyBudgetCentavos)
        break
      case 'pause-adset':
        await setCampaignStatus(action.targetCampaignId as string, 'PAUSED')
        break
      case 'resume-adset':
        await setCampaignStatus(action.targetCampaignId as string, 'ACTIVE')
        break
      default:
        // new-campaign, new-creative, targeting-change would call additional
        // Meta API endpoints here (Campaigns/AdCreatives) following the same pattern.
        break
    }

    await payload.update({
      collection: 'agent-actions',
      id,
      data: {
        status: 'approved',
        reviewedBy: user.id,
        executedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to execute approved action:', err)
    await payload.update({
      collection: 'agent-actions',
      id,
      data: { status: 'failed', reviewedBy: user.id },
    })
    return NextResponse.json({ error: 'Execution failed' }, { status: 500 })
  }
}
