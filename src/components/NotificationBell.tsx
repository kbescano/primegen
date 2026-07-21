'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type NotificationItem = { id: string; customerName: string; createdAt: string }

const STORAGE_KEY = 'admin_notifications_last_seen'
const TWO_HOURS_MS = 2 * 60 * 60 * 1000

function getLastSeen(): string {
  if (typeof window === 'undefined') return new Date(Date.now() - TWO_HOURS_MS).toISOString()
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored || new Date(Date.now() - TWO_HOURS_MS).toISOString()
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      const since = getLastSeen()
      const res = await fetch(`/api/admin-notifications?since=${encodeURIComponent(since)}`, {
        credentials: 'include',
      })
      if (!res.ok) return
      const data = await res.json()
      setCount(data.count || 0)
      setItems(data.items || [])
    } catch {
      // fail silently -- notifications are non-critical
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleToggle() {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      // Mark everything as seen right now -- badge clears immediately.
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
      setCount(0)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#01172f]/[0.05] transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#01172f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#e53935] text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[85vw] bg-white border border-[#01172f]/10 shadow-[0_20px_50px_-12px_rgba(1,23,47,0.25)] z-50">
          <div className="px-4 py-3 border-b border-[#01172f]/10">
            <p className="text-[12px] font-black uppercase tracking-wide text-[#01172f]">Notifications</p>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-[#01172f]/40 font-medium">
              No new quotation requests.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href="/admin-dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#01172f]/5 hover:bg-[#f4f6f2] transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#149911] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#01172f] truncate">
                      New request from {item.customerName || 'a customer'}
                    </p>
                    <p className="text-[11px] text-[#01172f]/40 font-medium">{timeAgo(item.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/admin-dashboard?status=pending"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-[#103900] hover:text-[#149911] transition-colors border-t border-[#01172f]/10"
          >
            View All Pending
          </Link>
        </div>
      )}
    </div>
  )
}
