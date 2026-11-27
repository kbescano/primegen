import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayloadClient'
import { resolveDealRequestId, type DealRef } from '@/lib/dealLookup'

// "Open deal" fallback. The links on order / quotation / PO rows normally
// resolve the inquiry in the page and navigate straight to the workflow (see
// OpenDealLink). This page covers the cases where they can't -- opening the
// link in a new tab, or a bookmarked/typed URL -- by doing the same lookup on
// the server and redirecting.
export const dynamic = 'force-dynamic'

export default async function OpenDealPage({ searchParams }: { searchParams: Promise<DealRef> }) {
  const sp = await searchParams
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })

  const requestId = await resolveDealRequestId(payload, user, sp)
  if (requestId) redirect(`/admin-dashboard/pipeline/${encodeURIComponent(requestId)}`)

  return (
    <div className="max-w-[520px] mx-auto py-16 text-center">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">No workflow for this record</h1>
      <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
        This record was created on its own, without a customer inquiry, so there is no step-by-step
        workflow to open. You can still view and edit it from its own page.
      </p>
      <Link
        href="/admin-dashboard"
        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#1d1d1f] text-white text-[13px] font-medium hover:bg-gray-800 transition-colors"
      >
        &larr; Back to inquiries
      </Link>
    </div>
  )
}
