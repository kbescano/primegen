import { getPayload } from 'payload'
import config from '@/payload.config'

// Cached Payload instance for use in Server Components / API routes.
export async function getPayloadClient() {
  const payload = await getPayload({ config })
  return payload
}
