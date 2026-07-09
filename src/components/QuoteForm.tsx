'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PillInput, PillSelect, PillTextarea, ButtonEl, Divider, QuoteItemRow } from '@/components/ui/styled'

type Material = { id: string; name: string; unit: string }
type LineItem = { materialId: string; quantity: number }

export default function QuoteForm({ materials }: { materials: Material[] }) {
  const searchParams = useSearchParams()
  const preselected = searchParams.get('material')
  const preselectedMaterial = materials.find((m) => String(m.id) === String(preselected))

  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [items, setItems] = useState<LineItem[]>([{ materialId: preselectedMaterial?.id ?? materials[0]?.id ?? '', quantity: 1 }])

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
      items: items.filter((i) => i.materialId).map((i) => ({ material: i.materialId, quantity: i.quantity })),
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
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Request received.</h2>
        <p>Thanks -- your project details are with our team. We'll reach out directly by phone or email with your quotation shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {preselectedMaterial && (
        <p style={{ fontSize: 13, color: 'var(--color-green)', margin: 0, textAlign: 'center' }}>
          Pre-filled: {preselectedMaterial.name}
        </p>
      )}

      <PillInput name="customerName" placeholder="Full name" required aria-label="Full name" />
      <PillInput name="phone" type="tel" placeholder="Phone number" required aria-label="Phone number" />
      <PillInput name="email" type="email" placeholder="Email (optional)" aria-label="Email" />

      <PillSelect name="projectType" aria-label="Project type">
        <option value="residential">Residential</option>
        <option value="commercial">Commercial</option>
        <option value="renovation">Renovation</option>
        <option value="other">Other</option>
      </PillSelect>

      <Divider />

      <div>
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>Materials needed</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, index) => {
            const selected = materials.find((m) => m.id === item.materialId)
            return (
              <QuoteItemRow key={index}>
                <PillSelect value={item.materialId} onChange={(e) => updateItem(index, { materialId: e.target.value })} style={{ flex: 1 }}>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </PillSelect>
                <PillInput
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                  style={{ width: 90 }}
                />
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', width: 60 }}>{selected?.unit ?? ''}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    aria-label="Remove item"
                    style={{ background: 'none', border: 'none', color: '#c53030', cursor: 'pointer', fontSize: 18, padding: 4 }}
                  >
                    X
                  </button>
                )}
              </QuoteItemRow>
            )
          })}
        </div>
        <button
          type="button"
          onClick={addItem}
          style={{
            marginTop: 12,
            background: 'none',
            border: '1.5px dashed rgba(0,0,0,0.2)',
            borderRadius: 14,
            padding: '10px 16px',
            fontSize: 14,
            cursor: 'pointer',
            color: 'var(--color-green)',
            width: '100%',
          }}
        >
          + Add another material
        </button>
      </div>

      <Divider />

      <PillTextarea name="message" rows={4} placeholder="Project details (size, timeline, delivery location, etc.)" />

      <ButtonEl type="submit" disabled={status === 'submitting'} style={{ marginTop: 8 }}>
        {status === 'submitting' ? 'Sending...' : 'Send Request'}
      </ButtonEl>
      {status === 'error' && <p style={{ color: '#c53030', textAlign: 'center' }}>Something went wrong. Please try again.</p>}
    </form>
  )
}
