'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Material = { id: string; name: string; unit: string }
type LineItem = { materialId: string; quantity: number }

const pillClass = "w-full px-5 py-4 border border-black/15 rounded-2xl text-base bg-white text-black focus:outline-none focus:border-green"

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
      <div className="text-center">
        <h2 className="text-xl font-bold mb-3">Request received.</h2>
        <p>Thanks -- your project details are with our team. We&apos;ll reach out directly by phone or email with your quotation shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {preselectedMaterial && (
        <p className="text-sm text-green m-0 text-center">Pre-filled: {preselectedMaterial.name}</p>
      )}

      <input name="customerName" placeholder="Full name" required className={pillClass} aria-label="Full name" />
      <input name="phone" type="tel" placeholder="Phone number" required className={pillClass} aria-label="Phone number" />
      <input name="email" type="email" placeholder="Email (optional)" className={pillClass} aria-label="Email" />

      <select name="projectType" className={pillClass} aria-label="Project type">
        <option value="residential">Residential</option>
        <option value="commercial">Commercial</option>
        <option value="renovation">Renovation</option>
        <option value="other">Other</option>
      </select>

      <hr className="border-t border-black/10 my-6" />

      <div>
        <p className="text-sm font-bold mb-3 text-center">Materials needed</p>
        <div className="flex flex-col gap-2.5">
          {items.map((item, index) => {
            const selected = materials.find((m) => m.id === item.materialId)
            return (
              <div key={index} className="flex gap-2 flex-wrap items-center max-[420px]:[&>select]:flex-[1_1_100%]">
                <select value={item.materialId} onChange={(e) => updateItem(index, { materialId: e.target.value })} className={`${pillClass} flex-1`}>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                  className={`${pillClass} w-[90px]`}
                />
                <span className="text-sm text-gray-500 w-[60px]">{selected?.unit ?? ''}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} aria-label="Remove item" className="bg-transparent border-none text-red-700 cursor-pointer text-lg p-1">
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
          className="mt-3 w-[200px] bg-transparent border border-dashed border-black/20 rounded-2xl px-4 py-2.5 text-sm cursor-pointer text-green"
        >
          + Add another material
        </button>
      </div>

      <hr className="border-t border-black/10 my-6" />

      <textarea name="message" rows={4} placeholder="Project details (size, timeline, delivery location, etc.)" className={`${pillClass} resize-y`} />

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-2 w-full px-8 py-3.5 rounded bg-[#01172f] text-white font-bold hover:bg-green-hover disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending...' : 'Send Request'}
      </button>
      {status === 'error' && <p className="text-red-700 text-center">Something went wrong. Please try again.</p>}
    </form>
  )
}
