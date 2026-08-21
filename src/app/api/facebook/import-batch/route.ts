// app/api/facebook/import-batch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { fetchAndPreparePost, ImportResult } from '@/lib/facebookImport'

export async function POST(req: NextRequest) {
  try {
    const { postIds } = await req.json()
    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'postIds must be a non-empty array' }, { status: 400 })
    }

    const payload = await getPayloadClient()
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