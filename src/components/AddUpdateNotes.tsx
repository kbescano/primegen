'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UpdateNote = { note: string; postedByName?: string; createdAt?: string }

export default function AddUpdateNote({
  requestId,
  existingNotes,
}: {
  requestId: string | number
  existingNotes: UpdateNote[]
  currentUserName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const sorted = [...existingNotes].reverse() // most recent first

  async function handleSubmit() {
    if (!text.trim()) return
    setSaving(true)
    try {
      const newEntry = {
        note: text.trim(),
      }
      const res = await fetch(`/api/quotation-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          statusUpdates: [...existingNotes, newEntry],
        }),
      })
      if (res.ok) {
        setText('')
        setOpen(false)
        router.refresh()
      } else {
        console.error('Failed to post update note:', res.status, await res.text().catch(() => ''))
      }
    } catch (e) {
      console.error('Failed to post update note', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
          Update Notes {sorted.length > 0 && `(${sorted.length})`}
        </p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-[10px] font-bold uppercase tracking-wider text-[#149911] hover:text-[#103900] transition-colors"
        >
          {open ? 'Cancel' : '+ Add Update'}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 mb-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Called customer, confirmed delivery for Friday..."
            rows={2}
            className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#149911] resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={saving || !text.trim()}
            className="self-end px-4 py-1.5 bg-[#149911] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#103900] transition-colors disabled:opacity-50"
          >
            {saving ? 'Posting...' : 'Post Update'}
          </button>
        </div>
      )}

      {sorted.length > 0 ? (
  <ul className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto list-none m-0 p-0">
    {sorted.map((n, i) => (
      <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700 leading-snug">
        <span className="text-[#149911] mt-[3px] flex-shrink-0">&bull;</span>
        <span>
          {n.note}
        </span>
      </li>
    ))}
  </ul>
) : (
  !open && <p className="text-[11px] text-gray-400 italic">No updates posted yet.</p>
)}
    </div>
  )
}