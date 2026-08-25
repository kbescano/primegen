'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Comment = {
  message: string
  authorName?: string
  authorRole?: 'admin' | 'user'
  createdAt?: string
}

type ActionItem = {
  id: string | number
  message: string
  link?: string | null
  status: 'pending' | 'solved' | 'closed'
  comments?: Comment[]
  recipient?: any
  createdByName?: string
  createdAt?: string
}

type StaffOption = { id: string; name: string; email: string }

function recipientLabel(recipient: any): string {
  if (!recipient) return 'Unassigned'
  if (typeof recipient === 'object') return recipient.name || recipient.email || 'Staff'
  return String(recipient)
}

// `link` stores one or more URLs separated by newlines (no schema change --
// still a single text column). Split/clean on the way out.
function splitLinks(link?: string | null): string[] {
  if (!link) return []
  return link
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  solved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Action Needed',
  solved: 'Solved',
}

export default function ActionItemsPanel({
  items,
  isAdmin,
  staffOptions,
}: {
  items: ActionItem[]
  isAdmin: boolean
  staffOptions: StaffOption[]
}) {
  const router = useRouter()
  const [composeOpen, setComposeOpen] = useState(false)
  const [selected, setSelected] = useState<ActionItem | null>(null)

  // Nothing pending/solved and nothing to create -> don't take up space.
  if (!isAdmin && items.length === 0) return null

  return (
    <div className="mb-6 bg-white border border-amber-100 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-amber-50/60 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-gray-900">Action Items</span>
          {items.length > 0 && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#01172f] px-3 py-1.5 rounded-full hover:bg-[#0a2947] transition-colors"
          >
            + New Action Item
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-[11px] text-gray-400 italic">
          No open action items.
        </p>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50/70 transition-colors"
            >
              <span
                className={`shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[item.status]}`}
              >
                {STATUS_LABELS[item.status]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-gray-800 truncate">{item.message}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {isAdmin ? `For ${recipientLabel(item.recipient)}` : `From ${item.createdByName || 'Admin'}`}
                  {(() => {
                    const n = splitLinks(item.link).length
                    return n > 0 ? ` · ${n} link${n === 1 ? '' : 's'}` : ''
                  })()}
                  {item.comments && item.comments.length > 0 ? ` · ${item.comments.length} comment${item.comments.length === 1 ? '' : 's'}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {composeOpen && (
        <ComposeModal
          staffOptions={staffOptions}
          onClose={() => setComposeOpen(false)}
          onSent={() => {
            setComposeOpen(false)
            router.refresh()
          }}
        />
      )}

      {selected && (
        <DetailModal
          item={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function ComposeModal({
  staffOptions,
  onClose,
  onSent,
}: {
  staffOptions: StaffOption[]
  onClose: () => void
  onSent: () => void
}) {
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!recipient || !message.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipient: isNaN(Number(recipient)) ? recipient : Number(recipient),
          message: message.trim(),
          link: link.split('\n').map((l) => l.trim()).filter(Boolean).join('\n') || undefined,
          status: 'pending',
        }),
      })
      if (res.ok) {
        onSent()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.errors?.[0]?.message || data?.error || 'Failed to send')
      }
    } catch (e) {
      console.error('Failed to create action item', e)
      setError('Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-5 flex flex-col gap-3.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-gray-900">New Action Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-[13px] leading-none" aria-label="Close">
            ✕
          </button>
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-1">For</label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#149911] bg-white"
          >
            <option value="">Select staff...</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name || s.email}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What do they need to do?"
            rows={3}
            className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#149911] resize-none"
          />
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wide text-gray-400 mb-1">
            Links (optional)
          </label>
          <textarea
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={'Paste one or more links, one per line'}
            rows={2}
            className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#149911] resize-none"
          />
        </div>

        {error && <p className="text-[10.5px] text-red-500">{error}</p>}

        <button
          onClick={submit}
          disabled={sending || !recipient || !message.trim()}
          className="self-end px-4 py-1.5 bg-[#149911] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#103900] transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

function DetailModal({
  item,
  isAdmin,
  onClose,
  onChanged,
}: {
  item: ActionItem
  isAdmin: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function send(type: 'comment' | 'solve' | 'unresolve' | 'close') {
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/action-items/${item.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, message: message.trim() || undefined }),
      })
      if (res.ok) {
        onChanged()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Action failed')
      }
    } catch (e) {
      console.error('Action item request failed', e)
      setError('Action failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-5 flex flex-col gap-3.5 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-gray-900">Action Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-[13px] leading-none" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="bg-[#01172f]/5 rounded-xl p-2.5 text-[12px] text-gray-800 leading-relaxed">
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {isAdmin ? `For ${recipientLabel(item.recipient)}` : `From ${item.createdByName || 'Admin'}`}
            </span>
            {item.createdAt && (
              <span className="text-[9px] text-gray-400 shrink-0">{new Date(item.createdAt).toLocaleString()}</span>
            )}
          </div>
          <span className="break-words">{item.message}</span>
          {splitLinks(item.link).map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 break-all"
            >
              {url} →
            </a>
          ))}
        </div>

        {item.comments && item.comments.length > 0 && (
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[32vh] pr-1">
            {item.comments.map((c, i) => (
              <div
                key={i}
                className={`rounded-xl p-2.5 text-[12px] leading-relaxed ${
                  c.authorRole === 'admin' ? 'bg-[#01172f]/5 text-gray-800' : 'bg-emerald-50 text-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {c.authorName || (c.authorRole === 'admin' ? 'Admin' : 'Staff')}
                  </span>
                  {c.createdAt && (
                    <span className="text-[9px] text-gray-400 shrink-0">{new Date(c.createdAt).toLocaleString()}</span>
                  )}
                </div>
                <span className="break-words">{c.message}</span>
              </div>
            ))}
          </div>
        )}

        {item.status === 'pending' && (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#149911] resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => send('comment')}
                disabled={sending || !message.trim()}
                className="px-4 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Comment
              </button>
              <button
                onClick={() => send('solve')}
                disabled={sending}
                className="px-4 py-1.5 bg-[#149911] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#103900] transition-colors disabled:opacity-50"
              >
                Mark as Solved
              </button>
            </div>
          </>
        )}

        {item.status === 'solved' && (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => send('unresolve')}
              disabled={sending}
              className="px-4 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              Mark as Unresolved
            </button>
            {isAdmin ? (
              <button
                onClick={() => send('close')}
                disabled={sending}
                className="px-4 py-1.5 bg-[#1d1d1f] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Close
              </button>
            ) : (
              <p className="text-[10.5px] text-gray-400 italic">Waiting for Admin to close.</p>
            )}
          </div>
        )}

        {error && <p className="text-[10.5px] text-red-500">{error}</p>}
      </div>
    </div>
  )
}
