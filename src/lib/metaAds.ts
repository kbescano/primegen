// Thin wrapper around Meta's Marketing API (Graph API v22+).
// All calls are server-side only — the ad account access token never
// reaches the browser.

const GRAPH_VERSION = 'v22.0'
const BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`

function getAccessToken() {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN is not set')
  return token
}

function getAdAccountId() {
  const id = process.env.META_AD_ACCOUNT_ID
  if (!id) throw new Error('META_AD_ACCOUNT_ID is not set')
  return id // format: act_XXXXXXXXXX
}

export async function getActiveCampaigns() {
  const url = `${BASE_URL}/${getAdAccountId()}/campaigns?fields=id,name,status,daily_budget,lifetime_budget&access_token=${getAccessToken()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Meta API error: ${res.status}`)
  return res.json()
}

export async function getCampaignInsights(campaignId: string, datePreset = 'yesterday') {
  const url = `${BASE_URL}/${campaignId}/insights?fields=spend,impressions,clicks,ctr,actions&date_preset=${datePreset}&access_token=${getAccessToken()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Meta API error: ${res.status}`)
  return res.json()
}

export async function updateCampaignBudget(campaignId: string, dailyBudgetCentavos: number) {
  const url = `${BASE_URL}/${campaignId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      daily_budget: String(dailyBudgetCentavos),
      access_token: getAccessToken(),
    }),
  })
  if (!res.ok) throw new Error(`Meta API error: ${res.status}`)
  return res.json()
}

export async function setCampaignStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED') {
  const url = `${BASE_URL}/${campaignId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      status,
      access_token: getAccessToken(),
    }),
  })
  if (!res.ok) throw new Error(`Meta API error: ${res.status}`)
  return res.json()
}

// Emergency stop: pauses every active campaign on the ad account.
export async function pauseAllCampaigns() {
  const { data: campaigns } = await getActiveCampaigns()
  const active = (campaigns || []).filter((c: any) => c.status === 'ACTIVE')
  const results = await Promise.allSettled(
    active.map((c: any) => setCampaignStatus(c.id, 'PAUSED')),
  )
  return { pausedCount: active.length, results }
}
