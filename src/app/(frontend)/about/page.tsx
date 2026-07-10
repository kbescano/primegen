import { getPayloadClient } from '@/lib/getPayloadClient'

export const revalidate = 60

export default async function AboutPage() {
  const payload = await getPayloadClient()
  const info: any = await payload.findGlobal({ slug: 'about-page' })

  const title = info?.title || 'About Primegen Trading Corporation'
  const description = info?.description || 'Add a company description in the admin panel under Globals -> About Page.'
  const address = info?.address || 'Add your address in the admin panel.'
  const phone = info?.phone
  const email = info?.email
  const mapEmbedUrl = info?.mapEmbedUrl

  return (
    <section className="py-28 px-6 lg:px-20 max-w-[1360px] mx-auto">
      <p className="text-xs font-bold uppercase tracking-wider text-green mb-2">Who We Are</p>
      <h1 className="mb-5 text-green">{title}</h1>
      <p className="max-w-[680px] mb-12 whitespace-pre-line text-green">{description}</p>

      <div className="grid gap-8 [grid-template-columns:minmax(260px,380px)_minmax(280px,1fr)] max-[720px]:grid-cols-1">
        <div className="bg-white border border-black/10 rounded p-7">
          <h2 className="text-xl mb-5">Visit / Contact Us</h2>
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-green mb-1">Address</p>
            <p className="m-0 whitespace-pre-line">{address}</p>
          </div>
          {phone && (
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-green mb-1">Phone</p>
              <p className="m-0"><a href={`tel:${phone}`} className="text-green no-underline">{phone}</a></p>
            </div>
          )}
          {email && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green mb-1">Email</p>
              <p className="m-0"><a href={`mailto:${email}`} className="text-green no-underline">{email}</a></p>
            </div>
          )}
        </div>

        <div className="bg-white border border-black/10 rounded overflow-hidden min-h-[340px] flex items-center justify-center">
          {mapEmbedUrl ? (
            <iframe src={mapEmbedUrl} width="100%" height="100%" className="border-0 min-h-[340px]" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <p className="p-6 text-center">Add a Google Maps embed URL in the admin panel under Globals -&gt; About Page to show the map here.</p>
          )}
        </div>
      </div>
    </section>
  )
}
