'use client'

import { useState } from 'react'

const ACTION_LABELS: Record<string, string> = {
  'increase-budget': 'Increase Budget',
  'decrease-budget': 'Decrease Budget',
  'pause-adset': 'Pause Ad Set',
  'resume-adset': 'Resume Ad Set',
  'new-campaign': 'New Campaign',
  'new-creative': 'New Ad Creative',
  'targeting-change': 'Targeting Change',
  'pause-all': 'Pause All (Emergency)',
}

export default function ApprovalCard({ action }: { action: any }) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'error'>('pending')
  const [loading, setLoading] = useState(false)

  async function respond(decision: 'approved' | 'rejected') {
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/actions/${action.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      if (!res.ok) throw new Error()
      setStatus(decision)
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'approved' || status === 'rejected') {
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, opacity: 0.6 }}>
        <strong>{action.summary}</strong> — {status === 'approved' ? 'Approved and executing' : 'Rejected'}
      </div>
    )
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: action.riskLevel === 'high' ? '#c53030' : '#718096',
              background: action.riskLevel === 'high' ? '#fed7d7' : '#edf2f7',
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            {action.riskLevel} risk
          </span>
          <h3 style={{ fontSize: 17, marginTop: 8 }}>{ACTION_LABELS[action.actionType] || action.actionType}</h3>
        </div>
      </div>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{action.summary}</p>
      <p style={{ fontSize: 14, color: '#4a5568', marginBottom: 16 }}>{action.reasoning}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => respond('approved')} disabled={loading} className="btn btn-primary">
          Approve
        </button>
        <button
          onClick={() => respond('rejected')}
          disabled={loading}
          style={{ padding: '12px 24px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
        >
          Reject
        </button>
      </div>
      {status === 'error' && <p style={{ color: '#c53030', marginTop: 8 }}>Failed — try again.</p>}
    </div>
  )
}
