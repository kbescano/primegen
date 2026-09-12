import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'

export const dynamic = 'force-dynamic'

// Collections deliberately left out of this export:
// - users: holds password hashes -- a business-data backup has no reason
//   to carry that around on someone's laptop as a downloaded file.
// - orders' clientPaymentReceipts/supplierPaymentReceipts: base64 receipt
//   images, potentially large enough to blow past what a single HTTP
//   response can safely return. The full, image-included backup is what
//   scripts/backup-db.sh (a real pg_dump, no size limit) and the GitHub
//   Actions workflow are for -- this button is a fast, no-terminal-needed
//   snapshot of the actual business records, not a replacement for those.
const EXCLUDED_COLLECTIONS = new Set(['users'])

export async function GET() {
  const payload = await getPayloadClient()
  const reqHeaders = await getHeaders()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (!user || (user.role !== 'admin' && user.role !== 'marketing')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const backup: Record<string, any> = {
    generatedAt: new Date().toISOString(),
    generatedBy: user.email,
  }

  for (const slug of Object.keys(payload.collections)) {
    if (EXCLUDED_COLLECTIONS.has(slug)) continue
    try {
      const select = slug === 'orders'
        ? { clientPaymentReceipts: false, supplierPaymentReceipts: false }
        : undefined
      const { docs } = await payload.find({
        collection: slug as any,
        limit: 5000,
        depth: 0,
        overrideAccess: true,
        ...(select ? { select } : {}),
      })
      backup[slug] = docs
    } catch (err) {
      console.error(`Backup: failed to export collection "${slug}":`, err)
      backup[slug] = { error: 'Failed to export this collection' }
    }
  }

  const json = JSON.stringify(backup, null, 2)
  const stamp = new Date().toISOString().slice(0, 10)

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="primegen-backup-${stamp}.json"`,
    },
  })
}
