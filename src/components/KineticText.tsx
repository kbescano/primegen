'use client'

import { useEffect, useRef, useState, type CSSProperties, type ElementType } from 'react'

type Segment = { text: string; className?: string }

// Splits text into characters that slam in one after another. The characters
// are drawn from a data attribute (CSS ::before), so the real text exists
// exactly once in the page -- in the sr-only span -- and screen readers and
// search engines read it as plain text, not doubled or letter by letter.
// `trigger="mount"` plays immediately; `trigger="view"` waits until scrolled
// into view. With reduced motion the CSS animation is disabled, so the text
// simply sits in its normal visible state.
export default function KineticText({
  text,
  segments,
  as: Tag = 'span',
  className = '',
  delay = 0,
  stagger = 28,
  trigger = 'view',
}: {
  text?: string
  segments?: Segment[]
  as?: ElementType
  className?: string
  delay?: number
  stagger?: number
  trigger?: 'mount' | 'view'
}) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(trigger === 'mount')

  useEffect(() => {
    if (trigger !== 'view') return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [trigger])

  const segs: Segment[] = segments ?? [{ text: text ?? '' }]
  const full = segs.map((s) => s.text).join('')
  let charIndex = 0

  return (
    <Tag
      ref={ref}
      data-trigger={trigger}
      data-inview={inView ? 'true' : 'false'}
      className={`fx-kinetic ${className}`}
      style={{ '--d': `${delay}ms`, '--stagger': `${stagger}ms` } as CSSProperties}
    >
      <span className="sr-only">{full}</span>
      <span aria-hidden="true">
        {segs.map((seg, si) => (
          <span key={si} className={seg.className}>
            {seg.text.split(/(\s+)/).map((token, ti) =>
              /^\s+$/.test(token) ? (
                ' '
              ) : (
                <span key={ti} className="inline-block whitespace-nowrap">
                  {Array.from(token).map((ch, ci) => (
                    <span key={ci} className="fx-char" data-ch={ch} style={{ '--i': charIndex++ } as CSSProperties} />
                  ))}
                </span>
              ),
            )}
          </span>
        ))}
      </span>
    </Tag>
  )
}
