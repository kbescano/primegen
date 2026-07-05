'use client'

import { useState } from 'react'

export default function PauseAllButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handlePause() {
    if (!confirm('Pause ALL active ad campaigns immediately? This stops all ad spend right now.')) {
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/agent/pause-all', { method: 'POST' })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      alert('Failed to pause campaigns. Check the Meta account directly as a backup.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePause}
      disabled={loading}
      style={{
        width: '100%',
        background: '#b3382b',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        padding: '14px 12px',
        fontFamily: 'var(--font-display, sans-serif)',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      {loading ? 'Pausing...' : done ? 'All Ads Paused' : 'PAUSE ALL ADS'}
    </button>
  )
}