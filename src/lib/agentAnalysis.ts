import { getPayloadClient } from '@/lib/getPayloadClient'
import { getActiveCampaigns, getCampaignInsights } from '@/lib/metaAds'

// Risk classification: keeps the agent from ever auto-executing something
// that could meaningfully disrupt the client's lead pipeline.
const HIGH_RISK_ACTIONS = new Set(['new-campaign', 'targeting-change', 'pause-all'])
const LARGE_BUDGET_CHANGE_THRESHOLD = 0.25 // >25% change is treated as high-risk regardless of type

interface AgentSuggestion {
  summary: string
  reasoning: string
  actionType:
    | 'increase-budget'
    | 'decrease-budget'
    | 'pause-adset'
    | 'resume-adset'
    | 'new-campaign'
    | 'new-creative'
    | 'targeting-change'
  targetCampaignId?: string
  proposedChange?: Record<string, unknown>
  budgetChangeFraction?: number // e.g. 0.15 for +15%
}

async function callClaude(prompt: string): Promise<AgentSuggestion[]> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
  const data = await res.json()
  const text = data.content.find((b: any) => b.type === 'text')?.text || '[]'

  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

function buildAnalysisPrompt(campaigns: any[], insightsByCampaign: Record<string, any>) {
  return `You are an ads performance analyst for a construction products trading company in the Philippines. Their business depends entirely on leads (quotation requests) generated from Facebook ads.

Here is yesterday's performance data per campaign:
${JSON.stringify(insightsByCampaign, null, 2)}

Campaign list:
${JSON.stringify(campaigns, null, 2)}

Analyze this data and suggest 0-3 concrete actions to improve lead generation or reduce wasted spend. For each suggestion, respond ONLY with a JSON array (no preamble, no markdown fences) of objects with this exact shape:

[
  {
    "summary": "short human-readable summary of the action",
    "reasoning": "2-3 sentence explanation grounded in the data above",
    "actionType": "increase-budget" | "decrease-budget" | "pause-adset" | "resume-adset" | "new-campaign" | "new-creative" | "targeting-change",
    "targetCampaignId": "campaign id if applicable",
    "budgetChangeFraction": 0.15,
    "proposedChange": { "newDailyBudgetCentavos": 50000 }
  }
]

Only suggest budget increases when cost-per-lead is trending favorably and stable. Only suggest pausing when performance is clearly poor over multiple days, not a single bad day. Be conservative — this business cannot afford to lose its lead pipeline to a bad automated decision. If nothing meaningfully needs to change, return an empty array.`
}

function classifyRisk(suggestion: AgentSuggestion): 'low' | 'high' {
  if (HIGH_RISK_ACTIONS.has(suggestion.actionType)) return 'high'
  if (
    (suggestion.actionType === 'increase-budget' || suggestion.actionType === 'decrease-budget') &&
    Math.abs(suggestion.budgetChangeFraction ?? 0) > LARGE_BUDGET_CHANGE_THRESHOLD
  ) {
    return 'high'
  }
  return 'low'
}

// Main entry point — run this on a daily schedule (e.g. via a cron trigger
// calling POST /api/agent/run, see the route below).
export async function runDailyAgentAnalysis() {
  const payload = await getPayloadClient()
  const requireApproval = process.env.AGENT_REQUIRE_APPROVAL !== 'false'

  const { data: campaigns } = await getActiveCampaigns()
  const insightsByCampaign: Record<string, any> = {}

  for (const c of campaigns || []) {
    try {
      insightsByCampaign[c.id] = await getCampaignInsights(c.id)
    } catch {
      insightsByCampaign[c.id] = null
    }
  }

  const suggestions = await callClaude(buildAnalysisPrompt(campaigns || [], insightsByCampaign))

  const created = []
  for (const s of suggestions) {
    const riskLevel = classifyRisk(s)
    // Even "low risk" actions stay pending if AGENT_REQUIRE_APPROVAL is true —
    // recommended default while the client is building trust in the agent.
    const status = !requireApproval && riskLevel === 'low' ? 'auto-executed' : 'pending'

    const doc = await payload.create({
      collection: 'agent-actions',
      data: {
        summary: s.summary,
        reasoning: s.reasoning,
        actionType: s.actionType,
        riskLevel,
        status,
        targetCampaignId: s.targetCampaignId,
        proposedChange: s.proposedChange,
      },
    })
    created.push(doc)
  }

  return { suggestionsCount: created.length, created }
}
