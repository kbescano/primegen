'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type NotificationItem = { id: string; message: string; link?: string; createdAt: string; read?: boolean }

const STORAGE_KEY = 'admin_notifications_last_seen'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function getLastSeen(): string {
  if (typeof window === 'undefined') return new Date(Date.now() - SEVEN_DAYS_MS).toISOString()
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored || new Date(Date.now() - SEVEN_DAYS_MS).toISOString()
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export default function NotificationBell({ role }: { role: 'admin' | 'user' }) {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  
  // Lazy Loading States
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  
  const panelRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications(pageNum: number) {
    if (pageNum > 1) setLoadingMore(true)
    try {
      // ✨ FIX: Use Payload's standard REST API instead of 404 custom routes
      let url = `/api/notifications?sort=-createdAt&limit=15&page=${pageNum}`;
      
      if (role === 'admin') {
        const weekAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
        url += `&where[createdAt][greater_than]=${weekAgo}`;
      }

      const res = await fetch(url, { credentials: 'include' });
      if (!res?.ok) return;

      const data = await res.json();
      // ✨ FIX: Payload returns data inside 'docs', not 'items'
      let fetchedItems: NotificationItem[] = data.docs || []; 

      // Visually mark as read if they fetch while panel is open
      if (role === 'admin' && open) {
        fetchedItems = fetchedItems.map(i => ({ ...i, read: true }))
      }
      
      if (pageNum === 1) {
        setItems(fetchedItems)
        
        if (role === 'admin') {
          const lastSeen = getLastSeen()
          const unreadCount = fetchedItems.filter(i => new Date(i.createdAt).getTime() > new Date(lastSeen).getTime()).length
          setCount(unreadCount)
        } else {
          // Count unread directly from the documents fetched for the user
          setCount(fetchedItems.filter(i => !i.read).length)
        }
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const newUnique = fetchedItems.filter(i => !existingIds.has(i.id))
          return [...prev, ...newUnique]
        })
      }

      if (fetchedItems.length === 0) {
        setHasMore(false)
      }
    } catch (e){
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoadingMore(false)
    }
  }

  // Fetch once on mount to get initial badge count
  useEffect(() => {
    setPage(1)
    setHasMore(true)
    fetchNotifications(1)
  }, [role])

  useEffect(() => {
    if (page > 1) {
      fetchNotifications(page)
    }
  }, [page])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 10 && !loadingMore && hasMore) {
      setPage(p => p + 1)
    }
  }

  async function markAsRead(id: string) {
    if (role === 'admin') return 
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ read: true })
      })
      setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i))
      setCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  async function handleToggle() {
    const willOpen = !open
    setOpen(willOpen)
    
    if (willOpen) {
      setPage(1)
      setHasMore(true)
      await fetchNotifications(1)

      if (role === 'admin') {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString())
        setCount(0) 
        setItems(prev => prev.map(i => ({ ...i, read: true }))) 
      }
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

          {items.length === 0 && !loadingMore ? (
            <p className="px-4 py-8 text-center text-[13px] text-[#01172f]/40 font-medium">
              {role === 'admin' ? 'No recent activity.' : 'No new assignments.'}
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto custom-scrollbar" onScroll={handleScroll}>
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
              
              {loadingMore && (
                <div className="py-4 text-center text-[10px] text-[#01172f]/40 font-bold uppercase tracking-widest">
                  Loading older...
                </div>
              )}
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