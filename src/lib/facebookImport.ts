// lib/facebookImport.ts
import { getPayloadClient } from '@/lib/getPayloadClient'

const FB_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN!
const GRAPH_VERSION = 'v19.0'

function normalizeUnicodeBold(text: string): string {
  return text.replace(/[\u{1D400}-\u{1D7FF}]/gu, (char) => {
    const code = char.codePointAt(0)!
    if (code >= 0x1d400 && code <= 0x1d419) return String.fromCharCode(code - 0x1d400 + 65)
    if (code >= 0x1d41a && code <= 0x1d433) return String.fromCharCode(code - 0x1d41a + 97)
    if (code >= 0x1d5d4 && code <= 0x1d5ed) return String.fromCharCode(code - 0x1d5d4 + 65)
    if (code >= 0x1d5ee && code <= 0x1d607) return String.fromCharCode(code - 0x1d5ee + 97)
    if (code >= 0x1d7ec && code <= 0x1d7f5) return String.fromCharCode(code - 0x1d7ec + 48)
    return char
  })
}

function parseTitleAndLocation(message: string): { title: string; location: string } {
  const firstLine = normalizeUnicodeBold(message.split('\n')[0] || '').trim()
  const [titlePart, locationPart] = firstLine.split('|').map((s) => s.trim())
  return {
    title: titlePart || 'Delivery',
    location: locationPart || '',
  }
}

export type ImportResult =
  | { postId: string; status: 'success'; deliveryId: string | number; title: string; location: string }
  | { postId: string; status: 'duplicate'; existingId: string | number; existingTitle: string }
  | { postId: string; status: 'error'; message: string }

// Fetches a post, uploads its photos, and returns the parsed data.
// Does NOT create a delivery doc itself -- callers decide what to do with the result
// (single-import fills a form, batch-import creates docs directly).
export async function fetchAndPreparePost(postId: string, force: boolean) {
  const fields = [
    'message',
    'permalink_url',
    'created_time',
    'attachments{media,type,subattachments{media,type}}',
  ].join(',')

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${postId}?fields=${fields}&access_token=${FB_TOKEN}`
  )
  const post = await res.json()

  if (post.error) {
    throw new Error(post.error.message)
  }

  const payload = await getPayloadClient()

  if (post.permalink_url && !force) {
    const existing = await payload.find({
      collection: 'deliveries',
      where: { permalinkUrl: { equals: post.permalink_url } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      const doc = existing.docs[0] as any
      return { isDuplicate: true as const, existingId: doc.id, existingTitle: doc.title }
    }
  }

  const photoUrls: string[] = []
  const atts = post.attachments?.data || []
  for (const att of atts) {
    if (att.subattachments?.data?.length) {
      for (const sub of att.subattachments.data) {
        if (sub.media?.image?.src) photoUrls.push(sub.media.image.src)
      }
    } else if (att.media?.image?.src) {
      photoUrls.push(att.media.image.src)
    }
  }

  if (photoUrls.length === 0) {
    throw new Error('No photos attached to this post')
  }

  // lib/facebookImport.ts — only the relevant part changes
const mediaIds: number[] = []   // ✨ was (string | number)[]

for (const [i, url] of photoUrls.entries()) {
  const imgRes = await fetch(url)
  const buffer = Buffer.from(await imgRes.arrayBuffer())
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
  const ext = contentType.includes('png') ? 'png' : 'jpg'

  const doc = await payload.create({
    collection: 'media',
    data: { alt: `${post.message?.split('\n')[0]?.slice(0, 80) || 'Delivery photo'} ${i + 1}` },
    file: {
      data: buffer,
      mimetype: contentType,
      name: `fb-${postId}-${i + 1}.${ext}`,
      size: buffer.length,
    },
    overrideAccess: true,
  })

  mediaIds.push(Number(doc.id))   // ✨ was mediaIds.push(doc.id)
}

  const { title, location } = parseTitleAndLocation(post.message || '')

  return {
    isDuplicate: false as const,
    title,
    location,
    permalinkUrl: post.permalink_url || '',
    deliveryDate: post.created_time || new Date().toISOString(),
    photos: mediaIds,
  }
}