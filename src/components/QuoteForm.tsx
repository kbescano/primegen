'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Material = { id: string; name: string; unit: string }
type LineItem = { materialId: string; quantity: number }

// Refined input styling: subtle background, smooth transitions, sharp focus states
const inputClass = "w-full px-4 py-3.5 border border-gray-200 rounded-xl text-[15px] bg-gray-50/50 text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 focus:bg-white"

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
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2 className="text-2xl font-medium tracking-tight text-gray-900">Request received.</h2>
        <p className="text-gray-500 max-w-md text-[15px] leading-relaxed">
          Thanks — your project details are with our team. We&apos;ll reach out directly by phone or email with your quotation shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      
      {/* Contact Info Section */}
      <div className="flex flex-col gap-4">
        {preselectedMaterial && (
          <div className="inline-flex self-start items-center px-3 py-1 mb-2 rounded-full bg-gray-100 text-[13px] font-medium text-gray-600">
            Pre-filled: <span className="ml-1 text-gray-900">{preselectedMaterial.name}</span>
          </div>
        )}

        <input name="customerName" placeholder="Full name" required className={inputClass} aria-label="Full name" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="phone" type="tel" placeholder="Phone number" required className={inputClass} aria-label="Phone number" />
          <input name="email" type="email" placeholder="Email (optional)" className={inputClass} aria-label="Email" />
        </div>

        <select name="projectType" className={inputClass} aria-label="Project type">
          <option value="residential">Residential Project</option>
          <option value="commercial">Commercial Project</option>
          <option value="renovation">Renovation</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Materials Section */}
      <div className="pt-4 pb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Materials Needed
        </h3>
        <div className="flex flex-col gap-3">
          {items.map((item, index) => {
            const selected = materials.find((m) => m.id === item.materialId)
            return (
              <div key={index} className="flex gap-3 flex-wrap items-center max-[420px]:[&>select]:flex-[1_1_100%]">
                <select 
                  value={item.materialId} 
                  onChange={(e) => updateItem(index, { materialId: e.target.value })} 
                  className={`${inputClass} flex-1 py-3`}
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    className={`${inputClass} w-[100px] py-3 pr-12 text-center`}
                  />
                  <span className="absolute right-4 text-[13px] text-gray-400 pointer-events-none">
                    {selected?.unit ?? ''}
                  </span>
                </div>

                {items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)} 
                    aria-label="Remove item" 
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
        
        <button
          type="button"
          onClick={addItem}
          className="mt-4 text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
        >
          <span>+</span> Add another material
        </button>
      </div>

      <textarea 
        name="message" 
        rows={4} 
        placeholder="Project details (size, timeline, delivery location, etc.)" 
        className={`${inputClass} resize-y`} 
      />

      {/* Quote Summary Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] mt-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Quote Summary
        </h3>

        <ul className="flex flex-col gap-3 m-0 p-0 list-none">
          {items.map((item, index) => {
            const mat = materials.find((m) => String(m.id) === String(item.materialId)) ?? materials[0]
            if (!mat) return null
            return (
              <li key={index} className="flex justify-between items-baseline gap-4 text-[15px]">
                <span className="text-gray-900 font-medium">{mat.name}</span>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-mono text-gray-900">{item.quantity}</span>
                  <span className="text-gray-500 text-sm">{mat.unit ?? ''}</span>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="border-t border-gray-100 mt-5 pt-4 flex justify-between items-center text-[13px]">
          <span className="font-medium text-gray-900 bg-gray-50 px-3 py-1 rounded-full">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
          <span className="text-gray-500">Pricing follows by phone/email</span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 flex flex-col items-center gap-3">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-4 rounded-xl bg-[#01172f] text-white text-[15px] font-medium tracking-wide hover:bg-gray-900 disabled:opacity-60 transition-all shadow-sm"
        >
          {status === 'submitting' ? 'Sending Request...' : 'Send Request'}
        </button>
        {status === 'error' && (
          <p className="text-red-600 text-[14px] font-medium">Something went wrong. Please try again.</p>
        )}
      </div>
    </form>
  )
}