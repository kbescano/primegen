// components/admin/ImportFromFacebook.tsx
'use client'

import { useState } from 'react'
import { useForm } from '@payloadcms/ui'

export default function ImportFromFacebook() {
  const [postId, setPostId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [duplicate, setDuplicate] = useState<{ id: string; title: string } | null>(null)

  const { dispatchFields } = useForm()

  async function runImport(force: boolean) {
    setLoading(true)
    setError('')
    setSuccess(false)
    setDuplicate(null)
    try {
      const res = await fetch('/api/facebook/import-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, force }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')

      if (data.isDuplicate) {
        setDuplicate({ id: data.existingId, title: data.existingTitle })
        return
      }

      dispatchFields({ type: 'UPDATE', path: 'title', value: data.suggestedTitle })
      dispatchFields({ type: 'UPDATE', path: 'location', value: data.suggestedLocation })
      dispatchFields({ type: 'UPDATE', path: 'permalinkUrl', value: data.permalinkUrl })
      dispatchFields({ type: 'UPDATE', path: 'deliveryDate', value: data.deliveryDate })
      dispatchFields({ type: 'UPDATE', path: 'photos', value: data.photos })

      setSuccess(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: 20, padding: 14, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa' }}>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
        Import from Facebook Post ID
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
          placeholder="e.g. 123456789_987654321"
          style={{ flex: 1, padding: '6px 8px' }}
        />
        <button type="button" onClick={() => runImport(false)} disabled={loading || !postId}>
          {loading ? 'Importing…' : 'Fetch from Facebook'}
        </button>
      </div>

      {error && <p style={{ color: '#c0392b', fontSize: 12, marginTop: 8 }}>{error}</p>}

      {duplicate && (
        <div style={{ marginTop: 10, padding: 10, background: '#fff8e1', border: '1px solid #f0d878', borderRadius: 6 }}>
          <p style={{ fontSize: 12, color: '#8a6d00', margin: 0 }}>
            This post was already imported as <strong>"{duplicate.title}"</strong>. Import a second copy anyway?
          </p>
          <button
            type="button"
            onClick={() => runImport(true)}
            disabled={loading}
            style={{ marginTop: 8, fontSize: 12 }}
          >
            {loading ? 'Importing…' : 'Yes, import as a new delivery'}
          </button>
        </div>
      )}

      {success && (
        <p style={{ color: '#1a7f37', fontSize: 12, marginTop: 8 }}>
          Title, location, date, link, and photos filled in below — double-check them, then save.
        </p>
      )}
    </div>
  )
}