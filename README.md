# Primegen Trading Corporation. — Website + Ad Agent

Next.js 15 + Payload CMS 3 site for a construction materials trading company, with an
AI-assisted Facebook Ads management agent that requires human approval for meaningful changes.

## What's included

- **Public website** — home (live price ticker), materials catalog, quotation request form
- **Payload CMS** — client edits materials (photos/prices/stock), pages, reviews leads
- **Admin dashboard** (`/admin-dashboard`) — ads overview, pending approvals, analytics, quotation inbox, pause-all button
- **Ad agent** — daily Claude-powered analysis of Meta Ads performance, proposes actions, logs everything to `agent-actions`

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URI` — Postgres connection string (e.g. Neon, Supabase, or self-hosted)
   - `PAYLOAD_SECRET` — any long random string
   - `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` — from Meta Business/Developer account
   - `ANTHROPIC_API_KEY` — from platform.claude.com
   - `AGENT_CRON_SECRET` — random string, used to authenticate the daily cron trigger
3. `npm run dev` — visit `localhost:3000` for the public site, `localhost:3000/admin` for Payload's built-in CMS admin, `localhost:3000/admin-dashboard` for the ads/leads dashboard
4. First run: create your first admin user at `/admin` (Payload prompts for this automatically)

## Safety design (important — read before going live)

- **Nothing executes on the ad account without human approval** by default
  (`AGENT_REQUIRE_APPROVAL=true` in `.env`). Only flip this once you trust the agent's judgment,
  and even then, high-risk actions (new campaigns, targeting changes, large budget swings) always
  require approval regardless of this setting.
- **Set a hard spend cap directly in Meta Ads Manager** (Billing → spending limit) as a backstop
  independent of this app — if the agent or app has a bug, this is what actually stops runaway spend.
- **Pause All Ads button** is always visible in the dashboard sidebar and works even if the
  approval workflow has an issue — it's a direct, simple API call.
- **Quotations are never auto-sent.** The form only saves to the database; a human always
  reviews and replies through their own channel (call/email/etc.).

## Running the daily agent analysis

Meta's Ads API doesn't push events — you need to trigger analysis on a schedule. `vercel.json`
includes a Cron Job hitting `/api/agent/run` daily. If deploying elsewhere, set up any scheduler
(cron, GitHub Actions, etc.) to POST to that endpoint with header:
`Authorization: Bearer <AGENT_CRON_SECRET>`

## Populating ad-snapshots for the analytics dashboard

The current `agentAnalysis.ts` pulls live insights for suggestions but doesn't yet persist daily
snapshots into `ad-snapshots` for historical charting. Add a small step in `runDailyAgentAnalysis`
(or a separate scheduled function) that writes one `ad-snapshots` doc per campaign per day —
straightforward extension of the existing Meta insights call.

## Next steps before handing to a client

- Wire up `ad-snapshots` population (see above)
- Add lead source tagging so `QuotationRequests` can be matched back to the campaign that generated them
- Consider adding email/SMS notification (not auto-send of quotes — just an alert to the admin
  that a new lead arrived) so they don't have to keep checking the dashboard
- Test the full approval flow against a Meta sandbox ad account before connecting a real one
