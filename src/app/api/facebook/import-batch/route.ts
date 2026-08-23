// app/api/facebook/import-batch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { fetchAndPreparePost, ImportResult } from '@/lib/facebookImport'

// Only staff who can manage the public Deliveries feed should be able to
// trigger this -- it spends the shared Facebook API token, downloads and
// stores arbitrary images from whatever post IDs it's given, and creates
// documents that appear on the live site (Deliveries.read is public). It
// used to have no auth check at all.
const MAX_POST_IDS = 50

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user || (user.role !== 'admin' && user.role !== 'marketing')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postIds } = await req.json()
    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'postIds must be a non-empty array' }, { status: 400 })
    }
    if (postIds.length > MAX_POST_IDS) {
      return NextResponse.json({ error: `Cannot import more than ${MAX_POST_IDS} posts at once` }, { status: 400 })
    }

    const results: ImportResult[] = []

    for (const postId of postIds) {
      const id = String(postId).trim()
      if (!id) continue

      try {
        const result = await fetchAndPreparePost(id, false)

        if (result.isDuplicate) {
          results.push({
            postId: id,
            status: 'duplicate',
            existingId: result.existingId,
            existingTitle: result.existingTitle,
          })
          continue
        }

        const doc = await payload.create({
          collection: 'deliveries',
          data: {
            title: result.title,
            location: result.location,
            deliveryDate: result.deliveryDate,
            permalinkUrl: result.permalinkUrl,
            photos: result.photos,
            visible: true,
          },
          overrideAccess: true,
        })

        results.push({
          postId: id,
          status: 'success',
          deliveryId: doc.id,
          title: result.title,
          location: result.location,
        })
      } catch (err: any) {
        results.push({ postId: id, status: 'error', message: err.message || 'Import failed' })
      }
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    console.error('FB batch import failed', err)
    return NextResponse.json({ error: err.message || 'Batch import failed' }, { status: 500 })
  }
}