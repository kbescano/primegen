// app/admin-dashboard/facebook-import/page.tsx
'use client'

import { useState } from 'react'

export default function FacebookBatchImportPage() {
  const [idsText, setIdsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState('')

  async function runBatch() {
    const postIds = idsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (postIds.length === 0) return

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const res = await fetch('/api/facebook/import-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Batch import failed')
      setResults(data.results)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Batch Import from Facebook</h1>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
        Paste one Facebook post ID per line, then run the import. Duplicates are skipped automatically.
      </p>

      <textarea
        value={idsText}
        onChange={(e) => setIdsText(e.target.value)}
        placeholder={'2140894569512271_1562886542200027\n2140894569512271_1562030625618952\n...'}
        rows={12}
        style={{ width: '100%', padding: 10, fontFamily: 'monospace', fontSize: 13, border: '1px solid #ccc', borderRadius: 6 }}
      />

      <button
        onClick={runBatch}
        disabled={loading || !idsText.trim()}
        style={{
          marginTop: 12,
          padding: '10px 20px',
          background: '#149911',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {loading ? 'Importing…' : 'Run Batch Import'}
      </button>

      {error && <p style={{ color: '#c0392b', marginTop: 12 }}>{error}</p>}

      {results && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
            Results ({results.filter((r) => r.status === 'success').length} imported,{' '}
            {results.filter((r) => r.status === 'duplicate').length} duplicates,{' '}
            {results.filter((r) => r.status === 'error').length} errors)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  background:
                    r.status === 'success' ? '#eafaf0' : r.status === 'duplicate' ? '#fff8e1' : '#fdeaea',
                  color: r.status === 'success' ? '#1a7f37' : r.status === 'duplicate' ? '#8a6d00' : '#c0392b',
                }}
              >
                <strong>{r.postId}</strong> —{' '}
                {r.status === 'success' && `Imported as "${r.title}" (${r.location || 'no location'})`}
                {r.status === 'duplicate' && `Already exists as "${r.existingTitle}"`}
                {r.status === 'error' && `Error: ${r.message}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}