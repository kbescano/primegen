import { getPayloadClient } from '@/lib/getPayloadClient'
import CustomerStories from './CustomerStories'

export default async function CustomerStoriesServer() {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'customer-stories',
    where: { visible: { equals: true } },
    sort: 'order',
    limit: 20,
    depth: 1, // needed to resolve the `image` upload relationship into a usable URL
  })

  const stories = docs.map((d: any) => ({
    id: String(d.id),
    logo: d.logo,
    category: d.category,
    title: d.title,
    description: d.description,
    image: typeof d.image === 'object' ? d.image?.url || '' : '',
  }))

  if (stories.length === 0) return null

  return <CustomerStories stories={stories} />
}