'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type NotificationItem = { id: string; message: string; link?: string; createdAt: string; read?: boolean }

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

export default function NotificationBell({ role }: { role: 'admin' | 'user' }) {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      if (role === 'admin') {
        const since = getLastSeen()
        const res = await fetch(`/api/admin-notifications?since=${encodeURIComponent(since)}`, {
          credentials: 'include',
        })
        if (!res.ok) return
        const data = await res.json()
        setCount(data.count || 0)
        setItems(data.items || [])
      } else {
        // Calls the new, secure Staff endpoint
        const res = await fetch(`/api/user-notifications`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        setCount(data.count || 0)
        setItems(data.items || [])
      }
    } catch (e){
      console.error('Failed to fetch notifications:', e)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [role])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function markAsRead(id: string) {
    if (role === 'admin') return // Admin synthetic feed updates based on localStorage when bell opens
    try {
      await fetch('/api/user-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      })
      // Optimistically update UI
      setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i))
      setCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  async function handleToggle() {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      if (role === 'admin') {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString())
        setCount(0) // Instantly clear the red badge
        setItems(prev => prev.map(i => ({ ...i, read: true }))) // Visually mark all as read in UI
      }
      // Note: User (Staff) does NOT auto-clear. They must explicitly click "View" to dismiss it.
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
              {role === 'admin' ? 'No recent activity.' : 'No new assignments.'}
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.link || '/admin-dashboard'}
                  onClick={() => {
                    setOpen(false)
                    if (!item.read) markAsRead(item.id)
                  }}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-[#01172f]/5 hover:bg-[#f4f6f2] transition-colors ${!item.read ? 'bg-blue-50/20' : 'opacity-70'}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${!item.read ? 'bg-[#149911]' : 'bg-gray-300'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] text-[#01172f] truncate ${!item.read ? 'font-bold' : 'font-medium'}`}>{item.message}</p>
                    <p className="text-[11px] text-[#01172f]/40 font-medium">{timeAgo(item.createdAt)}</p>
                  </div>
                  {!item.read && (
                    <span className="text-[10px] font-bold text-[#149911] ml-2">View</span>
                  )}
                </Link>
              ))}
            </div>
          )}

          <Link
            href={role === 'admin' ? '/admin-dashboard?status=pending' : '/admin-dashboard'}
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-[#3D5F3B] hover:text-[#149911] transition-colors border-t border-[#01172f]/10"
          >
            {role === 'admin' ? 'View All Activity' : 'View My RFQs'}
          </Link>
        </div>
      )}
    </div>
  )
}