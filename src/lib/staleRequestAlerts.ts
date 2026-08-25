import type { Payload } from 'payload'

// Business hours only: Mon-Fri, 8am-5pm Philippine time (Asia/Manila is a
// fixed UTC+8, no DST, so this is stable year-round). Outside that window
// nobody's expected to be following up within 5 minutes anyway, so no new
// alerts get raised -- this only gates *creating* new ones; an alert
// that's already open still auto-resolves the moment status moves to
// Processing, any time of day.
function isWithinPhBusinessHours(): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const weekday = parts.find((p) => p.type === 'weekday')?.value
  const hour = Number(parts.find((p) => p.type === 'hour')?.value)

  const isWeekday = weekday !== 'Sat' && weekday !== 'Sun'
  return isWeekday && hour >= 8 && hour < 17
}

// Arbitrary, just needs to be unique to this job -- nothing else in the app
// takes a Postgres advisory lock.
const ADVISORY_LOCK_KEY = 918_273_645

// Replaces a scheduled cron: instead of a scheduler hitting an endpoint
// every 5 minutes, this same check runs inline whenever /admin-dashboard is
// rendered -- on a normal page load, and on the client-side 5-minute
// auto-refresh in QuotationInboxClient. No CRON_SECRET, no Vercel Cron
// (and no worrying about the Hobby-plan daily-only limit) -- the trade-off
// is it only fires while someone actually has the dashboard open, instead
// of ticking in the background at all times. Given the point is "staff
// should notice within 5 minutes of checking their inbox," that's fine.
//
// Runs with overrideAccess: true throughout -- this is a system integrity
// check, not something scoped to whoever happened to trigger the page
// load, and its writes are never returned to the client directly (the
// caller only reads back its own already-access-scoped action-items query
// afterwards).
export async function checkStaleRequestAlerts(payload: Payload): Promise<void> {
  if (!isWithinPhBusinessHours()) return

  // Guard against duplicates when two people have the dashboard open at
  // once: without this, two page loads landing within the same instant
  // could both see "no alert yet" for the same request and both create
  // one. A Postgres advisory lock makes this run one-at-a-time across the
  // whole app -- whichever invocation loses just skips its turn entirely;
  // the next page load or 5-minute auto-refresh will pick up anything it
  // missed, so skipping is safe.
  const pool = (payload.db as any)?.pool
  if (!pool) {
    // Fallback for a db adapter that doesn't expose a raw pg pool -- still
    // correct most of the time, just not race-proof under true concurrency.
    await runCheck(payload)
    return
  }

  const client = await pool.connect()
  let gotLock = false
  try {
    const res = await client.query('SELECT pg_try_advisory_lock($1) AS locked', [ADVISORY_LOCK_KEY])
    gotLock = Boolean(res.rows?.[0]?.locked)
    if (!gotLock) return

    await runCheck(payload)
  } finally {
    if (gotLock) {
      await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]).catch(() => {})
    }
    client.release()
  }
}

async function runCheck(payload: Payload): Promise<void> {
  // Assigned + still Pending 5+ minutes after the last touch -- nobody's
  // even started on it yet.
  await flagStale(payload, {
    status: 'pending',
    thresholdMs: 5 * 60 * 1000,
    messageFor: (doc) => `${doc.customerName || 'A customer'}'s request has been pending for over 5 minutes without action.`,
  })

  // Assigned + Processing, but untouched for 24+ hours -- `updatedAt` moves
  // on any status change *and* on every update note posted (see
  // QuotationRequests.ts's statusUpdates hook and its own updatedAt bump),
  // so this one check covers both "no note posted" and "no additional
  // update" without needing to separately inspect statusUpdates.
  await flagStale(payload, {
    status: 'processing',
    thresholdMs: 24 * 60 * 60 * 1000,
    messageFor: (doc) => `${doc.customerName || 'A customer'}'s request has been processing for over 24 hours with no update.`,
  })
}

async function flagStale(
  payload: Payload,
  opts: { status: string; thresholdMs: number; messageFor: (doc: any) => string },
): Promise<void> {
  const cutoff = new Date(Date.now() - opts.thresholdMs).toISOString()

  const staleRequests = await payload.find({
    collection: 'quotation-requests',
    where: {
      and: [
        { status: { equals: opts.status } },
        { assignedTo: { not_equals: null } },
        { updatedAt: { less_than: cutoff } },
      ],
    },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })

  if (staleRequests.docs.length === 0) return

  for (const reqDoc of staleRequests.docs as any[]) {
    const requestId = String(reqDoc.id)
    const staffId =
      typeof reqDoc.assignedTo === 'object' ? reqDoc.assignedTo?.id : reqDoc.assignedTo
    if (!staffId) continue

    try {
      // Belt-and-suspenders on top of the advisory lock: also don't
      // re-flag one that's already got an open auto-alert (e.g. from an
      // earlier run today that hasn't resolved yet).
      const existing = await payload.find({
        collection: 'action-items' as any,
        where: {
          and: [
            { sourceRequestId: { equals: requestId } },
            { status: { not_equals: 'closed' } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.docs.length > 0) continue

      await payload.create({
        collection: 'action-items' as any,
        data: {
          message: opts.messageFor(reqDoc),
          link: `/admin-dashboard?id=${requestId}`,
          recipient: isNaN(Number(staffId)) ? staffId : Number(staffId),
          status: 'pending',
          sourceRequestId: requestId,
          createdByName: 'Automated Alert',
        },
        overrideAccess: true,
      })
    } catch (err) {
      console.error(`Failed to create stale-request alert for ${String(reqDoc.id)}:`, err)
    }
  }
}
