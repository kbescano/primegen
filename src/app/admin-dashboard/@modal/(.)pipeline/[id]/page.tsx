import PipelineView from '@/components/pipeline/PipelineView'

export const dynamic = 'force-dynamic'

// The deal workflow opened from inside the portal: shown as a modal over the
// page the person came from. That page stays mounted underneath, so closing
// the modal (router.back()) returns instantly, with no reload and the same
// scroll position. A refresh or typed URL loads pipeline/[id]/page.tsx instead.
export default async function PipelineModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PipelineView id={id} variant="modal" />
}
