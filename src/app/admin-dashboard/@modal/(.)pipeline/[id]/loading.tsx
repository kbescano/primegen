import PipelineFrame, { PipelineCloseButton } from '@/components/pipeline/PipelineFrame'

// Shown over the list while the workflow loads -- instead of the full-screen
// logo loader -- so the page underneath never disappears.
export default function PipelineModalLoading() {
  return (
    <PipelineFrame variant="modal">
      <div className="px-4 py-3 md:px-6 md:py-3.5 bg-white border-b border-gray-200/60 flex items-center gap-3 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="h-4 w-44 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-28 rounded bg-gray-100 animate-pulse mt-2" />
        </div>
        <PipelineCloseButton />
      </div>
      <div className="flex-1 p-5 space-y-4" aria-busy="true" aria-label="Loading inquiry">
        <div className="h-5 w-full max-w-[640px] mx-auto rounded bg-gray-100 animate-pulse" />
        <div className="h-40 w-full max-w-[860px] mx-auto rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-28 w-full max-w-[860px] mx-auto rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    </PipelineFrame>
  )
}
