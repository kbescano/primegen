'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Material = { id: string; name: string; unit: string }
type LineItem = { materialId: string; quantity: number }

export default function QuoteForm({ materials }: { materials: Material[] }) {
  const searchParams = useSearchParams()
  const preselected = searchParams.get('material')
  const preselectedMaterial = materials.find((m) => String(m.id) === String(preselected))

  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [items, setItems] = useState<LineItem[]>([
    { materialId: preselectedMaterial?.id ?? materials[0]?.id ?? '', quantity: 1 },
  ])

  function addItem() {
    setItems((prev) => [...prev, { materialId: materials[0]?.id ?? '', quantity: 1 }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    const form = e.currentTarget
    const data = {
      customerName: (form.elements.namedItem('customerName') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      projectType: (form.elements.namedItem('projectType') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      source: 'website',
      items: items
        .filter((i) => i.materialId)
        .map((i) => ({ material: i.materialId, quantity: i.quantity })),
    }

    try {
      const res = await fetch('/api/quotation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('done')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Request received.</h2>
        <p>
          Thanks -- your project details are with our team. We'll reach out directly by
          phone or email with your quotation shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {preselectedMaterial && (
        <p style={{ fontSize: 13, color: 'var(--color-forest)', margin: 0 }}>
          Pre-filled: {preselectedMaterial.name}
        </p>
      )}

      <Field label="Full name">
        <input name="customerName" required style={inputStyle} />
      </Field>
      <Field label="Phone number">
        <input name="phone" type="tel" required style={inputStyle} />
      </Field>
      <Field label="Email (optional)">
        <input name="email" type="email" style={inputStyle} />
      </Field>
      <Field label="Project type">
        <select name="projectType" style={inputStyle}>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="renovation">Renovation</option>
          <option value="other">Other</option>
        </select>
      </Field>

      <div>
        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Materials needed</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, index) => {
            const selected = materials.find((m) => m.id === item.materialId)
            return (
              <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={item.materialId}
                  onChange={(e) => updateItem(index, { materialId: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                  style={{ ...inputStyle, width: 80 }}
                />
                <span style={{ fontSize: 13, color: '#718096', width: 60 }}>
                  {selected?.unit ?? ''}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    aria-label="Remove item"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#c53030',
                      cursor: 'pointer',
                      fontSize: 18,
                      padding: 4,
                    }}
                  >
                    X
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={addItem}
          style={{
            marginTop: 10,
            background: 'none',
            border: '1px dashed var(--color-border)',
            borderRadius: 6,
            padding: '8px 14px',
            fontSize: 14,
            cursor: 'pointer',
            color: 'var(--color-forest)',
          }}
        >
          + Add another material
        </button>
      </div>

      <Field label="Project details">
        <textarea
          name="message"
          rows={4}
          placeholder="Project size, timeline, delivery location, etc."
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </Field>

      <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending...' : 'Send Request'}
      </button>
      {status === 'error' && <p style={{ color: '#c53030' }}>Something went wrong. Please try again.</p>}
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 500 }}>
      {label}
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '11px 13px',
  border: '1px solid var(--color-border)',
  borderRadius: 3,
  fontSize: 15,
  fontFamily: 'var(--font-body)',
  background: 'white',
}
