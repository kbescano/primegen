'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// The overlay around the deal workflow.
//
// As a plain page (variant="page") it behaves exactly as before. As a modal
// (variant="modal") the list underneath stays mounted, so this frame also
// stops that list scrolling behind it, and closes (router.back(), no reload)
// when the dark margin around the panel is clicked.

export function PipelineCloseButton({ label }: { label?: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Close"
      title="Close"
      className={
        label
          ? 'px-5 py-2 rounded-full bg-[#1d1d1f] text-white text-[13px] font-medium hover:bg-gray-800 transition-colors'
          : 'w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors shrink-0'
      }
    >
      {label ?? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      )}
    </button>
  )
}

export default function PipelineFrame({
  variant,
  notFound,
  children,
}: {
  variant: 'page' | 'modal'
  notFound?: boolean
  children: React.ReactNode
}) {
  const router = useRouter()
  const pressStartedOnBackdrop = useRef(false)

  // Stop the list behind the modal from scrolling (and jumping) while it's open.
  useEffect(() => {
    if (variant !== 'modal') return
    const html = document.documentElement
    const previous = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter }
    // Keep the scrollbar's space reserved, so the list behind doesn't shift
    // sideways when the scrollbar disappears and reappears.
    html.style.scrollbarGutter = 'stable'
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previous.overflow
      html.style.scrollbarGutter = previous.gutter
    }
  }, [variant])

  const closeOnBackdrop = variant === 'modal'

  return (
    <div
      role={variant === 'modal' ? 'dialog' : undefined}
      aria-modal={variant === 'modal' ? true : undefined}
      aria-label={variant === 'modal' ? 'Inquiry workflow' : undefined}
      // z-[300]: above the Deals list's own card popup (z-[200]), so "Open deal"
      // pressed inside that popup opens the workflow on top of it, not behind.
      className="fixed inset-0 z-[300] bg-[#1d1d1f]/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 antialiased"
      // Only a press that both starts and ends on the dark margin closes it,
      // so dragging a text selection out of the panel doesn't.
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = closeOnBackdrop && e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (closeOnBackdrop && pressStartedOnBackdrop.current && e.target === e.currentTarget) {
          router.back()
        }
        pressStartedOnBackdrop.current = false
      }}
    >
      {notFound ? (
        children
      ) : (
        <div className="bg-[#fbfbfd] w-full max-w-[1100px] h-full max-h-[98vh] rounded-[1.5rem] md:rounded-[2rem] shadow-[0_24px_48px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden ring-1 ring-white/50">
          {children}
        </div>
      )}
    </div>
  )
}
