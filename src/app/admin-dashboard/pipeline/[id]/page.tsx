import PipelineView from '@/components/pipeline/PipelineView'

// Unlike admin-dashboard/page.tsx or client-quotation/page.tsx, the view this
// page renders never relies on a cached render -- with only `params` (no
// dynamic API usage of its own) Next.js can treat a page as eligible for the
// Full Route Cache and serve back the pre-edit render, so quotation items
// updated or deleted elsewhere (they live-edit, then land back here) don't
// show up. Same fix as deliveries/inquiry-tracker/reports/sales-report.
export const dynamic = 'force-dynamic'

// The full-page version of the deal workflow. Inside the portal the same URL is
// normally shown as a modal instead (see @modal/(.)pipeline/[id]); this is what
// loads on a refresh, a typed or bookmarked URL, or a step that reloads the page.
export default async function PipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PipelineView id={id} variant="page" />
}
